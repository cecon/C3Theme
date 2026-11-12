/** Referências declaradas nos estados da página e do chat: só entidades e ações do catálogo do app. */
export function checkPageStates(app, entities, errors) {
  const locations = [];
  for (const page of app.pages ?? []) {
    locations.push([`app.json página '${page.path}'`, page.states]);
    locations.push([`app.json página '${page.path}' chat`, page.chat?.states]);
  }
  locations.push(['app.json layout.header.assistant', app.layout?.header?.assistant?.states]);
  for (const [location, states] of locations) {
    for (const [kind, state] of Object.entries(states ?? {})) {
      const record = state.action?.record;
      if (!record) continue;
      const where = `${location} states.${kind}.action.record`;
      const def = entities.get(record.entity)?.entity;
      if (!def || !app.entities?.includes(record.entity)) {
        errors.push(`${where}: entidade '${record.entity}' fora de app.entities`);
        continue;
      }
      const action = def.actions?.find((a) => a.name === record.action);
      if (!action || action.target === 'list') errors.push(`${where}: '${record.action}' não é ação de registro`);
    }
  }
}
