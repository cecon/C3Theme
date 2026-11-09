//! Adaptador rusqlite do c3-engine. O motor roda o SQL dele nas conexões do sistema (rusqlite é síncrono,
//! então cada chamada vai para `spawn_blocking`), com a mesma biblioteca SQLite do resto do binário.
//!
//! Com o pool do sistema (r2d2, bb8 ou outro), implemente [`Connections`]:
//!
//! ```ignore
//! struct Pool(r2d2::Pool<SqliteConnectionManager>);
//! impl c3_engine_rusqlite::Connections for Pool {
//!     type Conn = r2d2::PooledConnection<SqliteConnectionManager>;
//!     fn get(&self) -> Result<Self::Conn, c3_engine_rusqlite::BoxError> {
//!         Ok(self.0.get()?)
//!     }
//! }
//! // no init do pool: c3_engine_rusqlite::prepare(conn)
//! let engine = Engine::builder(RusqliteStore::new(Pool(pool))).app(...).build().await?;
//! ```
//!
//! Sem pool, [`RusqliteStore::open`] abre uma conexão por pedido (abrir SQLite local é barato).

use std::ops::{Deref, DerefMut};
use std::path::PathBuf;
use std::sync::Arc;

use async_trait::async_trait;
use c3_engine::{Conn, Executed, Row, SqlValue, Store, StoreError, StoreErrorKind, Tx};
use regex::Regex;
use rusqlite::functions::FunctionFlags;
use rusqlite::types::{Type, Value, ValueRef};
use rusqlite::{ffi, Connection};

pub type BoxError = Box<dyn std::error::Error + Send + Sync>;

/// De onde o motor tira conexões. `get` roda dentro de `spawn_blocking`: pode bloquear (e, num pool
/// assíncrono, usar `Handle::current().block_on`). Toda conexão entregue precisa ter passado por [`prepare`].
pub trait Connections: Send + Sync + 'static {
    type Conn: DerefMut<Target = Connection> + Send + 'static;
    fn get(&self) -> Result<Self::Conn, BoxError>;
}

/// Liga o que o motor exige na conexão: `PRAGMA foreign_keys = ON` e a função `REGEXP` (sintaxe do crate
/// `regex`, a mesma do adaptador sqlx). O `build()` do motor confere as duas.
pub fn prepare(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch("PRAGMA foreign_keys = ON")?;
    conn.create_scalar_function(
        "regexp",
        2,
        FunctionFlags::SQLITE_UTF8 | FunctionFlags::SQLITE_DETERMINISTIC,
        |ctx| {
            // X REGEXP Y chama regexp(Y, X); o padrão compilado fica guardado enquanto a consulta roda
            let re = ctx.get_or_create_aux(0, |v| -> Result<Regex, BoxError> { Ok(Regex::new(v.as_str()?)?) })?;
            match ctx.get_raw(1) {
                ValueRef::Null => Ok(None),
                v => Ok(Some(
                    re.is_match(v.as_str().map_err(|e| rusqlite::Error::UserFunctionError(e.into()))?),
                )),
            }
        },
    )
}

/// Como [`prepare`], mais `PRAGMA query_only = ON`: as conexões do motor em `EngineBuilder::read_only`, quando
/// toda gravação é do sistema. As do escritor do sistema não passam por isto.
pub fn prepare_read_only(conn: &Connection) -> rusqlite::Result<()> {
    prepare(conn)?;
    conn.execute_batch("PRAGMA query_only = ON")
}

/// Conexão aberta por pedido, já com [`prepare`].
pub struct Opened(Connection);

impl Deref for Opened {
    type Target = Connection;
    fn deref(&self) -> &Connection {
        &self.0
    }
}

impl DerefMut for Opened {
    fn deref_mut(&mut self) -> &mut Connection {
        &mut self.0
    }
}

/// [`Connections`] sem pool: abre o arquivo a cada pedido.
pub struct OpenEach {
    path: PathBuf,
    read_only: bool,
}

impl Connections for OpenEach {
    type Conn = Opened;
    fn get(&self) -> Result<Opened, BoxError> {
        let conn = Connection::open(&self.path)?;
        conn.busy_timeout(std::time::Duration::from_secs(5))?;
        if self.read_only {
            prepare_read_only(&conn)?;
        } else {
            prepare(&conn)?;
        }
        Ok(Opened(conn))
    }
}

/// O banco do sistema, entregue ao motor com `Engine::builder(store)`.
pub struct RusqliteStore<C>(Arc<C>);

impl<C: Connections> RusqliteStore<C> {
    pub fn new(connections: C) -> Self {
        RusqliteStore(Arc::new(connections))
    }
}

impl RusqliteStore<OpenEach> {
    pub fn open(path: impl Into<PathBuf>) -> Self {
        RusqliteStore::new(OpenEach {
            path: path.into(),
            read_only: false,
        })
    }

    /// Como [`RusqliteStore::open`], com [`prepare_read_only`]: para `EngineBuilder::read_only`.
    pub fn open_read_only(path: impl Into<PathBuf>) -> Self {
        RusqliteStore::new(OpenEach {
            path: path.into(),
            read_only: true,
        })
    }
}

impl<C: Connections> RusqliteStore<C> {
    async fn guard(&self, begin: bool) -> Result<Guard<C::Conn>, StoreError> {
        let connections = self.0.clone();
        tokio::task::spawn_blocking(move || {
            let conn = connections.get().map_err(|e| StoreError::other(e.to_string()))?;
            let mut guard = Guard { conn, in_tx: false };
            if begin {
                guard.conn.execute_batch("BEGIN IMMEDIATE").map_err(store_error)?;
                guard.in_tx = true;
            }
            Ok(guard)
        })
        .await
        .map_err(|e| StoreError::other(e.to_string()))?
    }
}

#[async_trait]
impl<C: Connections> Store for RusqliteStore<C> {
    async fn conn(&self) -> Result<Box<dyn Conn>, StoreError> {
        Ok(Box::new(Blocking(Some(self.guard(false).await?))))
    }

    async fn begin(&self) -> Result<Box<dyn Tx>, StoreError> {
        Ok(Box::new(Blocking(Some(self.guard(true).await?))))
    }
}

/// Conexão com a transação aberta, se houver. Solta sem COMMIT (erro, pedido cancelado), desfaz.
struct Guard<C: DerefMut<Target = Connection>> {
    conn: C,
    in_tx: bool,
}

impl<C: DerefMut<Target = Connection>> Drop for Guard<C> {
    fn drop(&mut self) {
        if self.in_tx {
            let _ = self.conn.execute_batch("ROLLBACK");
        }
    }
}

/// A conexão vai e volta do `spawn_blocking` a cada chamada. Se o pedido for cancelado no meio, ela
/// fica com a thread bloqueante e o `Drop` do `Guard` desfaz a transação lá mesmo.
struct Blocking<C: DerefMut<Target = Connection> + Send + 'static>(Option<Guard<C>>);

impl<C: DerefMut<Target = Connection> + Send + 'static> Blocking<C> {
    async fn run<T: Send + 'static>(
        &mut self,
        f: impl FnOnce(&mut Guard<C>) -> rusqlite::Result<T> + Send + 'static,
    ) -> Result<T, StoreError> {
        let mut guard = self
            .0
            .take()
            .ok_or_else(|| StoreError::other("conexão perdida numa chamada anterior"))?;
        let (guard, result) = tokio::task::spawn_blocking(move || {
            let r = f(&mut guard);
            (guard, r)
        })
        .await
        .map_err(|e| StoreError::other(e.to_string()))?;
        self.0 = Some(guard);
        result.map_err(store_error)
    }
}

impl<C: DerefMut<Target = Connection> + Send + 'static> Drop for Blocking<C> {
    fn drop(&mut self) {
        // o ROLLBACK não roda na thread do runtime
        if let Some(guard) = self.0.take().filter(|g| g.in_tx) {
            if let Ok(handle) = tokio::runtime::Handle::try_current() {
                handle.spawn_blocking(move || drop(guard));
            }
        }
    }
}

#[async_trait]
impl<C: DerefMut<Target = Connection> + Send + 'static> Conn for Blocking<C> {
    async fn query(&mut self, sql: &str, params: &[SqlValue]) -> Result<Vec<Row>, StoreError> {
        let (sql, params) = (sql.to_owned(), params.to_vec());
        self.run(move |g| query(&g.conn, &sql, &params)).await
    }

    async fn execute(&mut self, sql: &str, params: &[SqlValue]) -> Result<Executed, StoreError> {
        let (sql, params) = (sql.to_owned(), params.to_vec());
        self.run(move |g| {
            let rows_affected = g
                .conn
                .prepare_cached(&sql)?
                .execute(rusqlite::params_from_iter(params.iter().map(value)))?;
            Ok(Executed {
                rows_affected: rows_affected as u64,
                last_insert_id: g.conn.last_insert_rowid(),
            })
        })
        .await
    }
}

#[async_trait]
impl<C: DerefMut<Target = Connection> + Send + 'static> Tx for Blocking<C> {
    async fn commit(mut self: Box<Self>) -> Result<(), StoreError> {
        self.run(|g| {
            g.conn.execute_batch("COMMIT")?;
            g.in_tx = false;
            Ok(())
        })
        .await
    }
}

fn value(v: &SqlValue) -> Value {
    match v {
        SqlValue::Null => Value::Null,
        SqlValue::Int(n) => Value::Integer(*n),
        SqlValue::Text(s) => Value::Text(s.clone()),
    }
}

fn query(conn: &Connection, sql: &str, params: &[SqlValue]) -> rusqlite::Result<Vec<Row>> {
    let mut stmt = conn.prepare_cached(sql)?;
    let n = stmt.column_count();
    let mut rows = stmt.query(rusqlite::params_from_iter(params.iter().map(value)))?;
    let mut out = Vec::new();
    while let Some(r) = rows.next()? {
        let mut row = Vec::with_capacity(n);
        for i in 0..n {
            // cada valor pelo tipo guardado de fato (no SQLite o tipo é do valor, não da coluna)
            row.push(match r.get_ref(i)? {
                ValueRef::Null => SqlValue::Null,
                ValueRef::Integer(n) => SqlValue::Int(n),
                ValueRef::Real(f) => SqlValue::Text(f.to_string()),
                ValueRef::Text(t) => SqlValue::Text(String::from_utf8_lossy(t).into_owned()),
                ValueRef::Blob(_) => return Err(rusqlite::Error::InvalidColumnType(i, "blob".into(), Type::Blob)),
            });
        }
        out.push(row);
    }
    Ok(out)
}

fn store_error(e: rusqlite::Error) -> StoreError {
    if let rusqlite::Error::SqliteFailure(err, msg) = &e {
        let message = msg.clone().unwrap_or_else(|| err.to_string());
        // ON DELETE RESTRICT no SQLite falha com SQLITE_CONSTRAINT_TRIGGER (1811), não com o código de FK
        let kind = match err.extended_code {
            ffi::SQLITE_CONSTRAINT_FOREIGNKEY => StoreErrorKind::ForeignKey,
            _ if message.contains("FOREIGN KEY constraint failed") => StoreErrorKind::ForeignKey,
            ffi::SQLITE_CONSTRAINT_UNIQUE | ffi::SQLITE_CONSTRAINT_PRIMARYKEY => StoreErrorKind::Unique,
            _ => StoreErrorKind::Other,
        };
        return StoreError { kind, message };
    }
    StoreError::other(e.to_string())
}
