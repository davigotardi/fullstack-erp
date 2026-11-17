import CrudPage from '../components/CrudPage';
import type { CrudField } from '../types';

const campos: CrudField[] = [
  { nome: 'nome', label: 'Razão Social / Nome', required: true },
  { nome: 'documento', label: 'CNPJ' },
  { nome: 'email', label: 'Email' },
  { nome: 'telefone', label: 'Telefone' },
  { nome: 'endereco', label: 'Endereço' },
  { nome: 'cidade', label: 'Cidade' },
  { nome: 'uf', label: 'UF' },
];

export default function Fornecedores() {
  return <CrudPage titulo="Fornecedores" endpoint="fornecedores" campos={campos}
    colunas={['nome', 'documento', 'email', 'telefone', 'cidade']} />;
}
