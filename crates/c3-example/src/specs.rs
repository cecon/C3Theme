//! Os JSONs das entidades do exemplo, na ordem em que o motor carrega.

pub const ENTITIES: &[&str] = &[
    include_str!("../../../spec/v0/examples/company.json"),
    include_str!("../../../spec/v0/examples/customer.json"),
    include_str!("../../../spec/v0/examples/org_company.json"),
    include_str!("../../../spec/v0/examples/branch.json"),
    include_str!("../../../spec/v0/examples/seller.json"),
    include_str!("../../../spec/v0/examples/sales_order.json"),
    include_str!("../../../spec/v0/examples/company_contact.json"),
    include_str!("../../../spec/v0/examples/sales_order_item.json"),
    include_str!("../../../spec/v0/examples/company_fiscal.json"),
    include_str!("../../../spec/v0/examples/operator.json"),
    include_str!("../../../spec/v0/examples/permission.json"),
    include_str!("../../../spec/v0/examples/role.json"),
    include_str!("../../../spec/v0/examples/role_permission.json"),
    include_str!("../../../spec/v0/examples/activity.json"),
    include_str!("../../../spec/v0/examples/dining_table.json"),
    include_str!("../../../spec/v0/examples/product.json"),
    include_str!("../../../spec/v0/examples/question.json"),
    include_str!("../../../spec/v0/examples/question_option.json"),
    include_str!("../../../spec/v0/examples/product_question.json"),
    include_str!("../../../spec/v0/examples/promotion.json"),
    include_str!("../../../spec/v0/examples/promotion_product.json"),
    include_str!("../../../spec/v0/examples/store_settings.json"),
    include_str!("../../../spec/v0/examples/system_param.json"),
    include_str!("../../../spec/v0/examples/customer_pending.json"),
    include_str!("../../../spec/v0/examples/request_log.json"),
];

/// O banco das requisições (`store: "logs"`), na memória: uma conexão só e sem expirar, senão o banco some.
pub async fn logs_store() -> Result<c3_engine::sqlx::SqlxStore, sqlx::Error> {
    let pool = sqlx::sqlite::SqlitePoolOptions::new()
        .max_connections(1)
        .idle_timeout(None)
        .max_lifetime(None)
        .connect_with(c3_engine::sqlx::sqlite_options("sqlite::memory:")?)
        .await?;
    sqlx::raw_sql(include_str!("../logs.sql")).execute(&pool).await?;
    Ok(c3_engine::sqlx::SqlxStore::new(pool))
}
