import CrudPage from '../components/CrudPage';
import type { CrudField } from '../types';

const campos: CrudField[] = [
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
