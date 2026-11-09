// Organograma da rede de lojas.

// ---------- organograma ----------

export interface Pessoa {
  id: string;
  nome: string;
  cargo: string;
  area: string;
  equipe?: Pessoa[];
}

export const ORGANOGRAMA: Pessoa = {
  id: 'p1',
  nome: 'Helena Prado',
  cargo: 'Diretora-geral',
  area: 'Diretoria',
  equipe: [
    {
      id: 'p2',
      nome: 'Rafael Monteiro',
      cargo: 'Diretor de operações',
      area: 'Operações',
      equipe: [
        { id: 'p5', nome: 'Camila Duarte', cargo: 'Gerente de logística', area: 'Operações' },
        {
          id: 'p6',
          nome: 'Thiago Barros',
          cargo: 'Gerente de lojas',
          area: 'Operações',
          equipe: [
            { id: 'p12', nome: 'Larissa Pacheco', cargo: 'Supervisora Sudeste', area: 'Operações' },
            { id: 'p13', nome: 'Diego Nogueira', cargo: 'Supervisor Sul', area: 'Operações' }
          ]
        }
      ]
    },
    {
      id: 'p3',
      nome: 'Juliana Freitas',
      cargo: 'Diretora financeira',
      area: 'Financeiro',
      equipe: [
        { id: 'p7', nome: 'Marcelo Antunes', cargo: 'Controller', area: 'Financeiro' },
        { id: 'p8', nome: 'Patrícia Lemos', cargo: 'Gerente de tesouraria', area: 'Financeiro' }
      ]
    },
    {
      id: 'p4',
      nome: 'André Cavalcanti',
      cargo: 'Diretor de tecnologia',
      area: 'Tecnologia',
      equipe: [
        {
          id: 'p9',
          nome: 'Beatriz Rocha',
          cargo: 'Gerente de produto',
          area: 'Tecnologia',
          equipe: [{ id: 'p14', nome: 'Gustavo Teixeira', cargo: 'Designer de produto', area: 'Tecnologia' }]
        },
        {
          id: 'p10',
          nome: 'Felipe Andrade',
          cargo: 'Gerente de engenharia',
          area: 'Tecnologia',
          equipe: [
            { id: 'p15', nome: 'Natália Siqueira', cargo: 'Desenvolvedora sênior', area: 'Tecnologia' },
            { id: 'p16', nome: 'Rodrigo Pires', cargo: 'Engenheiro de dados', area: 'Tecnologia' }
          ]
        },
        { id: 'p11', nome: 'Vanessa Moura', cargo: 'Gerente de segurança', area: 'Tecnologia' }
      ]
    }
  ]
};
