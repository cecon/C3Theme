//! `seller.review` (ação da lista em etapas): cinco lotes, dois por chamada, com o cursor na posição do próximo.
//! Não grava nada: serve para a suíte conferir o protocolo de `steps` (cursor de volta, progress na resposta).

use c3_engine::{ActionOutcome, ListActionCall, Progress};

const TOTAL: u64 = 5;
const STEP: u64 = 2;

pub fn run(call: &ListActionCall<'_>) -> ActionOutcome {
    let from = call.cursor.and_then(|c| c.as_u64()).unwrap_or(0).min(TOTAL);
    let done = (from + STEP).min(TOTAL);
    if done == TOTAL {
        return ActionOutcome::message(format!("Revisados {TOTAL} lotes.")).with_progress(Progress::finished(TOTAL));
    }
    ActionOutcome::message(format!("Revisados {done} de {TOTAL} lotes.")).with_progress(Progress::step(TOTAL, done, done.into()))
}
