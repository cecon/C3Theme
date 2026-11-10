//! Ação da lista em etapas (`steps: true`, spec/README.md "Ação longa em etapas"): cada chamada faz um pedaço e
//! devolve `progress { total, done, cursor }`; a shell chama de novo com o `cursor` até `done == total` (ou até o
//! usuário parar). O motor só confere o formato: o que cada etapa faz e o que o cursor significa é do sistema.

use serde_json::{json, Value};

/// Andamento de uma etapa: `done` de `total`, e o cursor que a próxima chamada manda de volta.
#[derive(Debug, Clone, PartialEq)]
pub struct Progress {
    pub total: u64,
    pub done: u64,
    /// Opaco para o motor (posição na lista, último id). `None` só na última etapa.
    pub cursor: Option<Value>,
}

impl Progress {
    /// Etapa no meio: falta `total - done`, a próxima chamada recebe `cursor`.
    pub fn step(total: u64, done: u64, cursor: Value) -> Self {
        Progress {
            total,
            done,
            cursor: Some(cursor),
        }
    }

    /// Última etapa: tudo feito.
    pub fn finished(total: u64) -> Self {
        Progress {
            total,
            done: total,
            cursor: None,
        }
    }
}

/// O `progress` da resposta, ou o motivo de o sistema ter errado (vira 500): progresso em ação sem `steps`,
/// `done` passando do `total`, ou etapa no meio sem cursor (a shell não teria como continuar).
pub(crate) fn progress_json(steps: bool, p: &Progress) -> Result<Value, &'static str> {
    if !steps {
        return Err("devolveu progress sem steps: true na spec");
    }
    if p.done > p.total {
        return Err("devolveu progress com done maior que total");
    }
    let cursor = match (&p.cursor, p.done < p.total) {
        (None | Some(Value::Null), true) => return Err("devolveu etapa no meio (done < total) sem cursor"),
        (Some(c), true) => c.clone(),
        _ => Value::Null,
    };
    Ok(json!({ "total": p.total, "done": p.done, "cursor": cursor }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn confere_o_formato() {
        assert!(progress_json(false, &Progress::finished(3)).is_err());
        assert!(progress_json(
            true,
            &Progress {
                total: 2,
                done: 3,
                cursor: None
            }
        )
        .is_err());
        assert!(progress_json(
            true,
            &Progress {
                total: 5,
                done: 2,
                cursor: None
            }
        )
        .is_err());
        assert!(progress_json(true, &Progress::step(5, 2, Value::Null)).is_err());
        assert_eq!(
            progress_json(true, &Progress::step(5, 2, json!(2))).unwrap(),
            json!({ "total": 5, "done": 2, "cursor": 2 })
        );
        // a última etapa não manda cursor, mesmo que o sistema tenha posto um
        assert_eq!(
            progress_json(
                true,
                &Progress {
                    total: 5,
                    done: 5,
                    cursor: Some(json!(9))
                }
            )
            .unwrap(),
            json!({ "total": 5, "done": 5, "cursor": null })
        );
    }
}
