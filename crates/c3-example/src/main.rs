//! CRM de exemplo da spec (spec/v0/examples) servido pelo c3-engine.
//! É o alvo da suíte de conformidade: `pnpm conformance` sobe este servidor e roda os testes contra ele.
//!
//! Variáveis: DATABASE_URL (padrão sqlite://c3-example.db), PORT (padrão 3000).

mod attachments;
mod certificates;
mod discount;
mod invoices;
mod items;
mod login;
mod lookups;
mod menu;
mod notifications;
mod operators;
mod orders;
mod prices;
mod products;
mod referrals;
mod search;
mod shutdown;
mod sources;
mod tables;

use axum::http::request::Parts;
use axum::Router;
use c3_engine::sqlx::{sqlite_options, SqlxStore};
use c3_engine::{
    ActionCall, ActionOutcome, ApiError, BulkActionCall, Capabilities, ChildWrite, Conn, Engine, FieldErrors, FileCall, FileContent,
    ListActionCall, LookupCall, OrgAccess, PrefillCall, Preview, PreviewCall, RequestContext, SourceCall, SourceSql, WriteCall,
};
use serde_json::{Map, Value};
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};

/// Usuários de teste da suíte (spec/v0/conformance/README.md). Autenticação de verdade é do sistema;
/// aqui o "token" é o nome do usuário. Sem Authorization, o usuário enxerga tudo.
/// Também são as regras de negócio do CRM: as ações do cliente e do pedido, e o escritor próprio do
/// pedido (`writer`, outro pool sobre o mesmo arquivo), que grava com auditoria.
struct TestUsers {
    pool: SqlitePool,
    writer: SqlitePool,
}

fn user(req: &Parts) -> Option<&str> {
    token(req).map(|t| t.split('@').next().unwrap_or(t))
}

/// `Bearer caio@7`: o usuário `caio`, da empresa 7 (o `$user` de company.rowAccess).
fn token(req: &Parts) -> Option<&str> {
    req.headers.get("authorization")?.to_str().ok()?.strip_prefix("Bearer ")
}

#[c3_engine::async_trait]
impl c3_engine::Hooks for TestUsers {
    fn org_access(&self, req: &Parts) -> OrgAccess {
        match user(req) {
            None => OrgAccess::all().default_branch("1"),
            // o login de demonstração (src/login.rs): enxerga e grava em todas as filiais
            Some("admin") => OrgAccess::all().default_branch("1"),
            // Alfa: grava na matriz, só consulta o Centro
            Some("ana") => OrgAccess::branches(["1", "2"]).default_branch("1"),
            // Beta: só a loja 1
            Some("beto") => OrgAccess::branches(["3"]).default_branch("3"),
            // Caio: todas as filiais, mas sem os códigos de fornecedor, fiscal e crédito (ver `permitted`)
            Some("caio") => OrgAccess::all().default_branch("1"),
            Some(_) => OrgAccess::branches(Vec::<String>::new()),
        }
    }

    fn capabilities(&self, entity: &str, branch: Option<&str>, req: &Parts) -> Capabilities {
        match (user(req), branch) {
            (Some("ana"), Some("2")) if entity == "seller" => Capabilities::NONE,
            (Some("ana"), Some("2")) => Capabilities::READ_ONLY,
            // como no Nati: a filha with_parent só lê; quem grava é o formulário do pai
            _ if entity == "company_fiscal" => Capabilities::READ_ONLY,
            _ => Capabilities::ALL,
        }
    }

    // códigos de company.json (rowAccess, seções) e customer.json (credit_limit)
    fn permitted(&self, code: &str, _branch: Option<&str>, req: &Parts) -> bool {
        user(req) != Some("caio") || ["empresa.cliente", "empresa.propria"].contains(&code)
    }

    fn user_value(&self, key: &str, req: &Parts) -> Option<serde_json::Value> {
        let company = token(req)?.split_once('@')?.1;
        (key == "company").then(|| company.into())
    }

    // regras do cardápio (src/menu.rs)
    async fn validate(
        &self,
        _ctx: &RequestContext<'_>,
        entity: &str,
        record: &Map<String, Value>,
        conn: &mut dyn Conn,
        errors: &mut FieldErrors,
    ) {
        menu::validate(entity, record, conn, errors).await;
    }

    async fn validate_children(
        &self,
        _ctx: &RequestContext<'_>,
        entity: &str,
        record: &Map<String, Value>,
        children: &[ChildWrite],
        _conn: &mut dyn Conn,
        errors: &mut FieldErrors,
    ) {
        menu::validate_children(entity, record, children, errors);
    }

    // o pedido e os itens são gravados pelo sistema (src/orders.rs e src/items.rs), com auditoria, e o
    // operador também (src/operators.rs, faz o hash da senha); os outros cadastros, pelo motor
    fn delegates_writes(&self, entity: &str) -> bool {
        matches!(entity, "sales_order" | "operator")
    }

    async fn write(&self, call: WriteCall<'_>) -> Result<i64, ApiError> {
        if call.entity == "operator" {
            return operators::write(&self.writer, call).await;
        }
        let who = user(call.ctx.req).map(str::to_owned);
        orders::write(&self.writer, call, who.as_deref()).await
    }

    // ana só consulta o Centro: lê o pedido de lá, mas não cancela
    fn action_allowed(&self, _entity: &str, _action: &str, branch: Option<&str>, req: &Parts) -> bool {
        !matches!((user(req), branch), (Some("ana"), Some("2")))
    }

    // Num sistema real, aqui entra o caso de uso (cancelar venda etc.), com a transação e a auditoria dele.
    async fn run_action(&self, call: ActionCall<'_>) -> Result<ActionOutcome, ApiError> {
        let id: i64 = call.id.parse().map_err(|_| ApiError::internal())?;
        let text = |k: &str| call.input[k].as_str().map(str::to_owned);
        match (call.entity, call.action) {
            ("company", "replace_certificate") => certificates::replace(&self.pool, call).await,
            ("promotion", "end") => menu::end_promotion(&self.pool, call).await,
            ("product", "duplicate") => products::duplicate(&self.pool, call).await,
            ("dining_table", _) => tables::run(&self.pool, call.action, id).await,
            ("product", "discount") => discount::apply(&self.pool, call).await,
            ("customer", "churn") => {
                let reason = match text("reason").as_deref() {
                    Some("price") => "Preço",
                    Some("competitor") => "Foi para a concorrência",
                    _ => "Outro",
                };
                let reason = match text("details") {
                    Some(d) => format!("{reason}: {d}"),
                    None => reason.to_owned(),
                };
                sqlx::query("UPDATE customer SET status = 'churned', churn_reason = ? WHERE id = ?")
                    .bind(reason)
                    .bind(id)
                    .execute(&self.pool)
                    .await?;
                Ok(ActionOutcome::default())
            }
            ("customer", "reactivate") => {
                sqlx::query("UPDATE customer SET status = 'active', churn_reason = NULL WHERE id = ?")
                    .bind(id)
                    .execute(&self.pool)
                    .await?;
                Ok(ActionOutcome::message("Cliente reativado."))
            }
            ("sales_order", "cancel") => {
                let reason = text("reason").unwrap_or_default();
                if reason.to_lowercase().contains("teste") {
                    // regra de negócio recusando o input: volta como erro do campo, igual à validação
                    let mut errors = FieldErrors::default();
                    errors.add("reason", "pattern", "Descreva o motivo real do cancelamento.");
                    return Err(ApiError::validation(errors));
                }
                // a regra confere de novo o estado na própria gravação: dois cancelamentos ao mesmo tempo
                let done = sqlx::query("UPDATE sales_order SET status = 'canceled', cancel_reason = ? WHERE id = ? AND status = 'open'")
                    .bind(reason)
                    .bind(id)
                    .execute(&self.pool)
                    .await?;
                if done.rows_affected() == 0 {
                    return Err(ApiError::conflict("O pedido já foi cancelado.", None));
                }
                Ok(ActionOutcome::default())
            }
            _ => Err(ApiError::internal()),
        }
    }

    // Ação da lista: aplica uma jornada a todos os vendedores do canal, na filial ativa (seller é por filial).
    async fn run_list_action(&self, call: ListActionCall<'_>) -> Result<ActionOutcome, ApiError> {
        let branch: i64 = match (call.entity, call.action, &call.ctx.active_branch) {
            ("product", "reprice", _) => return prices::apply(&self.pool, call).await,
            ("product", "scale_file", _) => return products::scale_file(&self.pool, call).await,
            ("customer", "referrals", _) => return referrals::apply(&self.pool, call).await,
            ("seller", "apply_schedule", Some(b)) => b.parse().map_err(|_| ApiError::internal())?,
            ("seller", "apply_schedule", None) => return Err(ApiError::bad_request("Escolha a filial ativa.")),
            _ => return Err(ApiError::internal()),
        };
        let done = sqlx::query("UPDATE seller SET work_days = ? WHERE channel = ? AND org_branch_id = ?")
            .bind(call.input["work_days"].as_i64())
            .bind(call.input["channel"].as_str())
            .bind(branch)
            .execute(&self.pool)
            .await?;
        Ok(ActionOutcome::message(format!(
            "Jornada aplicada a {} vendedor(es).",
            done.rows_affected()
        )))
    }

    async fn action_prefill(&self, call: PrefillCall<'_>) -> Result<Map<String, Value>, ApiError> {
        prices::prefill(&self.pool, call).await
    }

    async fn run_bulk_action(&self, call: BulkActionCall<'_>) -> Result<ActionOutcome, ApiError> {
        match (call.entity, call.action) {
            ("sales_order", "invoice") => invoices::run(&self.pool, call).await,
            ("product", "labels") => prices::labels(call),
            ("customer_pending", "postpone") => sources::postpone(&self.pool, call).await,
            _ => Err(ApiError::internal()),
        }
    }

    async fn preview_action(&self, call: PreviewCall<'_>) -> Result<Preview, ApiError> {
        match (call.entity, call.action) {
            ("product", "discount") => discount::preview(call),
            ("product", "reprice") => prices::preview(&self.pool, call).await,
            ("sales_order", "invoice") => invoices::preview(call),
            _ => Ok(Preview::default()),
        }
    }

    async fn lookup(&self, call: LookupCall<'_>) -> Result<Map<String, Value>, ApiError> {
        lookups::run(call)
    }

    async fn source(&self, call: SourceCall<'_>) -> Result<SourceSql, ApiError> {
        sources::source(call)
    }

    async fn read_file(&self, call: FileCall<'_>) -> Result<FileContent, ApiError> {
        attachments::read(&self.pool, call).await
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite://c3-example.db".into());
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".into());

    let pool = SqlitePoolOptions::new().connect_with(sqlite_options(&url)?).await?;
    sqlx::migrate!().run(&pool).await?;
    let writer = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(sqlite_options(&url)?)
        .await?;

    let engine = Engine::builder(SqlxStore::new(pool.clone()))
        .app(include_str!("../../../spec/v0/examples/app.json"))
        .entity(include_str!("../../../spec/v0/examples/company.json"))
        .entity(include_str!("../../../spec/v0/examples/customer.json"))
        .entity(include_str!("../../../spec/v0/examples/org_company.json"))
        .entity(include_str!("../../../spec/v0/examples/branch.json"))
        .entity(include_str!("../../../spec/v0/examples/seller.json"))
        .entity(include_str!("../../../spec/v0/examples/sales_order.json"))
        .entity(include_str!("../../../spec/v0/examples/company_contact.json"))
        .entity(include_str!("../../../spec/v0/examples/sales_order_item.json"))
        .entity(include_str!("../../../spec/v0/examples/company_fiscal.json"))
        .entity(include_str!("../../../spec/v0/examples/operator.json"))
        .entity(include_str!("../../../spec/v0/examples/permission.json"))
        .entity(include_str!("../../../spec/v0/examples/role.json"))
        .entity(include_str!("../../../spec/v0/examples/role_permission.json"))
        .entity(include_str!("../../../spec/v0/examples/activity.json"))
        .entity(include_str!("../../../spec/v0/examples/dining_table.json"))
        .entity(include_str!("../../../spec/v0/examples/product.json"))
        .entity(include_str!("../../../spec/v0/examples/question.json"))
        .entity(include_str!("../../../spec/v0/examples/question_option.json"))
        .entity(include_str!("../../../spec/v0/examples/product_question.json"))
        .entity(include_str!("../../../spec/v0/examples/promotion.json"))
        .entity(include_str!("../../../spec/v0/examples/promotion_product.json"))
        .entity(include_str!("../../../spec/v0/examples/store_settings.json"))
        .entity(include_str!("../../../spec/v0/examples/customer_pending.json"))
        .hooks(TestUsers {
            pool: pool.clone(),
            writer,
        })
        .notifications(notifications::Bells::default())
        .search(search::Products(pool))
        .build()
        .await?;

    let app = Router::new().nest("/api", engine.router().merge(login::router()));
    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{port}")).await?;
    println!("c3-example ouvindo em http://127.0.0.1:{port}/api");
    // SIGTERM (a conformidade encerra assim) e Ctrl+C saem limpos: a medição de cobertura só grava na saída normal
    axum::serve(listener, app).with_graceful_shutdown(shutdown::signal()).await?;
    Ok(())
}
