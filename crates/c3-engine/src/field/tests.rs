//! Testes do `parse_fields`.

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

#[test]
fn options_from_so_em_string_apontando_para_text() {
    let parse = |value: &str, from: &str, options: &str| {
        let raw: Vec<RawField> = serde_json::from_value(json!([
            { "name": "options", "type": options },
            { "name": "value", "type": value, "optionsFrom": from }
        ]))
        .unwrap();
        parse_fields("t", raw, &|_| true)
    };
    assert!(parse("string", "options", "text").is_ok());
    for (value, from, options) in [
        ("integer", "options", "text"),
        ("string", "options", "string"),
        ("string", "value", "text"),
        ("string", "nada", "text"),
    ] {
        let err = parse(value, from, options)
            .err()
            .unwrap_or_else(|| panic!("{value}/{from}/{options} deveria ser recusado"));
        assert!(err.contains("optionsFrom"), "{err}");
    }
}
