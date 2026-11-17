# Testes automatizados com Selenium

Este documento descreve a suíte de testes de interface do ERP, localizada em
[`tests/selenium/erp.test.ts`](../tests/selenium/erp.test.ts). Os casos usam
Selenium WebDriver para interagir com a aplicação no navegador e cobrem os
fluxos de autenticação, cadastros, estoque, pedidos e usuários.

## Casos cobertos

| Nº | Cenário | Verificação principal |
|---:|---|---|
| 01 | Tela de login | Exibe o título do sistema e as credenciais de demonstração. |
| 02 | Campos obrigatórios de login | Impede o envio sem email e senha. |
| 03 | Credenciais inválidas | Exibe uma mensagem de erro e mantém o usuário na tela de login. |
| 04 | Login de administrador | Abre o dashboard e mostra o usuário autenticado. |
| 05 | Acesso sem autenticação | Redireciona uma rota protegida para o login. |
| 06 | Indicadores do dashboard | Exibe os cartões de clientes, fornecedores, produtos, estoque baixo, pedidos abertos e vendas. |
| 07 | Cadastro de cliente | Cria um cliente e confirma sua presença na tabela. |
| 08 | Busca de clientes | Filtra a lista pelo nome e oculta os resultados que não correspondem à busca. |
| 09 | Edição de cliente | Atualiza o nome de um cliente cadastrado. |
| 10 | Exclusão de cliente | Confirma a exclusão e verifica que o cliente saiu da lista. |
| 11 | Cadastro de fornecedor | Cria um fornecedor e confirma sua presença na tabela. |
| 12 | Cadastro de produto | Cria um produto e verifica nome, preço e estoque. |
| 13 | Criação de pedido | Confere o total calculado e os dados do pedido criado. |
| 14 | Cancelamento de pedido | Confere o status cancelado e a devolução das unidades ao estoque. |
| 15 | Cadastro de usuário | Permite ao administrador criar um usuário com perfil vendedor. |

## Pré-requisitos

- Node.js e npm instalados.
- Dependências instaladas na raiz e nos diretórios `backend` e `frontend`.
- Um banco de dados **exclusivo para testes**, inicializado com
  `backend/schema.sql`; o schema cria o administrador inicial
  `admin@erp.com / admin123`.
- API disponível em `http://localhost:3001` e frontend em
  `http://localhost:5173`.
- Google Chrome, Microsoft Edge ou Mozilla Firefox instalado. O Chrome é o
  padrão; o Selenium Manager tenta localizar o driver correspondente.

## Executar

Na raiz do repositório, instale as dependências:

```powershell
npm install
npm --prefix backend install
npm --prefix frontend install
```

Inicialize o banco conforme as instruções de configuração do projeto e inicie a
API e o frontend em terminais separados:

```powershell
npm run dev:api
npm run dev:web
```

Em outro terminal, execute a suíte:

```powershell
npm run test:selenium
```

Para validar os tipos dos testes sem abrir o navegador:

```powershell
npm run typecheck:tests
```

## Configuração opcional

Os valores abaixo podem ser definidos como variáveis de ambiente antes de
executar a suíte:

| Variável | Padrão | Uso |
|---|---|---|
| `BASE_URL` | `http://localhost:5173` | Endereço do frontend. |
| `SELENIUM_BROWSER` | `chrome` | Navegador: `chrome`, `edge` ou `firefox`. |
| `SELENIUM_BROWSER_BINARY` | Automático | Caminho para o executável do navegador. |
| `SELENIUM_HEADLESS` | `true` | Defina `false` para exibir a janela do navegador. |
| `ERP_ADMIN_EMAIL` | `admin@erp.com` | Email do administrador usado nos testes. |
| `ERP_ADMIN_PASSWORD` | `admin123` | Senha do administrador usado nos testes. |

Exemplo no PowerShell:

```powershell
$env:SELENIUM_BROWSER = "edge"
$env:SELENIUM_HEADLESS = "false"
npm run test:selenium
```

## Dados criados

Os testes adicionam clientes, fornecedores, produtos, pedidos e usuários ao
banco. Os nomes e emails usam identificadores únicos para reduzir conflitos
entre execuções, mas os registros **não são removidos automaticamente**. Use
sempre uma base de testes; não configure a suíte para apontar a um banco de
produção ou com dados importantes.

## Resultado verificado

Na última execução registrada durante a preparação desta documentação, os 15
testes passaram no Chrome headless. A suíte também deve ser executada novamente
após alterações nos fluxos de interface ou na API relacionados a esses cenários.
