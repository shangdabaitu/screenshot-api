import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  const { url, delay = 3000, width = 1920, height = 1080 } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: parseInt(width), height: parseInt(height) });
    
    // 设置 User-Agent 避免被反爬
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, parseInt(delay))); // 等待 JS 渲染
    
    const screenshot = await page.screenshot({ fullPage: true });
    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    res.send(screenshot);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
