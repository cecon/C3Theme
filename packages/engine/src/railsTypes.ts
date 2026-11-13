/** Zonas de navegação opcionais do app.json; dados e ações chegam pela porta rails. */
export interface RailsDef {
  servers?: { shortcuts?: boolean; localServerId?: string };
  pages?: { defaultPinned?: string[]; brandHref?: string; hidden?: boolean; items?: string[] };
}
