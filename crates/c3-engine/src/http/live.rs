//! `GET /{entity}/_events`: o canal de tempo real em SSE. Só transporte; quem decide o que cada assinante recebe é
//! `crate::live`.

use std::convert::Infallible;
use std::time::Duration;

use axum::extract::{Path, State};
use axum::http::request::Parts;
use axum::response::sse::{Event, KeepAlive, Sse};
use futures_util::stream::{self, Stream};
use tokio::sync::broadcast::error::RecvError;

use crate::error::ApiError;
use crate::live::{self, Change, LiveEvent};
use crate::Engine;

/// Primeiro sai `ready` (a assinatura está valendo: quem reconecta relê o que pode ter perdido), depois um `change`
/// por aviso. Assinante que ficou para trás recebe um `changed`. A conexão fecha quando a sessão cai ou a permissão
/// sai; a shell reconecta e o 401/403 aparece na reconexão.
pub(super) async fn events(
    State(engine): State<Engine>,
    Path(name): Path<String>,
    req: Parts,
) -> Result<Sse<impl Stream<Item = Result<Event, Infallible>>>, ApiError> {
    let rx = live::subscribe(&engine, &req, &name).await?;
    let ready = Event::default().event("ready").data("{}");
    let state = (engine, req, name, rx, Some(ready));
    let stream = stream::unfold(state, |(engine, req, name, mut rx, first)| async move {
        if let Some(ready) = first {
            return Some((Ok(ready), (engine, req, name, rx, None)));
        }
        loop {
            let ev = match rx.recv().await {
                Ok(ev) => ev,
                Err(RecvError::Lagged(_)) => LiveEvent {
                    entity: name.clone(),
                    id: None,
                    change: Change::Changed,
                },
                Err(RecvError::Closed) => return None,
            };
            match live::for_subscriber(&engine, &req, &name, &ev).await {
                Ok(Some(data)) => {
                    let event = Event::default().event("change").data(data.to_string());
                    return Some((Ok(event), (engine, req, name, rx, None)));
                }
                Ok(None) => continue,
                Err(_) => return None,
            }
        }
    });
    Ok(Sse::new(stream).keep_alive(KeepAlive::new().interval(Duration::from_secs(20)).text("")))
}
