import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import edge from 'selenium-webdriver/edge';
import firefox from 'selenium-webdriver/firefox';
import type { WebDriver, WebElement } from 'selenium-webdriver';

const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
const browserName = (process.env.SELENIUM_BROWSER || 'chrome').toLowerCase();
const adminEmail = process.env.ERP_ADMIN_EMAIL || 'admin@erp.com';
const adminPassword = process.env.ERP_ADMIN_PASSWORD || 'admin123';
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let orderFixtureCount = 0;

let driver: WebDriver;

function browserOptions(browser: 'chrome'): chrome.Options;
function browserOptions(browser: 'edge'): edge.Options;
function browserOptions(browser: 'firefox'): firefox.Options;
function browserOptions(browser: 'chrome' | 'edge' | 'firefox'): chrome.Options | edge.Options | firefox.Options {
  const headless = process.env.SELENIUM_HEADLESS !== 'false';
  const binary = process.env.SELENIUM_BROWSER_BINARY;

  if (browser === 'chrome') {
    const options = new chrome.Options();
    if (headless) options.addArguments('--headless=new');
    if (binary) options.setChromeBinaryPath(binary);
    return options;
  }

  if (browser === 'edge') {
    const options = new edge.Options();
    if (headless) options.addArguments('--headless=new');
    if (binary) options.setBinaryPath(binary);
    return options;
  }

  if (browser === 'firefox') {
    const options = new firefox.Options();
    if (headless) options.addArguments('-headless');
    if (binary) options.setBinary(binary);
    return options;
  }

  throw new Error(`Navegador não suportado: ${browser}`);
}

function xpathText(value: string): string {
  if (!value.includes("'")) return `'${value}'`;
  if (!value.includes('"')) return `"${value}"`;
  return `concat(${value.split("'").map(part => `'${part}'`).join(', "\'", ')})`;
}

async function openPage(path: string): Promise<void> {
  await driver.get(baseUrl);
  await driver.executeScript('window.localStorage.clear();');
  await driver.get(new URL(path, baseUrl).toString());
}

async function signIn(): Promise<void> {
  await openPage('/login');
  await driver.findElement(By.css('input[placeholder="Email"]')).sendKeys(adminEmail);
  await driver.findElement(By.css('input[placeholder="Senha"]')).sendKeys(adminPassword);
  await driver.findElement(By.css('button[type="submit"]')).click();
  await driver.wait(until.elementLocated(By.css('main h1')), 10000);
}

async function fillField(label: string, value: string): Promise<void> {
  const input = await driver.findElement(By.xpath(
    `//label[starts-with(normalize-space(.), ${xpathText(label)})]//input`
  ));
  await input.clear();
  await input.sendKeys(value);
}

async function createClient(name: string): Promise<WebElement> {
  await driver.get(new URL('/clientes', baseUrl).toString());
  await driver.wait(until.elementLocated(By.css('main h1')), 10000);
  await fillField('Nome', name);
  await driver.findElement(By.css('form button[type="submit"]')).click();
  return driver.wait(until.elementLocated(By.xpath(
    `//tr[contains(normalize-space(.), ${xpathText(name)})]`
  )), 10000);
}

async function createProduct(name: string, code: string, price: string, stock: number): Promise<WebElement> {
  await driver.get(new URL('/produtos', baseUrl).toString());
  await driver.wait(until.elementLocated(By.css('main h1')), 10000);
  await fillField('Código', code);
  await fillField('Nome', name);
  await fillField('Preço (R$)', String(price));
  await fillField('Estoque', String(stock));
  await fillField('Estoque mín.', '1');
  await driver.findElement(By.css('form button[type="submit"]')).click();
  return driver.wait(until.elementLocated(By.xpath(
    `//tr[contains(normalize-space(.), ${xpathText(name)})]`
  )), 10000);
}

async function createOrderFixture(): Promise<{
  clientName: string;
  productName: string;
  initialStock: number;
  price: string;
}> {
  const fixtureId = `${runId}-${++orderFixtureCount}`;
  const clientName = `E2E Cliente Pedido ${fixtureId}`;
  const productName = `E2E Produto Pedido ${fixtureId}`;
  const productCode = `E2E-${fixtureId}`.slice(0, 30);
  const price = '12.50';
  const initialStock = 8;

  await createClient(clientName);
  await createProduct(productName, productCode, price, initialStock);
  await driver.get(new URL('/pedidos/novo', baseUrl).toString());
  await driver.wait(until.elementLocated(By.css('main h1')), 10000);

  const selects = await driver.findElements(By.css('form select'));
  await driver.wait(until.elementLocated(By.xpath(
    `//main//form//select[1]/option[normalize-space(.)=${xpathText(clientName)}]`
  )), 10000);
  await driver.wait(until.elementLocated(By.xpath(
    `//main//form//select//option[normalize-space(.)=${xpathText(productName)}]`
  )), 10000);
  await selects[0].findElement(By.xpath(`.//option[normalize-space(.)=${xpathText(clientName)}]`)).click();
  await selects[1].findElement(By.xpath(`.//option[normalize-space(.)=${xpathText(productName)}]`)).click();
  const quantity = await driver.findElement(By.css('form input[type="number"]'));
  await quantity.clear();
  await quantity.sendKeys('2');

  return { clientName, productName, initialStock, price };
}

async function submitOrder(): Promise<void> {
  await driver.findElement(By.xpath('//button[normalize-space(.)="Confirmar pedido"]')).click();
  await driver.wait(until.urlContains('/pedidos/'), 10000);
  await driver.wait(until.elementLocated(By.xpath('//main//h1[starts-with(normalize-space(.), "Pedido ")]')), 10000);
}

async function rowFor(text: string): Promise<WebElement> {
  return driver.wait(until.elementLocated(By.xpath(
    `//tr[contains(normalize-space(.), ${xpathText(text)})]`
  )), 10000);
}

describe('Testes Selenium do ERP', { concurrency: false }, () => {
  before(async () => {
    const builder = new Builder().forBrowser(browserName);
    if (browserName === 'chrome') builder.setChromeOptions(browserOptions('chrome'));
    if (browserName === 'edge') builder.setEdgeOptions(browserOptions('edge'));
    if (browserName === 'firefox') builder.setFirefoxOptions(browserOptions('firefox'));
    driver = await builder.build();
    await driver.manage().setTimeouts({ implicit: 0, pageLoad: 20000, script: 10000 });
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  beforeEach(async () => {
    await openPage('/login');
  });

  it('01 - exibe a tela de login e as credenciais de demonstração', async () => {
    assert.equal(await driver.findElement(By.css('form h1')).getText(), 'ERP');
    assert.ok((await driver.findElement(By.css('form')).getText()).includes('admin@erp.com / admin123'));
  });

  it('02 - exige email e senha para enviar o login', async () => {
    await driver.findElement(By.css('button[type="submit"]')).click();
    const email = await driver.findElement(By.css('input[placeholder="Email"]'));
    const password = await driver.findElement(By.css('input[placeholder="Senha"]'));
    assert.equal(await driver.executeScript('return arguments[0].validity.valueMissing;', email), true);
    assert.equal(await driver.executeScript('return arguments[0].validity.valueMissing;', password), true);
    assert.match(await driver.getCurrentUrl(), /\/login$/);
  });

  it('03 - informa erro para credenciais inválidas', async () => {
    await driver.findElement(By.css('input[placeholder="Email"]')).sendKeys(`invalido-${runId}@example.com`);
    await driver.findElement(By.css('input[placeholder="Senha"]')).sendKeys('senha-incorreta');
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.elementLocated(By.xpath('//*[contains(normalize-space(.), "Credenciais inválidas")]')), 10000);
    assert.match(await driver.getCurrentUrl(), /\/login$/);
  });

  it('04 - autentica o administrador e abre o dashboard', async () => {
    await signIn();
    assert.equal(await driver.findElement(By.css('main h1')).getText(), 'Dashboard');
    assert.ok((await driver.findElement(By.css('aside')).getText()).includes('Administrador'));
  });

  it('05 - redireciona para login ao acessar uma página protegida sem sessão', async () => {
    await driver.get(new URL('/clientes', baseUrl).toString());
    await driver.wait(until.urlContains('/login'), 10000);
    assert.match(await driver.getCurrentUrl(), /\/login$/);
  });

  it('06 - carrega os principais indicadores do dashboard', async () => {
    await signIn();
    for (const label of ['Clientes', 'Fornecedores', 'Produtos', 'Estoque baixo', 'Pedidos abertos', 'Total em vendas']) {
      await driver.wait(until.elementLocated(By.xpath(`//main//*[normalize-space(.)=${xpathText(label)}]`)), 10000);
    }
  });

  it('07 - cadastra um cliente', async () => {
    await signIn();
    const name = `E2E Cliente ${runId}`;
    const row = await createClient(name);
    assert.ok((await row.getText()).includes(name));
  });

  it('08 - filtra clientes pela busca', async () => {
    await signIn();
    const baselineName = `E2E Cliente Base Busca ${runId}`;
    const name = `E2E Busca Cliente ${runId}`;
    await createClient(baselineName);
    await createClient(name);
    const search = await driver.findElement(By.css('input[placeholder="Buscar..."]'));
    await search.sendKeys(name);
    await driver.wait(async () => (await driver.findElements(By.xpath(
      `//tr[contains(normalize-space(.), ${xpathText(baselineName)})]`
    ))).length === 0, 10000);
    await driver.wait(async () => (await driver.findElements(By.xpath('//tbody/tr'))).length === 1, 10000);
    assert.ok((await (await rowFor(name)).getText()).includes(name));
    assert.equal((await driver.findElements(By.xpath('//tbody/tr'))).length, 1);
  });

  it('09 - edita os dados de um cliente cadastrado', async () => {
    await signIn();
    const originalName = `E2E Cliente Editar ${runId}`;
    const updatedName = `${originalName} Atualizado`;
    const row = await createClient(originalName);
    await row.findElement(By.xpath('.//button[normalize-space(.)="Editar"]')).click();
    await fillField('Nome', updatedName);
    await driver.findElement(By.css('form button[type="submit"]')).click();
    const updatedRow = await driver.wait(until.elementLocated(By.xpath(
      `//tr[contains(normalize-space(.), ${xpathText(updatedName)})]`
    )), 10000);
    assert.ok((await updatedRow.getText()).includes(updatedName));
  });

  it('10 - exclui um cliente após confirmação', async () => {
    await signIn();
    const name = `E2E Cliente Excluir ${runId}`;
    const row = await createClient(name);
    await row.findElement(By.xpath('.//button[normalize-space(.)="Excluir"]')).click();
    await driver.wait(until.alertIsPresent(), 5000);
    await driver.switchTo().alert().accept();
    await driver.wait(async () => (await driver.findElements(By.xpath(
      `//tr[contains(normalize-space(.), ${xpathText(name)})]`
    ))).length === 0, 10000);
    assert.equal((await driver.findElements(By.xpath(
      `//tr[contains(normalize-space(.), ${xpathText(name)})]`
    ))).length, 0);
  });

  it('11 - cadastra um fornecedor', async () => {
    await signIn();
    const name = `E2E Fornecedor ${runId}`;
    await driver.get(new URL('/fornecedores', baseUrl).toString());
    await driver.wait(until.elementLocated(By.css('main h1')), 10000);
    await fillField('Razão Social / Nome', name);
    await driver.findElement(By.css('form button[type="submit"]')).click();
    const supplierRow = await driver.wait(until.elementLocated(By.xpath(
      `//tr[contains(normalize-space(.), ${xpathText(name)})]`
    )), 10000);
    assert.ok((await supplierRow.getText()).includes(name));
  });

  it('12 - cadastra um produto e apresenta seu estoque', async () => {
    await signIn();
    const name = `E2E Produto ${runId}`;
    const row = await createProduct(name, `PROD-${runId}`.slice(0, 30), '24.90', 7);
    const cells = await row.findElements(By.css('td'));
    assert.equal(await cells[1].getText(), name);
    assert.equal(Number(await cells[2].getText()), 24.9);
    assert.equal(await cells[3].getText(), '7');
  });

  it('13 - calcula o total e exibe os itens do pedido criado', async () => {
    await signIn();
    const fixture = await createOrderFixture();
    const total = await driver.findElement(By.xpath('//strong[starts-with(normalize-space(.), "Total:")]'));
    assert.ok((await total.getText()).includes('25.00'));
    await submitOrder();
    const details = await driver.findElement(By.css('main')).getText();
    assert.ok(details.includes(fixture.clientName));
    assert.ok(details.includes(fixture.productName));
    assert.ok(details.includes('pendente'));
    assert.ok(details.includes('25.00'));
  });

  it('14 - cancela um pedido e devolve os itens ao estoque', async () => {
    await signIn();
    const fixture = await createOrderFixture();
    await submitOrder();
    await driver.get(new URL('/produtos', baseUrl).toString());
    let productRow = await rowFor(fixture.productName);
    let cells = await productRow.findElements(By.css('td'));
    assert.equal(await cells[3].getText(), String(fixture.initialStock - 2));

    await driver.get(new URL('/pedidos', baseUrl).toString());
    const orderRow = await rowFor(fixture.clientName);
    await orderRow.findElement(By.xpath('.//button[normalize-space(.)="Cancelar"]')).click();
    await driver.wait(until.alertIsPresent(), 5000);
    await driver.switchTo().alert().accept();
    await driver.wait(until.elementTextContains(orderRow, 'cancelado'), 10000);

    await driver.get(new URL('/produtos', baseUrl).toString());
    productRow = await rowFor(fixture.productName);
    cells = await productRow.findElements(By.css('td'));
    assert.equal(await cells[3].getText(), String(fixture.initialStock));
  });

  it('15 - permite ao administrador cadastrar um usuário vendedor', async () => {
    await signIn();
    await driver.get(new URL('/usuarios', baseUrl).toString());
    await driver.wait(until.elementLocated(By.css('main h1')), 10000);
    const name = `E2E Vendedor ${runId}`;
    const email = `e2e-${runId}@example.com`;
    await fillField('Nome', name);
    await fillField('Email', email);
    await fillField('Senha', 'senha-e2e-123');
    await driver.findElement(By.css('form button[type="submit"]')).click();
    const userRow = await driver.wait(until.elementLocated(By.xpath(
      `//tr[contains(normalize-space(.), ${xpathText(email)})]`
    )), 10000);
    assert.ok((await userRow.getText()).includes('vendedor'));
  });
});
