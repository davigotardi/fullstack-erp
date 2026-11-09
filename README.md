# ERP — Sistema de Gestão Empresarial

Aplicação full stack para gestão de clientes, fornecedores, estoque e pedidos/vendas.

<img width="1051" height="807" alt="Captura de tela 2026-11-09 220636" src="https://github.com/user-attachments/assets/bf0c4c6f-6bfb-4293-8d2c-b2b64308bf68" />



## Stack

- **Backend:** Node.js + Express + PostgreSQL (`pg`)
- **Autenticação:** JWT + bcryptjs (perfis: `admin`, `vendedor`)
- **Frontend:** React + Vite + React Router + Axios

## Estrutura

```
projeto 6/
├── backend/          # API REST (Express)
│   ├── schema.sql    # DDL do banco + usuário admin inicial
│   ├── db.js         # Pool de conexão PostgreSQL
│   ├── middleware/   # auth (JWT) e controle de perfil admin
│   └── routes/       # auth, pedidos, CRUDs (clientes/fornecedores/produtos)
├── frontend/         # SPA React (Vite)
└── README.md
```

## Como rodar

### 1. Banco de dados

**Opção A — PostgreSQL embarcado (sem instalar nada):**

```powershell
cd backend
npm install
npm run db:local   # sobe Postgres em localhost:5432 e aplica o schema
```

**Opção B — PostgreSQL local instalado:**

```powershell
createdb -U postgres erp
psql -U postgres -d erp -f backend\schema.sql
```

Em ambos os casos, ajuste `DB_*` no `backend/.env` conforme necessário.
Isso cria as tabelas e um usuário inicial: **admin@erp.com / admin123** (troque a senha depois).

### 2. Backend

```powershell
cd backend
copy .env.example .env   # edite DB_PASSWORD com sua senha do Postgres
npm install
npm run dev              # API em http://localhost:3001
```

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev              # App em http://localhost:5173 (proxy /api -> :3001)
```

## Funcionalidades

- Login com JWT; gestão de usuários (apenas admin)
- CRUD de clientes e fornecedores (com busca)
- Controle de estoque: produtos com estoque mínimo e vínculo a fornecedor
- Pedidos de venda: criação com baixa automática de estoque (transação),
  acompanhamento de status e cancelamento com devolução ao estoque
- Dashboard com totais (clientes, produtos, pedidos abertos, valor em vendas)

## API (resumo)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Login (retorna JWT) |
| GET/POST | `/api/auth/usuarios` | Listar/criar usuários (admin) |
| GET/POST/PUT/DELETE | `/api/clientes`, `/api/fornecedores`, `/api/produtos` | CRUDs (`?q=` busca) |
| GET/POST | `/api/pedidos` | Listar/criar pedidos |
| GET | `/api/pedidos/:id` | Detalhe do pedido com itens |
| PATCH | `/api/pedidos/:id/status` | Atualizar status |
| POST | `/api/pedidos/:id/cancelar` | Cancelar e estornar estoque |
| GET | `/api/dashboard` | Métricas gerais |

---

## Requisitos e Diagramas UML

### Requisitos funcionais

- RF01 — Autenticação de usuários com perfis (admin/vendedor)
- RF02 — Cadastro, consulta, edição e exclusão de clientes
- RF03 — Cadastro, consulta, edição e exclusão de fornecedores
- RF04 — Cadastro de produtos com preço, estoque e fornecedor
- RF05 — Alerta de produtos com estoque abaixo do mínimo
- RF06 — Criação de pedidos de venda com múltiplos itens
- RF07 — Baixa automática de estoque na confirmação do pedido
- RF08 — Estorno de estoque no cancelamento do pedido
- RF09 — Acompanhamento de status do pedido (pendente → entregue/cancelado)
- RF10 — Dashboard com indicadores de vendas e cadastros

### Diagrama de Classes (UML)

```mermaid
classDiagram
    class Usuario {
        +id: int
        +nome: string
        +email: string
        +senha_hash: string
        +perfil: enum
        +login()
    }
    class Cliente {
        +id: int
        +nome: string
        +documento: string
        +email: string
        +telefone: string
        +endereco: string
    }
    class Fornecedor {
        +id: int
        +nome: string
        +documento: string
        +email: string
    }
    class Produto {
        +id: int
        +codigo: string
        +nome: string
        +preco: decimal
        +estoque: int
        +estoque_min: int
        +fornecedor_id: int
    }
    class Pedido {
        +id: int
        +numero: string
        +cliente_id: int
        +usuario_id: int
        +status: enum
        +total: decimal
        +criarPedido()
        +cancelar()
        +atualizarStatus()
    }
    class ItemPedido {
        +id: int
        +pedido_id: int
        +produto_id: int
        +quantidade: int
        +preco_unit: decimal
        +subtotal: decimal
    }

    Usuario "1" --> "0..*" Pedido : registra
    Cliente "1" --> "0..*" Pedido : realiza
    Fornecedor "1" --> "0..*" Produto : fornece
    Pedido "1" --> "1..*" ItemPedido : contém
    Produto "1" --> "0..*" ItemPedido : referenciado
```

### Diagrama de Casos de Uso

```mermaid
flowchart LR
    V[Vendedor] --> UC1[Login]
    V --> UC2[Cadastrar Cliente]
    V --> UC3[Cadastrar Produto]
    V --> UC4[Criar Pedido]
    V --> UC5[Cancelar Pedido]
    V --> UC6[Consultar Estoque]
    A[Administrador] --> UC1
    A --> UC7[Gerenciar Usuários]
    A --> UC8[Cadastrar Fornecedor]
```

### Diagrama de Sequência — Criar Pedido

```mermaid
sequenceDiagram
    actor Vendedor
    participant UI as Frontend (React)
    participant API as API (Express)
    participant DB as PostgreSQL

    Vendedor->>UI: Seleciona cliente e itens
    UI->>API: POST /api/pedidos {cliente_id, itens[]}
    API->>DB: BEGIN
    loop Para cada item
        API->>DB: SELECT produto ... FOR UPDATE
        DB-->>API: preço e estoque
        API->>API: Valida estoque suficiente
    end
    API->>DB: INSERT pedido + itens
    API->>DB: UPDATE produtos SET estoque = estoque - qtd
    API->>DB: COMMIT
    DB-->>API: pedido criado
    API-->>UI: 201 + pedido
    UI-->>Vendedor: Exibe pedido
```

### Diagrama de Entidade-Relacionamento (DER)

```mermaid
erDiagram
    USUARIOS ||--o{ PEDIDOS : registra
    CLIENTES ||--o{ PEDIDOS : realiza
    PEDIDOS ||--|{ ITENS_PEDIDO : contem
    PRODUTOS ||--o{ ITENS_PEDIDO : vendido_em
    FORNECEDORES ||--o{ PRODUTOS : fornece

    USUARIOS {
        int id PK
        varchar nome
        varchar email UK
        varchar senha_hash
        varchar perfil
        boolean ativo
    }
    CLIENTES {
        int id PK
        varchar nome
        varchar documento UK
        varchar email
        varchar telefone
        text endereco
        varchar cidade
        char uf
        boolean ativo
    }
    FORNECEDORES {
        int id PK
        varchar nome
        varchar documento UK
        varchar email
        varchar telefone
        text endereco
        varchar cidade
        char uf
        boolean ativo
    }
    PRODUTOS {
        int id PK
        varchar codigo UK
        varchar nome
        text descricao
        numeric preco
        int estoque
        int estoque_min
        int fornecedor_id FK
        boolean ativo
    }
    PEDIDOS {
        int id PK
        varchar numero UK
        int cliente_id FK
        int usuario_id FK
        varchar status
        numeric total
        text observacao
        timestamp criado_em
    }
    ITENS_PEDIDO {
        int id PK
        int pedido_id FK
        int produto_id FK
        int quantidade
        numeric preco_unit
        numeric subtotal
    }
```
