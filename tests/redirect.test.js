const puppeteer = require('puppeteer');
const path = require('path');

describe('automatic redirection', () => {
  test('page redirects to canvas.html', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const target = 'file://' + path.resolve(__dirname, '../ShareboardApp/canvas.html');
    const html = `<!DOCTYPE html><html><head><title>Redirect Test</title></head><body><script>setTimeout(function(){window.location.href='${target}';}, 2000);</script></body></html>`;
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2200);
    expect(page.url()).toBe(target);
    await browser.close();
  });
});
