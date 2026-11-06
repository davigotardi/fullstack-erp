import CrudPage from '../components/CrudPage';

const campos = [
  { nome: 'codigo', label: 'Código' },
  { nome: 'nome', label: 'Nome', required: true },
  { nome: 'descricao', label: 'Descrição' },
  { nome: 'preco', label: 'Preço (R$)', tipo: 'number' },
  { nome: 'estoque', label: 'Estoque', tipo: 'number' },
  { nome: 'estoque_min', label: 'Estoque mín.', tipo: 'number' },
  { nome: 'fornecedor_id', label: 'Fornecedor', tipo: 'select',
    optionsEndpoint: 'fornecedores', optionLabel: 'nome', optionValue: 'id' },
];

export default function Produtos() {
  return <CrudPage titulo="Produtos / Estoque" endpoint="produtos" campos={campos}
    colunas={['codigo', 'nome', 'preco', 'estoque', 'estoque_min']} />;
}
