//! Sino do exemplo (spec/v0/notifications.yaml): avisos em memória, por usuário. Cada usuário ganha três avisos de
//! exemplo na primeira leitura. Sistema de verdade guarda numa tabela própria e cria o aviso quando o fato acontece.

use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use axum::http::request::Parts;
use c3_engine::{ApiError, Notification, NotificationList, Notifications};

#[derive(Default)]
pub struct Bells(Mutex<HashMap<String, Vec<Notification>>>);

fn sample() -> Vec<Notification> {
    let n = |id: &str, title: &str, tone: &str, at: &str, to: Option<&str>| Notification {
        id: id.to_owned(),
        title: title.to_owned(),
        tone: Some(tone.to_owned()),
        created_at: at.to_owned(),
        to: to.map(str::to_owned),
        ..Default::default()
    };
    vec![
        n(
            "3",
            "Pedido aguardando aprovação",
            "warning",
            "2026-11-09T12:00:00Z",
            Some("/sales_order"),
        ),
        n("2", "Cliente novo cadastrado", "success", "2026-11-09T11:00:00Z", Some("/customer")),
        n("1", "Versão nova do sistema", "info", "2026-11-09T10:00:00Z", None),
    ]
}

/// Agora em RFC 3339 (UTC, segundos), sem dependência de data.
fn now() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    let (days, rem) = (secs.div_euclid(86_400), secs.rem_euclid(86_400));
    // dias desde 1970 para ano-mês-dia (algoritmo de Howard Hinnant)
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = yoe + era * 400 + i64::from(m <= 2);
    format!("{y:04}-{m:02}-{d:02}T{:02}:{:02}:{:02}Z", rem / 3600, rem % 3600 / 60, rem % 60)
}

#[c3_engine::async_trait]
impl Notifications for Bells {
    fn audience(&self, req: &Parts) -> String {
        super::user(req).unwrap_or("anon").to_owned()
    }

    async fn list(&self, audience: &str, limit: usize) -> Result<NotificationList, ApiError> {
        let mut all = self.0.lock().map_err(|_| ApiError::internal())?;
        let items = all.entry(audience.to_owned()).or_insert_with(sample);
        let unread = items.iter().filter(|n| n.read_at.is_none()).count() as u64;
        Ok(NotificationList {
            items: items.iter().take(limit).cloned().collect(),
            unread,
        })
    }

    async fn mark_read(&self, audience: &str, ids: Option<&[String]>) -> Result<u64, ApiError> {
        let mut all = self.0.lock().map_err(|_| ApiError::internal())?;
        let items = all.entry(audience.to_owned()).or_insert_with(sample);
        let at = now();
        for n in items
            .iter_mut()
            .filter(|n| n.read_at.is_none() && ids.is_none_or(|ids| ids.contains(&n.id)))
        {
            n.read_at = Some(at.clone());
        }
        Ok(items.iter().filter(|n| n.read_at.is_none()).count() as u64)
    }
}
