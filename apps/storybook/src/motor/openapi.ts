// openapi.json que a página `apiDocs` da história lê do adaptador em memória: um recorte do contrato do motor para
// clientes. GET roda na memória; POST responde 501, como num servidor sem a rota.

const cliente = {
  type: 'object',
  properties: {
    id: { type: 'string', example: '1' },
    nome: { type: 'string', example: 'Ana Souza' },
    email: { type: 'string', format: 'email', example: 'ana@exemplo.com.br' },
    cidade: { type: 'string', example: 'São Paulo' },
    status: { type: 'string', enum: ['ativo', 'pendente', 'inativo'] }
  }
};

const error = { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } };

export const OPENAPI = {
  openapi: '3.1.0',
  info: { title: 'API do Storybook', version: 'v0' },
  tags: [
    { name: 'Clientes', description: 'Cadastro de clientes, pelo contrato do motor.' },
    { name: 'Metadados', description: 'A spec que a shell lê.' }
  ],
  paths: {
    '/cliente': {
      get: {
        tags: ['Clientes'],
        operationId: 'listarClientes',
        summary: 'Lista os clientes',
        parameters: [
          { name: 'q', in: 'query', description: 'Busca no nome e no e-mail', schema: { type: 'string' }, example: 'ana' },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' }, example: 5 }
        ],
        responses: {
          '200': {
            description: 'Página de clientes',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Cliente' } } } }
              }
            }
          }
        }
      },
      post: {
        tags: ['Clientes'],
        operationId: 'criarCliente',
        summary: 'Cria um cliente',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Cliente' },
              example: { nome: 'Rita Alves', email: 'rita@exemplo.com.br' }
            }
          }
        },
        responses: { '201': { description: 'Criado' }, '422': error }
      }
    },
    '/cliente/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: '1' }],
      get: {
        tags: ['Clientes'],
        operationId: 'lerCliente',
        summary: 'Lê um cliente',
        responses: {
          '200': { description: 'O cliente', content: { 'application/json': { schema: { $ref: '#/components/schemas/Cliente' } } } },
          '404': error
        }
      }
    },
    '/_meta/app': {
      get: {
        tags: ['Metadados'],
        operationId: 'app',
        summary: 'O app.json e as páginas que o usuário abre',
        responses: { '200': { description: 'A spec do app' } }
      }
    }
  },
  components: {
    schemas: {
      Cliente: cliente,
      Error: {
        type: 'object',
        properties: { error: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' } } } }
      }
    }
  }
};
