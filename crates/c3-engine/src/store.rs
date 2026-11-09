//! Acesso ao banco sem driver no núcleo: o motor gera o SQL (dialeto SQLite) e quem executa é o
//! adaptador que o sistema escolhe. `c3_engine::sqlx` (feature `sqlx`) vem neste crate; o de rusqlite é o
//! crate `c3-engine-rusqlite`. Assim o motor usa a mesma biblioteca SQLite do sistema e nunca disputa o
//! `links = "sqlite3"` com ela.

use async_trait::async_trait;

use crate::error::ApiError;
pub use crate::value::SqlValue;

/// Uma linha, na ordem das colunas do SELECT. INTEGER vem `Int`, TEXT vem `Text`, NULL vem `Null`.
/// O motor só guarda INTEGER e TEXT (ver README); REAL o adaptador entrega como texto, BLOB é erro.
pub type Row = Vec<SqlValue>;

/// Resultado de um INSERT, UPDATE ou DELETE.
#[derive(Debug, Clone, Copy, Default)]
pub struct Executed {
    pub rows_affected: u64,
    pub last_insert_id: i64,
}

/// O que o motor precisa saber de um erro do banco: violação de unicidade e de chave estrangeira viram
/// `409` do contrato; o resto vira `500` (e vai para o log, nunca para o cliente).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StoreErrorKind {
    Unique,
    ForeignKey,
    Other,
}

#[derive(Debug, Clone)]
pub struct StoreError {
    pub kind: StoreErrorKind,
    /// Mensagem do SQLite. Em unicidade, o motor lê as colunas dela ("UNIQUE constraint failed: t.a, t.b").
    pub message: String,
}

impl StoreError {
    pub fn other(message: impl Into<String>) -> Self {
        StoreError {
            kind: StoreErrorKind::Other,
            message: message.into(),
        }
    }
}

impl std::fmt::Display for StoreError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}: {}", self.kind, self.message)
    }
}

impl std::error::Error for StoreError {}

impl From<StoreError> for ApiError {
    fn from(e: StoreError) -> Self {
        // nunca vaza detalhes para o cliente; o sistema enxerga no log
        eprintln!("c3-engine: erro de banco: {e}");
        ApiError::internal()
    }
}

/// Uma conexão (ou transação) do adaptador. Parâmetros no lugar de `?`, na ordem.
#[async_trait]
pub trait Conn: Send {
    async fn query(&mut self, sql: &str, params: &[SqlValue]) -> Result<Vec<Row>, StoreError>;
    async fn execute(&mut self, sql: &str, params: &[SqlValue]) -> Result<Executed, StoreError>;
}

/// Transação `BEGIN IMMEDIATE`. Solta sem `commit`, desfaz.
#[async_trait]
pub trait Tx: Conn {
    async fn commit(self: Box<Self>) -> Result<(), StoreError>;
}

/// O banco do sistema, visto pelo motor. As conexões precisam de `PRAGMA foreign_keys = ON` e da função
/// `REGEXP` com a sintaxe do crate `regex` (o `build()` confere as duas); cada adaptador traz como ligar.
#[async_trait]
pub trait Store: Send + Sync + 'static {
    /// Conexão de leitura, sem transação.
    async fn conn(&self) -> Result<Box<dyn Conn>, StoreError>;
    /// Transação de escrita (`BEGIN IMMEDIATE`).
    async fn begin(&self) -> Result<Box<dyn Tx>, StoreError>;
}

/// Leitura tipada de uma coluna. Tipo inesperado é erro de banco (500), como num `try_get` de driver.
pub(crate) trait RowExt {
    fn int(&self, i: usize) -> Result<Option<i64>, StoreError>;
    fn text(&self, i: usize) -> Result<Option<String>, StoreError>;
}

impl RowExt for [SqlValue] {
    fn int(&self, i: usize) -> Result<Option<i64>, StoreError> {
        match self.get(i) {
            Some(SqlValue::Null) => Ok(None),
            Some(SqlValue::Int(n)) => Ok(Some(*n)),
            other => Err(StoreError::other(format!("coluna {i}: esperava INTEGER, veio {other:?}"))),
        }
    }

    fn text(&self, i: usize) -> Result<Option<String>, StoreError> {
        match self.get(i) {
            Some(SqlValue::Null) => Ok(None),
            Some(SqlValue::Text(s)) => Ok(Some(s.clone())),
            other => Err(StoreError::other(format!("coluna {i}: esperava TEXT, veio {other:?}"))),
        }
    }
}

/// Primeira coluna da primeira linha, como inteiro (COUNT, PRAGMA).
pub(crate) async fn scalar_int(conn: &mut dyn Conn, sql: &str, params: &[SqlValue]) -> Result<Option<i64>, StoreError> {
    match conn.query(sql, params).await?.first() {
        Some(row) => row.int(0),
        None => Ok(None),
    }
}

/// Primeira coluna de cada linha, como texto (nomes de colunas e índices).
pub(crate) async fn column_texts(conn: &mut dyn Conn, sql: &str, params: &[SqlValue]) -> Result<Vec<String>, StoreError> {
    let mut out = Vec::new();
    for row in conn.query(sql, params).await? {
        out.extend(row.text(0)?);
    }
    Ok(out)
}
