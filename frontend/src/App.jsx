import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Fornecedores from './pages/Fornecedores';
import Produtos from './pages/Produtos';
import Pedidos from './pages/Pedidos';
import NovoPedido from './pages/NovoPedido';
import PedidoDetalhe from './pages/PedidoDetalhe';
import Usuarios from './pages/Usuarios';

function Private({ children }) {
  return localStorage.getItem('erp_token') ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Private><Layout /></Private>}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="fornecedores" element={<Fornecedores />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="pedidos/novo" element={<NovoPedido />} />
          <Route path="pedidos/:id" element={<PedidoDetalhe />} />
          <Route path="usuarios" element={<Usuarios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
