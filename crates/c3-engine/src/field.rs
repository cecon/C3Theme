//! Campo de uma entidade (ou do input de uma ação): o JSON da spec e a forma tipada que o backend usa
//! para validar, gravar e consultar.

pub(crate) mod file;

use serde::Deserialize;
use serde_json::Value;

use crate::access::Access;
use crate::condition::Condition;
use crate::document::Format;
use crate::spec::{FieldConditions, FieldType, BRANCH_COL, COMPANY_COL};
use crate::value;

#[derive(Debug, Clone, Deserialize)]
pub struct EnumOption {
    pub value: Value,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RawField {
    name: String,
    #[serde(rename = "type")]
    ty: FieldType,
    #[serde(default)]
    required: bool,
    #[serde(default)]
    read_only: bool,
    #[serde(default)]
    write_only: bool,
    #[serde(default)]
    create_only: bool,
    #[serde(default)]
    unique: bool,
    #[serde(default)]
    default: Option<Value>,
    min_length: Option<usize>,
    max_length: Option<usize>,
    pattern: Option<String>,
    format: Option<Format>,
    min: Option<f64>,
    max: Option<f64>,
    scale: Option<u32>,
    #[serde(default)]
    options: Vec<EnumOption>,
    entity: Option<String>,
    #[serde(default)]
    accept: Vec<String>,
    max_size: Option<usize>,
    visible_when: Option<Value>,
    required_when: Option<Value>,
    read_only_when: Option<Value>,
    filter: Option<Value>,
    access: Option<Value>,
}

#[derive(Debug, Clone)]
pub struct Field {
    pub name: String,
    pub ty: FieldType,
    pub required: bool,
    pub read_only: bool,
    /// Senha, PIN: só se grava (spec: `writeOnly`). Nunca sai do banco pelo motor: a leitura traz `null`,
    /// não filtra, não ordena, não busca. Vazio na alteração mantém o valor gravado.
    pub write_only: bool,
    /// Só se informa na criação (spec: `createOnly`): na alteração, mudar o valor é 422 `read_only`.
    pub create_only: bool,
    pub unique: bool,
    pub default: Option<Value>,
    pub min_length: Option<usize>,
    pub max_length: Option<usize>,
    pub pattern: Option<regex::Regex>,
    /// CPF/CNPJ com dígito verificador (spec: `format`).
    pub format: Option<Format>,
    pub min: Option<f64>,
    pub max: Option<f64>,
    pub scale: u32,
    pub options: Vec<value::SqlValue>,
    pub reference: Option<String>,
    /// `file`: extensões aceitas, minúsculas e com ponto (`.pfx`); vazio aceita qualquer uma.
    pub accept: Vec<String>,
    /// `file`: tamanho máximo em bytes, depois de decodificado.
    pub max_size: usize,
    pub visible_when: Option<Condition>,
    pub required_when: Option<Condition>,
    /// Trava o campo na alteração quando vale para o registro como está gravado (spec: `readOnlyWhen`).
    pub read_only_when: Option<Condition>,
    /// Só em reference (spec: `filter`): condição sobre a entidade apontada, ainda em JSON porque os valores
    /// `{"$field": ...}` vêm do registro de quem aponta (ver `ref_filter.rs`).
    pub ref_filter: Option<Value>,
    /// Códigos de permissão para ver e para alterar (spec: `access`, somado ao da seção; ver `access.rs`).
    pub access: Access,
}

/// O `id` implícito, como uma condição o enxerga: um reference (string no fio, inteiro na coluna). Só condições
/// citam `id` (excluir o próprio registro da lista de um reference, `where` com ids marcados).
pub(crate) fn id_field() -> &'static Field {
    static ID: std::sync::LazyLock<Field> = std::sync::LazyLock::new(|| Field {
        name: "id".into(),
        ty: FieldType::Reference,
        required: false,
        read_only: true,
        write_only: false,
        create_only: false,
        unique: true,
        default: None,
        min_length: None,
        max_length: None,
        pattern: None,
        format: None,
        min: None,
        max: None,
        scale: 0,
        options: Vec::new(),
        reference: None,
        visible_when: None,
        required_when: None,
        read_only_when: None,
        accept: Vec::new(),
        max_size: 0,
        ref_filter: None,
        access: Access::default(),
    });
    &ID
}

impl Field {
    /// O que só vale num registro gravado, nunca no input de uma ação.
    pub(crate) fn only_for_records(&self) -> bool {
        self.read_only || self.create_only || self.ref_filter.is_some() || !self.access.is_free()
    }
}

/// `writeOnly` só em `string`, e nunca junto com o que faria o valor aparecer ou vazar.
fn check_write_only(owner: &str, f: &RawField) -> Result<(), String> {
    if !f.write_only {
        return Ok(());
    }
    let bad = |why: &str| Err(format!("{owner}.{}: writeOnly {why}", f.name));
    if f.ty != FieldType::String {
        return bad("só vale para type string");
    }
    if f.read_only || f.unique || f.default.is_some() {
        return bad("não combina com readOnly, unique nem default");
    }
    Ok(())
}

/// `flags`: cada opção é um bit (potência de 2 até 2^30, que cabe nas operações de bit do JavaScript).
fn check_flags(owner: &str, f: &RawField) -> Result<(), String> {
    if f.ty != FieldType::Flags {
        return Ok(());
    }
    let bits: Vec<_> = f
        .options
        .iter()
        .map(|o| o.value.as_i64().filter(|n| (1..=1 << 30).contains(n) && n.count_ones() == 1))
        .collect();
    if bits.is_empty() || bits.iter().any(Option::is_none) {
        return Err(format!("{owner}.{}: opções de flags são potências de 2 (1, 2, 4...)", f.name));
    }
    Ok(())
}

/// `accept` e `maxSize` só em `file`; extensão começa com ponto, e o tamanho cabe no teto do motor.
fn check_file(owner: &str, f: &RawField) -> Result<(), String> {
    if f.ty != FieldType::File {
        return match f.accept.is_empty() && f.max_size.is_none() {
            true => Ok(()),
            false => Err(format!("{owner}.{}: accept/maxSize só valem para type file", f.name)),
        };
    }
    if f.accept.iter().any(|e| !e.starts_with('.') || e.len() < 2) {
        return Err(format!("{owner}.{}: accept lista extensões com ponto (\".pfx\")", f.name));
    }
    if f.max_size.is_some_and(|n| n == 0 || n > file::MAX_SIZE) {
        return Err(format!("{owner}.{}: maxSize entre 1 e {} bytes", f.name, file::MAX_SIZE));
    }
    if f.unique || f.default.is_some() || f.write_only || f.format.is_some() {
        return Err(format!(
            "{owner}.{}: file não combina com unique, default, writeOnly nem format",
            f.name
        ));
    }
    Ok(())
}

pub(crate) fn parse_fields(owner: &str, raw: Vec<RawField>, ident: &dyn Fn(&str) -> bool) -> Result<(Vec<Field>, FieldConditions), String> {
    let mut conditions = Vec::new();
    let mut fields: Vec<Field> = Vec::new();
    for (i, f) in raw.into_iter().enumerate() {
        if !ident(&f.name) || ["id", COMPANY_COL, BRANCH_COL].contains(&f.name.as_str()) {
            return Err(format!("{owner}: nome de campo inválido '{}'", f.name));
        }
        if fields.iter().any(|x| x.name == f.name) {
            return Err(format!("{owner}: campo '{}' repetido", f.name));
        }
        check_write_only(owner, &f)?;
        if f.format.is_some() && f.ty != FieldType::String {
            return Err(format!("{owner}.{}: format só vale para type string", f.name));
        }
        check_flags(owner, &f)?;
        check_file(owner, &f)?;
        if f.filter.is_some() && f.ty != FieldType::Reference {
            return Err(format!("{owner}.{}: filter só vale para type reference", f.name));
        }
        if f.read_only && (f.create_only || f.read_only_when.is_some()) {
            return Err(format!("{owner}.{}: createOnly e readOnlyWhen não combinam com readOnly", f.name));
        }
        if f.access.is_some() && f.required && f.default.is_none() {
            return Err(format!("{owner}.{}: campo com access e required precisa de default", f.name));
        }
        let pattern = match &f.pattern {
            Some(p) => Some(regex::Regex::new(&format!("^(?:{p})$")).map_err(|e| format!("{owner}.{}: pattern inválido: {e}", f.name))?),
            None => None,
        };
        conditions.push((i, f.visible_when, f.required_when, f.read_only_when));
        fields.push(Field {
            options: value::parse_options(f.options.into_iter().map(|o| o.value)).map_err(|e| format!("{owner}.{}: {e}", f.name))?,
            name: f.name,
            ty: f.ty,
            required: f.required,
            read_only: f.read_only,
            write_only: f.write_only,
            create_only: f.create_only,
            unique: f.unique,
            default: f.default,
            min_length: f.min_length,
            max_length: f.max_length,
            pattern,
            format: f.format,
            min: f.min,
            max: f.max,
            scale: f.scale.unwrap_or(2),
            reference: f.entity,
            accept: f.accept.iter().map(|e| e.to_lowercase()).collect(),
            max_size: f.max_size.unwrap_or(file::MAX_SIZE),
            visible_when: None,
            required_when: None,
            read_only_when: None,
            ref_filter: f.filter,
            access: Access::parse(f.access.as_ref()),
        });
    }
    Ok((fields, conditions))
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    fn flags(values: &[i64]) -> Result<(Vec<Field>, FieldConditions), String> {
        let options: Vec<_> = values.iter().map(|v| json!({ "value": v, "label": v.to_string() })).collect();
        let raw: RawField = serde_json::from_value(json!({ "name": "days", "type": "flags", "options": options })).unwrap();
        parse_fields("t", vec![raw], &|_| true)
    }

    #[test]
    fn flags_aceita_potencias_de_2_ate_2_30() {
        assert!(flags(&[1, 2, 4, 64]).is_ok());
        assert!(flags(&[1 << 30]).is_ok());
    }

    #[test]
    fn flags_recusa_o_que_nao_e_um_bit_so() {
        for bad in [&[3][..], &[0], &[-2], &[1 << 31], &[1, 2, 6]] {
            let err = flags(bad).err().unwrap_or_else(|| panic!("{bad:?} deveria ser recusado"));
            assert!(err.contains("potências de 2"), "{bad:?}: {err}");
        }
        assert!(flags(&[]).is_err(), "flags sem opções");
    }

    #[test]
    fn flags_recusa_bit_repetido() {
        let err = flags(&[1, 2, 2]).unwrap_err();
        assert!(err.contains("repetida"), "{err}");
    }
}
