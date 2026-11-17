# Frontend do ERP

Interface do sistema ERP construída com React, TypeScript, Vite e React Router.

## Comandos

Execute na pasta `frontend`:

```powershell
npm install
npm run dev
npm run build
npm run lint
```

O comando `npm run build` primeiro verifica os tipos com `tsc` e depois gera a
versão de produção com Vite. A aplicação usa o proxy `/api` do Vite para
encaminhar as chamadas ao backend em `http://localhost:3001`.
