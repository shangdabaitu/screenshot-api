import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  const { url, delay = 3000, width = 1920, height = 1080 } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let browser = null;
  
  try {
    // 关键修复：使用 chromium.args 和正确的 executablePath
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--hide-scrollbars',
        '--disable-web-security',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    
    // 设置视口
    await page.setViewport({ 
      width: parseInt(width), 
      height: parseInt(height) 
    });
    
    // 设置 User-Agent 伪装真实浏览器
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // 访问页面
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 25000 
    });
    
    // 等待 JS 渲染（500.com 需要这个）
    await new Promise(resolve => setTimeout(resolve, parseInt(delay)));
    
    // 截图
    const screenshot = await page.screenshot({ 
      fullPage: true,
      type: 'png'
    });
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(screenshot);
    
  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({ 
      error: 'Screenshot failed', 
      details: error.message 
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
