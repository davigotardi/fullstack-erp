// Sobe um PostgreSQL embarcado (embedded-postgres) em localhost:5432,
// cria o banco `erp` (se não existir) e aplica o schema.sql.
// Mantenha este processo rodando enquanto usa a API.
const path = require('path');
const fs = require('fs');
const EmbeddedPostgres = require('embedded-postgres').default;
const { Client } = require('pg');

const PORT = 5432;
const USER = 'postgres';
const PASSWORD = 'password';

(async () => {
  const pg = new EmbeddedPostgres({
    databaseDir: path.join(__dirname, '..', '.pgdata'),
    port: PORT,
    user: USER,
    password: PASSWORD,
    persistent: true,
    onLog: () => {},
    onError: (m) => console.error('[pg]', m),
  });

  await pg.initialise();
  await pg.start();
  console.log(`PostgreSQL embarcado escutando em localhost:${PORT}`);

  const conn = { host: 'localhost', port: PORT, user: USER, password: PASSWORD };
  const admin = new Client({ ...conn, database: 'postgres' });
  await admin.connect();
  const { rows } = await admin.query("SELECT 1 FROM pg_database WHERE datname = 'erp'");
  if (!rows.length) {
    await admin.query('CREATE DATABASE erp');
    console.log('Banco "erp" criado.');
  }
  await admin.end();

  const erp = new Client({ ...conn, database: 'erp' });
  await erp.connect();
  await erp.query(fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8'));
  await erp.end();
  console.log('Schema aplicado. Pronto para uso.');

  setInterval(() => {}, 60_000); // mantém o processo vivo
})().catch((e) => { console.error(e); process.exit(1); });
