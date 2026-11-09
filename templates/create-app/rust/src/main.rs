//! Backend de {{title}} no c3-engine. As telas são os JSONs de spec/ (app.json e uma entidade por arquivo); o banco
//! é das migrations/; as regras de negócio ficam em `Regras` (o trait `Hooks`).
//!
//! Variáveis: DATABASE_URL (padrão sqlite://{{name}}.db), PORT (padrão 3001).

use axum::Router;
use c3_engine::sqlx::{sqlite_options, SqlxStore};
use c3_engine::Engine;
use sqlx::sqlite::SqlitePoolOptions;

/// O que o JSON não diz: validação entre campos, filiais e permissões do usuário, ações. Todos os métodos de
/// `Hooks` são opcionais; veja a skill c3-backend.
struct Regras;

impl c3_engine::Hooks for Regras {}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite://{{name}}.db".into());
    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".into());

    let pool = SqlitePoolOptions::new().connect_with(sqlite_options(&url)?).await?;
    sqlx::migrate!().run(&pool).await?;

    // entidade nova: o JSON em spec/, o nome em app.json, a migration e uma linha .entity() aqui.
    // O motor confere spec x banco no build e recusa subir se não baterem.
    let engine = Engine::builder(SqlxStore::new(pool))
        .app(include_str!("../spec/app.json"))
        .entity(include_str!("../spec/contact.json"))
        .hooks(Regras)
        .build()
        .await?;

    let app = Router::new().nest("/api", engine.router());
    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{port}")).await?;
    println!("{{api}} ouvindo em http://127.0.0.1:{port}/api");
    axum::serve(listener, app).await?;
    Ok(())
}
