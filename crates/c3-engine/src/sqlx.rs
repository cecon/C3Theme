//! Adaptador sqlx (feature `sqlx`): para o sistema que já usa sqlx 0.8 com SQLite, como o `c3-example`.
//!
//! ```ignore
//! let pool = SqlitePoolOptions::new().connect_with(c3_engine::sqlx::sqlite_options(&url)?).await?;
//! let engine = Engine::builder(SqlxStore::new(pool.clone())).app(...).build().await?;
//! ```

use std::str::FromStr;

use ::sqlx::pool::PoolConnection;
use ::sqlx::sqlite::{SqliteArguments, SqliteConnectOptions, SqlitePool, SqliteRow};
use ::sqlx::{Arguments, Column, Row, Sqlite, Transaction, TypeInfo, ValueRef};
use async_trait::async_trait;

use crate::error::ApiError;
use crate::store::{Conn, Executed, Row as StoreRow, SqlValue, Store, StoreError, StoreErrorKind, Tx};

/// Opções de conexão que o c3-engine exige: chaves estrangeiras ligadas e `REGEXP`
/// (usado por `contains` e pela busca, com maiúsculas Unicode). O `build()` confere as duas.
pub fn sqlite_options(url: &str) -> Result<SqliteConnectOptions, ::sqlx::Error> {
    Ok(SqliteConnectOptions::from_str(url)?
        .foreign_keys(true)
        .with_regexp()
        .create_if_missing(true))
}

/// Como [`sqlite_options`], com `PRAGMA query_only`: o pool do motor em `EngineBuilder::read_only`. Não cria o
/// arquivo (quem cria e migra o banco é o sistema). O escritor do sistema usa outro pool, sem isto.
pub fn sqlite_options_read_only(url: &str) -> Result<SqliteConnectOptions, ::sqlx::Error> {
    Ok(sqlite_options(url)?.create_if_missing(false).pragma("query_only", "ON"))
}

/// O pool do sistema, entregue ao motor. Crie-o com [`sqlite_options`].
#[derive(Clone)]
pub struct SqlxStore(SqlitePool);

impl SqlxStore {
    pub fn new(pool: SqlitePool) -> Self {
        SqlxStore(pool)
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.0
    }
}

#[async_trait]
impl Store for SqlxStore {
    async fn conn(&self) -> Result<Box<dyn Conn>, StoreError> {
        Ok(Box::new(Plain(self.0.acquire().await.map_err(store_error)?)))
    }

    async fn begin(&self) -> Result<Box<dyn Tx>, StoreError> {
        Ok(Box::new(Txn(self.0.begin_with("BEGIN IMMEDIATE").await.map_err(store_error)?)))
    }
}

struct Plain(PoolConnection<Sqlite>);
struct Txn(Transaction<'static, Sqlite>);

#[async_trait]
impl Conn for Plain {
    async fn query(&mut self, sql: &str, params: &[SqlValue]) -> Result<Vec<StoreRow>, StoreError> {
        let rows = ::sqlx::query_with(sql, args(params))
            .fetch_all(&mut *self.0)
            .await
            .map_err(store_error)?;
        rows.iter().map(row).collect()
    }

    async fn execute(&mut self, sql: &str, params: &[SqlValue]) -> Result<Executed, StoreError> {
        let done = ::sqlx::query_with(sql, args(params))
            .execute(&mut *self.0)
            .await
            .map_err(store_error)?;
        Ok(Executed {
            rows_affected: done.rows_affected(),
            last_insert_id: done.last_insert_rowid(),
        })
    }
}

#[async_trait]
impl Conn for Txn {
    async fn query(&mut self, sql: &str, params: &[SqlValue]) -> Result<Vec<StoreRow>, StoreError> {
        let rows = ::sqlx::query_with(sql, args(params))
            .fetch_all(&mut *self.0)
            .await
            .map_err(store_error)?;
        rows.iter().map(row).collect()
    }

    async fn execute(&mut self, sql: &str, params: &[SqlValue]) -> Result<Executed, StoreError> {
        let done = ::sqlx::query_with(sql, args(params))
            .execute(&mut *self.0)
            .await
            .map_err(store_error)?;
        Ok(Executed {
            rows_affected: done.rows_affected(),
            last_insert_id: done.last_insert_rowid(),
        })
    }
}

#[async_trait]
impl Tx for Txn {
    async fn commit(self: Box<Self>) -> Result<(), StoreError> {
        self.0.commit().await.map_err(store_error)
    }
}

fn args(params: &[SqlValue]) -> SqliteArguments<'static> {
    let mut a = SqliteArguments::default();
    for p in params {
        let r = match p {
            SqlValue::Null => a.add(None::<i64>),
            SqlValue::Int(n) => a.add(*n),
            SqlValue::Text(s) => a.add(s.clone()),
        };
        r.expect("bind de tipo suportado");
    }
    a
}

/// Cada valor pelo tipo guardado de fato (no SQLite o tipo é do valor, não da coluna).
fn row(r: &SqliteRow) -> Result<StoreRow, StoreError> {
    (0..r.columns().len())
        .map(|i| {
            let raw = r.try_get_raw(i).map_err(store_error)?;
            if raw.is_null() {
                return Ok(SqlValue::Null);
            }
            let ty = raw.type_info().name().to_owned();
            match ty.as_str() {
                "INTEGER" | "BOOLEAN" => r.try_get::<i64, _>(i).map(SqlValue::Int),
                "REAL" => r.try_get::<f64, _>(i).map(|f| SqlValue::Text(f.to_string())),
                "TEXT" | "DATE" | "TIME" | "DATETIME" => r.try_get::<String, _>(i).map(SqlValue::Text),
                _ => {
                    return Err(StoreError::other(format!(
                        "coluna {}: tipo {ty} não suportado",
                        r.columns()[i].name()
                    )))
                }
            }
            .map_err(store_error)
        })
        .collect()
}

fn store_error(e: ::sqlx::Error) -> StoreError {
    if let ::sqlx::Error::Database(db) = &e {
        // ON DELETE RESTRICT no SQLite falha com SQLITE_CONSTRAINT_TRIGGER (1811), não com o código de FK
        let kind = if db.kind() == ::sqlx::error::ErrorKind::ForeignKeyViolation || db.message().contains("FOREIGN KEY constraint failed") {
            StoreErrorKind::ForeignKey
        } else if db.kind() == ::sqlx::error::ErrorKind::UniqueViolation {
            StoreErrorKind::Unique
        } else {
            StoreErrorKind::Other
        };
        return StoreError {
            kind,
            message: db.message().to_owned(),
        };
    }
    StoreError::other(e.to_string())
}

/// Para o sistema que grava pelo mesmo sqlx (hooks `write` e `run_action`) usar `?` direto.
impl From<::sqlx::Error> for ApiError {
    fn from(e: ::sqlx::Error) -> Self {
        store_error(e).into()
    }
}
