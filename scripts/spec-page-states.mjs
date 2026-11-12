/** Referências declaradas nos estados da página: só entidades e ações do catálogo do app. */
export function checkPageStates(app, entities, errors) {
  for (const page of app.pages ?? []) {
    for (const [kind, state] of Object.entries(page.states ?? {})) {
      const record = state.action?.record;
      if (!record) continue;
      const where = `app.json página '${page.path}' states.${kind}.action.record`;
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
