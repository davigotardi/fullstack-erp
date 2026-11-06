-- ERP - Schema PostgreSQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(150) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  senha_hash  VARCHAR(255) NOT NULL,
  perfil      VARCHAR(20)  NOT NULL DEFAULT 'vendedor' CHECK (perfil IN ('admin','vendedor')),
  ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(200) NOT NULL,
  documento   VARCHAR(20)  UNIQUE,          -- CPF/CNPJ
  email       VARCHAR(150),
  telefone    VARCHAR(30),
  endereco    TEXT,
  cidade      VARCHAR(100),
  uf          CHAR(2),
  ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(200) NOT NULL,
  documento   VARCHAR(20)  UNIQUE,          -- CNPJ
  email       VARCHAR(150),
  telefone    VARCHAR(30),
  endereco    TEXT,
  cidade      VARCHAR(100),
  uf          CHAR(2),
  ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS produtos (
  id            SERIAL PRIMARY KEY,
  codigo        VARCHAR(30)  UNIQUE,
  nome          VARCHAR(200) NOT NULL,
  descricao     TEXT,
  preco         NUMERIC(12,2) NOT NULL CHECK (preco >= 0),
  estoque       INTEGER      NOT NULL DEFAULT 0 CHECK (estoque >= 0),
  estoque_min   INTEGER      NOT NULL DEFAULT 0,
  fornecedor_id INTEGER      REFERENCES fornecedores(id) ON DELETE SET NULL,
  ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos (
  id           SERIAL PRIMARY KEY,
  numero       VARCHAR(20)  UNIQUE NOT NULL,
  cliente_id   INTEGER      NOT NULL REFERENCES clientes(id),
  usuario_id   INTEGER      NOT NULL REFERENCES usuarios(id),
  status       VARCHAR(20)  NOT NULL DEFAULT 'pendente'
               CHECK (status IN ('pendente','aprovado','em_separacao','enviado','entregue','cancelado')),
  total        NUMERIC(14,2) NOT NULL DEFAULT 0,
  observacao   TEXT,
  criado_em    TIMESTAMP    NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS itens_pedido (
  id          SERIAL PRIMARY KEY,
  pedido_id   INTEGER      NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id  INTEGER      NOT NULL REFERENCES produtos(id),
  quantidade  INTEGER      NOT NULL CHECK (quantidade > 0),
  preco_unit  NUMERIC(12,2) NOT NULL CHECK (preco_unit >= 0),
  subtotal    NUMERIC(14,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_itens_pedido ON itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_produtos_fornecedor ON produtos(fornecedor_id);

-- Usuário inicial (senha: admin123) — troque após o primeiro acesso
INSERT INTO usuarios (nome, email, senha_hash, perfil)
SELECT 'Administrador', 'admin@erp.com',
       crypt('admin123', gen_salt('bf')),
       'admin'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@erp.com');
