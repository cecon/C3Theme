//! Validação de um registro antes de gravar: regras do schema campo a campo, `reference` existente e no
//! escopo do dono, `Hooks::validate` e as listas `with_parent`. E a tradução das violações do banco
//! (unique, FK) em erro do contrato.

use serde_json::{Map, Value};

use crate::children_write;
use crate::condition::Condition;
use crate::crud::{writable, Kids, Owner};
use crate::document;
use crate::error::{ApiError, FieldErrors};
use crate::org::Ctx;
use crate::ref_filter;
use crate::spec::{Entity, Field, FieldType, Scope, BRANCH_COL, COMPANY_COL};
use crate::store::{Conn, RowExt, StoreError, StoreErrorKind};
use crate::value::{self, SqlValue};

type Result<T> = std::result::Result<T, ApiError>;

/// Reference lido vem { id, title }; para validar e gravar, só o id interessa.
pub(crate) fn normalize_refs(entity: &Entity, record: &mut Map<String, Value>) {
    for f in entity.fields.iter().filter(|f| f.ty == FieldType::Reference) {
        if let Some(Value::Object(o)) = record.get(&f.name) {
            let id = o.get("id").cloned().unwrap_or(Value::Null);
            record.insert(f.name.clone(), id);
        }
    }
}

pub(crate) fn is_visible(entity: &Entity, f: &Field, record: &Map<String, Value>) -> bool {
    f.visible_when.as_ref().is_none_or(|c| c.eval(record, entity))
}

/// Valida o registro completo e devolve os valores das colunas graváveis, na ordem de `writable()`.
/// `owner` é a empresa/filial dona do registro (a ativa, na criação): referências precisam ser compatíveis.
/// Também valida as listas `with_parent` (`kids`, com o id do pai quando ele já existe), e os erros das
/// linhas voltam junto com os do pai.
pub(crate) async fn validate(
    conn: &mut dyn Conn,
    ctx: &Ctx<'_>,
    entity: &Entity,
    owner: Owner,
    record: &Map<String, Value>,
    kids: (Option<i64>, Kids),
) -> Result<(Vec<SqlValue>, children_write::Plan)> {
    // fora do rowAccess nem adianta validar: o usuário não enxergaria o que gravou
    crate::row_access::check_row(ctx, entity, record)?;
    let mut errors = FieldErrors::default();
    let values = check_fields(&mut *conn, ctx, entity, owner, record, kids.0.is_some(), &mut errors).await?;
    if errors.is_empty() {
        let rc = ctx.request_context();
        ctx.engine.0.hooks.validate(&rc, &entity.name, record, conn, &mut errors).await;
    }
    let plan = children_write::plan(&mut *conn, ctx, (entity, record), owner, kids.0, kids.1, &mut errors).await?;
    if errors.is_empty() && !plan.is_empty() {
        let rc = ctx.request_context();
        let lists = children_write::view(ctx, entity, &plan);
        ctx.engine
            .0
            .hooks
            .validate_children(&rc, &entity.name, record, &lists, &mut *conn, &mut errors)
            .await;
    }
    if errors.is_empty() {
        Ok((values, plan))
    } else {
        Err(ApiError::validation(errors))
    }
}

/// Regras do schema campo a campo (obrigatório, formato, tamanho, faixa, reference existente e no escopo).
/// Também valida o input de uma ação, que tem os mesmos tipos e regras. Num registro que já existe
/// (`existing`), campo só de escrita vazio mantém o gravado: não é obrigatório.
#[allow(clippy::too_many_arguments)]
pub(crate) async fn check_fields(
    conn: &mut dyn Conn,
    ctx: &Ctx<'_>,
    entity: &Entity,
    owner: Owner,
    record: &Map<String, Value>,
    existing: bool,
    errors: &mut FieldErrors,
) -> Result<Vec<SqlValue>> {
    let mut values = Vec::new();
    for f in writable(entity) {
        let v = record.get(&f.name);
        // campo escondido não vale nem é guardado: se o status deixou de ser "perdido", o motivo some
        if !is_visible(entity, f, record) || value::is_empty(v) {
            let required = !(existing && f.write_only) && (f.required || f.required_when.as_ref().is_some_and(|c| c.eval(record, entity)));
            if required && is_visible(entity, f, record) {
                errors.add(&f.name, "required", "Campo obrigatório.");
            }
            values.push(SqlValue::Null);
            continue;
        }
        // arquivo sem `data` num registro que existe é o gravado (metadados da leitura): fica como está
        if existing && f.ty == FieldType::File && !crate::field::file::is_new(v.unwrap()) {
            values.push(SqlValue::Null);
            continue;
        }
        match value::to_sql(f, v.unwrap()) {
            Err(code) => {
                errors.add(&f.name, code, format_message(f, code));
                values.push(SqlValue::Null);
            }
            Ok(sv) => {
                check_rules(f, &sv, errors);
                if let (Some(target), SqlValue::Int(id)) = (&f.reference, &sv) {
                    let target = &ctx.engine.0.entities[target];
                    let filter = ref_filter::condition(f, record, target);
                    let picked = Picked {
                        id: *id,
                        field: &f.name,
                        filter: filter.as_ref(),
                    };
                    check_reference(&mut *conn, ctx, target, picked, owner, errors).await?;
                }
                values.push(sv);
            }
        }
    }
    Ok(values)
}

/// O registro apontado precisa existir dentro do que o usuário enxerga e ser compatível com o dono:
/// pedido da filial A não aponta para vendedor da filial B, nem para cadastro de outra empresa.
/// O registro escolhido num reference: o id, o campo e o `filter` dele já resolvido para o registro.
struct Picked<'a> {
    id: i64,
    field: &'a str,
    filter: Option<&'a Condition>,
}

async fn check_reference(
    conn: &mut dyn Conn,
    ctx: &Ctx<'_>,
    target: &Entity,
    picked: Picked<'_>,
    owner: Owner,
    errors: &mut FieldErrors,
) -> Result<()> {
    let Picked { id, field, filter } = picked;
    let scope = ctx.read_scope(target, "r").map(|s| format!(" AND {s}")).unwrap_or_default();
    let cols = match target.scope {
        Scope::Group => "NULL, NULL".to_owned(),
        Scope::Company => format!("r.\"{COMPANY_COL}\", NULL"),
        Scope::Branch => format!("r.\"{COMPANY_COL}\", r.\"{BRANCH_COL}\""),
    };
    let mut params = Vec::new();
    let allowed = filter.map_or("1".to_owned(), |c| c.to_sql("r", &mut params));
    let sql = format!("SELECT {cols}, {allowed} FROM \"{}\" r WHERE r.\"id\" = ?{scope}", target.name);
    params.push(SqlValue::Int(id));
    let rows = conn.query(&sql, &params).await?;
    let Some(row) = rows.first() else {
        errors.add(field, "not_found", "Registro selecionado não existe mais.");
        return Ok(());
    };
    let (company, branch) = (row.int(0)?, row.int(1)?);
    let other_company = company.is_some() && owner.company.is_some() && company != owner.company;
    let other_branch = branch.is_some() && owner.branch.is_some() && branch != owner.branch;
    if row.int(2)? == Some(0) {
        errors.add(field, "not_allowed", "Esta opção não vale aqui.");
    } else if other_company {
        errors.add(field, "out_of_scope", "Este registro é de outra empresa.");
    } else if other_branch {
        errors.add(field, "out_of_scope", "Este registro é de outra filial.");
    }
    Ok(())
}

/// Formato e regras de um valor só (sem obrigatório nem reference no banco): origem e retorno de consulta.
pub(crate) fn check_value(f: &Field, v: &Value, errors: &mut FieldErrors) {
    match value::to_sql(f, v) {
        Err(code) => errors.add(&f.name, code, format_message(f, code)),
        Ok(sv) => check_rules(f, &sv, errors),
    }
}

fn format_message(f: &Field, code: &str) -> String {
    match (code, f.ty) {
        ("invalid_option", _) => "Opção inválida.".into(),
        ("too_large", FieldType::File) => format!("Arquivo maior que {} KB.", f.max_size / 1024),
        ("file_type", FieldType::File) => format!("Tipo de arquivo não aceito. Use {}.", f.accept.join(", ")),
        (_, FieldType::File) => "Arquivo vazio ou inválido.".into(),
        (_, FieldType::Decimal) => format!("Use um número com até {} casas decimais.", f.scale),
        (_, FieldType::Date) => "Data inválida (AAAA-MM-DD).".into(),
        (_, FieldType::Datetime) => "Data e hora inválidas.".into(),
        (_, FieldType::Integer) => "Use um número inteiro.".into(),
        _ => "Valor inválido.".into(),
    }
}

fn check_rules(f: &Field, v: &SqlValue, errors: &mut FieldErrors) {
    match v {
        SqlValue::Text(s) if f.ty.is_textual() => {
            let len = s.chars().count();
            if f.min_length.is_some_and(|m| len < m) {
                errors.add(
                    &f.name,
                    "too_short",
                    format!("Use pelo menos {} caracteres.", f.min_length.unwrap()),
                );
            }
            if f.max_length.is_some_and(|m| len > m) {
                errors.add(&f.name, "too_long", format!("Use no máximo {} caracteres.", f.max_length.unwrap()));
            }
            if f.pattern.as_ref().is_some_and(|p| !p.is_match(s)) {
                errors.add(&f.name, "pattern", "Formato inválido.");
            }
            if f.ty == FieldType::Email && !value::valid_email(s) {
                errors.add(&f.name, "pattern", "E-mail inválido.");
            }
            if let Some(code) = f.format.and_then(|fmt| document::error(fmt, s)) {
                let message = match code {
                    "pattern" => "Informe só os números e letras do documento, sem pontuação.",
                    _ => "Documento inválido: confira os dígitos.",
                };
                errors.add(&f.name, code, message);
            }
        }
        SqlValue::Int(0) if f.ty == FieldType::Flags && f.required => errors.add(&f.name, "required", "Marque pelo menos uma opção."),
        SqlValue::Int(n) if matches!(f.ty, FieldType::Integer | FieldType::Decimal) => {
            let x = if f.ty == FieldType::Decimal {
                *n as f64 / 10f64.powi(f.scale as i32)
            } else {
                *n as f64
            };
            if f.min.is_some_and(|m| x < m) {
                errors.add(&f.name, "min", format!("O mínimo é {}.", f.min.unwrap()));
            }
            if f.max.is_some_and(|m| x > m) {
                errors.add(&f.name, "max", format!("O máximo é {}.", f.max.unwrap()));
            }
        }
        _ => {}
    }
}

/// Traduz violação de constraint do banco em erro do contrato.
pub(crate) fn map_write_error(e: StoreError, entity: &Entity) -> ApiError {
    match e.kind {
        StoreErrorKind::ForeignKey => ApiError::conflict("Este registro está ligado a outros e não pode ser alterado assim.", None),
        StoreErrorKind::Unique => {
            // "UNIQUE constraint failed: customer.email" (ou várias colunas separadas por vírgula)
            let mut fields = FieldErrors::default();
            for col in e.message.rsplit(':').next().unwrap_or_default().split(',') {
                if let Some((_, name)) = col.trim().split_once('.') {
                    if entity.field(name).is_some() {
                        fields.add(name, "unique", "Já existe um registro com este valor.");
                    }
                }
            }
            ApiError::conflict("Já existe um registro com estes dados.", Some(fields))
        }
        StoreErrorKind::Other => e.into(),
    }
}
