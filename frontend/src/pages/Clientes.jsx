import CrudPage from '../components/CrudPage';

const campos = [
  { nome: 'nome', label: 'Nome', required: true },
  { nome: 'documento', label: 'CPF/CNPJ' },
  { nome: 'email', label: 'Email' },
  { nome: 'telefone', label: 'Telefone' },
  { nome: 'endereco', label: 'Endereço' },
  { nome: 'cidade', label: 'Cidade' },
  { nome: 'uf', label: 'UF' },
];

export default function Clientes() {
  return <CrudPage titulo="Clientes" endpoint="clientes" campos={campos}
    colunas={['nome', 'documento', 'email', 'telefone', 'cidade']} />;
}
