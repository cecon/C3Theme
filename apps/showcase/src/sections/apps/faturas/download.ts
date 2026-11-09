import { addressLine, Invoice, ISSUER, money, shortDate, STATUS, totals } from './data';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Baixa a fatura como um arquivo HTML simples, montado no navegador (não é PDF).
 * O arquivo abre em qualquer navegador e pode ser impresso ou salvo como PDF por lá.
 */
export function downloadInvoice(invoice: Invoice) {
  const t = totals(invoice.lines, invoice.discount, invoice.tax);
  const rows = invoice.lines
    .map(
      (l, i) =>
        `<tr><td>${i + 1}</td><td>${esc(l.description)}</td><td class="n">${l.quantity}</td><td class="n">${money(l.price)}</td><td class="n">${money(l.quantity * l.price)}</td></tr>`
    )
    .join('');
  // documento independente do tema da vitrine: preto no branco, pronto para imprimir
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(invoice.number)}</title>
<style>
body{font-family:system-ui,sans-serif;color:#222;max-width:780px;margin:32px auto;padding:0 16px;font-size:14px}
h1{margin:0;font-size:22px}table{width:100%;border-collapse:collapse;margin:24px 0}
th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}.n{text-align:right}
.grid{display:flex;gap:24px;flex-wrap:wrap}.grid>div{flex:1;min-width:200px}.muted{color:#666}
.tot{margin-left:auto;width:280px}.tot p{display:flex;justify-content:space-between;margin:4px 0}.big{font-weight:700;font-size:16px}
</style></head><body>
<h1>Fatura ${esc(invoice.number)}</h1>
<p class="muted">Situação: ${STATUS[invoice.status].label} · Emissão: ${shortDate(invoice.issueDate)} · Vencimento: ${shortDate(invoice.dueDate)}</p>
<div class="grid">
<div><strong>De</strong><br>${esc(ISSUER.name)}<br>CNPJ ${ISSUER.document}<br><span class="muted">${esc(addressLine(ISSUER.address))}</span></div>
<div><strong>Cobrar de</strong><br>${esc(invoice.customer.name)}<br>${esc(invoice.customer.document)}<br><span class="muted">${esc(addressLine(invoice.billing))}</span></div>
<div><strong>Entregar em</strong><br><span class="muted">${esc(addressLine(invoice.shipping))}</span></div>
</div>
<table><thead><tr><th>#</th><th>Descrição</th><th class="n">Qtd.</th><th class="n">Preço unit.</th><th class="n">Total</th></tr></thead><tbody>${rows}</tbody></table>
<div class="tot">
<p><span>Subtotal</span><span>${money(t.subtotal)}</span></p>
<p><span>Desconto (${invoice.discount}%)</span><span>− ${money(t.discountValue)}</span></p>
<p><span>Impostos (${invoice.tax}%)</span><span>${money(t.taxValue)}</span></p>
<p class="big"><span>Total</span><span>${money(t.total)}</span></p>
</div>
${invoice.notes ? `<p><strong>Observações</strong><br>${esc(invoice.notes)}</p>` : ''}
</body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoice.number}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
