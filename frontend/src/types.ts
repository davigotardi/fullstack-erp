export type UserProfile = 'admin' | 'vendedor';

export interface AppUser {
  id: number;
  nome: string;
  email: string;
  perfil: UserProfile;
  ativo?: boolean;
}

export interface Customer {
  id: number;
  nome: string;
  documento: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
}

export interface Product {
  id: number;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  preco: number | string;
  estoque: number;
  estoque_min: number;
  fornecedor_id: number | null;
  ativo: boolean;
}

export interface OrderItemInput {
  produto_id: number;
  quantidade: number;
}

export interface OrderItem {
  id: number;
  produto_id: number;
  quantidade: number;
  preco_unit: number | string;
  subtotal: number | string;
  produto_nome: string;
  produto_codigo?: string | null;
}

export type OrderStatus =
  | 'pendente'
  | 'aprovado'
  | 'em_separacao'
  | 'enviado'
  | 'entregue'
  | 'cancelado';

export interface Order {
  id: number;
  numero: string;
  cliente_id: number;
  cliente_nome: string;
  cliente_documento?: string | null;
  usuario_id?: number;
  vendedor: string;
  status: OrderStatus;
  total: number | string;
  observacao: string | null;
  criado_em: string;
  itens: OrderItem[];
}

export interface DashboardStats {
  clientes: number;
  fornecedores: number;
  produtos: number;
  produtosEstoqueBaixo: number;
  pedidosAbertos: number;
  totalVendas: number;
}

export interface CrudField {
  nome: string;
  label: string;
  tipo?: 'text' | 'number' | 'select';
  required?: boolean;
  chave?: string;
  optionsEndpoint?: string;
  optionLabel?: string;
  optionValue?: string;
}

export interface CrudRow {
  id: number;
  [key: string]: string | number | boolean | null;
}
