//! Portas e opções do [`EngineBuilder`]: o que o sistema pluga além do banco e da spec.

use crate::chat::Chat;
use crate::live::Live;
use crate::notifications::{Bell, Notifications};
use crate::search::Search;
use crate::store::Store;
use crate::EngineBuilder;

impl EngineBuilder {
    /// Canal de tempo real criado antes do motor, para os hooks avisarem o que o sistema grava (`Live::notify`).
    pub fn live(mut self, live: Live) -> Self {
        self.live = live;
        self
    }

    /// Sino do header (`layout.header.notifications`): onde o sistema guarda os avisos de cada usuário.
    pub fn notifications(mut self, port: impl Notifications) -> Self {
        self.notifications = Some(Box::new(port));
        self
    }

    /// Chat com o agente (`pages[].chat`, `layout.header.assistant`): quem guarda as conversas e responde.
    pub fn chat(mut self, port: impl Chat) -> Self {
        self.chat = Some(Box::new(port));
        self
    }

    /// Busca do Ctrl K (`header.search: { records: true }`): o que o sistema acha para o texto.
    pub fn search(mut self, port: impl Search) -> Self {
        self.search = Some(Box::new(port));
        self
    }

    /// Canal do sino criado antes do motor, para o sistema avisar quando cria um aviso (`Bell::notify`).
    pub fn bell(mut self, bell: Bell) -> Self {
        self.bell = bell;
        self
    }

    /// Banco a mais, de onde as entidades com `"store": name` são lidas (só leitura).
    pub fn store_named(mut self, name: &str, store: impl Store) -> Self {
        self.stores.insert(name.to_owned(), Box::new(store));
        self
    }

    /// O motor só lê: toda gravação é do sistema. O `build()` recusa entidade que não delega a escrita
    /// (`Hooks::delegates_writes`; filha gravada com o pai vai na escrita dele) e conexão sem `PRAGMA query_only`
    /// (`c3_engine::sqlx::sqlite_options_read_only`, `c3_engine_rusqlite::prepare_read_only`). Para sistema com
    /// escritor único e auditoria na transação, em que o motor gravar seria um erro e não uma opção.
    pub fn read_only(mut self) -> Self {
        self.read_only = true;
        self
    }
}
