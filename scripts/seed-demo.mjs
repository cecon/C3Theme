#!/usr/bin/env node
// Popula o CRM de exemplo pela própria API (passa pela mesma validação de qualquer cliente).
// Uso: node scripts/seed-demo.mjs [base]   (padrão http://127.0.0.1:3001/api). Cada parte (CRM, cardápio) só entra se ainda estiver vazia.

const base = process.argv[2] ?? 'http://127.0.0.1:3001/api';

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body && JSON.stringify(body)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${JSON.stringify(json)}`);
  return json;
}

const existing = await call('GET', '/company?pageSize=10');
if (existing.meta.total > 0) {
  console.log('seed: o CRM já tem dados');
} else {
  const acme = (await call('POST', '/company', { trade_name: 'Acme Distribuidora', cnpj: '12345678000195' })).data;
  const padaria = (await call('POST', '/company', { trade_name: 'Padaria Pão Quente', cnpj: '98765432000198' })).data;
  await call('POST', '/company', { trade_name: 'Oficina do Zé', cnpj: '12ABC34501DE35' });

  const customers = [
    { name: 'Maria Souza', email: 'maria@acme.com', company_id: acme.id, status: 'active', credit_limit: '25000.00', vip: true },
    { name: 'Ana Beatriz', email: 'ana@acme.com', company_id: acme.id, status: 'lead', credit_limit: '5000.00', vip: true },
    { name: 'Érica Lima', email: 'erica@padaria.com', company_id: padaria.id, status: 'active', birth_date: '1990-04-12' },
    {
      name: 'João Pereira',
      email: 'joao@exemplo.com',
      status: 'churned',
      churn_reason: 'Mudou para um concorrente mais barato.',
      vip: true
    },
    { name: 'Carlos Andrade', status: 'lead', notes: 'Pediu retorno na semana que vem.' }
  ];
  for (const c of customers) await call('POST', '/customer', c);
  console.log(`seed: ${customers.length} clientes e 3 empresas criados`);
}

// cardápio (lote 3): produtos, perguntas da venda e uma promoção; de novo só se ainda não houver produtos
const products = await call('GET', '/product?pageSize=10');
if (products.meta.total === 0) {
  const product = async (name, product_group, price) => (await call('POST', '/product', { name, product_group, price })).data.id;
  const sides = {};
  for (const [name, price] of [
    ['Arroz branco', '6.00'],
    ['Feijão carioca', '6.00'],
    ['Salada verde', '7.50'],
    ['Batata frita', '9.00'],
    ['Purê', '7.00'],
    ['Legumes no vapor', '8.00']
  ])
    sides[name] = await product(`${name} (porção)`, 'sides', price);
  const juices = [];
  for (const flavor of ['Laranja', 'Limão', 'Abacaxi']) juices.push(await product(`Suco natural 500ml · ${flavor}`, 'drinks', '9.90'));

  const option = (position, name, product_id = null, extra_price = null, active = true) => ({
    position,
    name,
    product_id,
    extra_price,
    active
  });
  const protein = (
    await call('POST', '/question', {
      internal_name: 'Proteína',
      prompt: 'Escolha a proteína',
      choice: 'single',
      min_choices: 1,
      max_choices: 1,
      question_option: [
        option(1, 'Frango grelhado'),
        option(2, 'Bife acebolado'),
        option(3, 'Filé de tilápia', null, '4.00'),
        option(4, 'Picanha', null, '9.00')
      ]
    })
  ).data.id;
  const garnish = (
    await call('POST', '/question', {
      internal_name: 'Guarnições',
      prompt: 'Escolha 3 guarnições',
      choice: 'multiple',
      min_choices: 3,
      max_choices: 3,
      question_option: [
        option(1, 'Arroz branco', sides['Arroz branco']),
        option(2, 'Feijão carioca', sides['Feijão carioca']),
        option(3, 'Farofa'),
        option(4, 'Salada verde', sides['Salada verde']),
        option(5, 'Batata frita', sides['Batata frita'], '3.00'),
        option(6, 'Purê', sides['Purê']),
        option(7, 'Legumes no vapor', sides['Legumes no vapor'], null, false)
      ]
    })
  ).data.id;
  await call('POST', '/product', {
    name: 'Prato executivo',
    product_group: 'dishes',
    price: '32.90',
    product_question: [
      { position: 1, question_id: protein },
      { position: 2, question_id: garnish, depends_on_id: protein }
    ]
  });
  await call('POST', '/promotion', {
    name: 'Sucos 2 por 1',
    kind: 'buy_x_pay_y',
    buy: 2,
    pay: 1,
    starts_on: new Date().toISOString().slice(0, 10),
    from_time: '11:00',
    to_time: '15:00',
    promotion_product: juices.map((product_id) => ({ product_id }))
  });
  console.log('seed: cardápio com 10 produtos, 2 perguntas e 1 promoção criado');
}
