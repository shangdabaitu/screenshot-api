import { chromium } from 'playwright-core';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing url' }), { status: 400 });
  }

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const screenshot = await page.screenshot({ fullPage: true });
    await browser.close();

    return new Response(screenshot, {
      headers: { 'Content-Type': 'image/png' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
