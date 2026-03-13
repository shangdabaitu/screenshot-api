import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export default async function handler(req, res) {
  // 使用标准 URL API 解析参数（修复 DEP0169 警告）
  const url = req.query?.url || '';
  const delay = parseInt(req.query?.delay) || 3000;
  
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ 
      error: 'Invalid or missing url parameter. Must start with http:// or https://' 
    });
  }

  let browser = null;
  
  try {
    console.log('Launching browser...');
    
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    console.log('Browser launched, creating page...');
    
    const page = await browser.newPage();
    
    // 设置 viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // 设置 User-Agent（模拟真实浏览器）
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // 设置额外 headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    console.log(`Navigating to: ${url}`);
    
    // 访问页面
    const response = await page.goto(url, { 
      waitUntil: ['networkidle2', 'domcontentloaded'],
      timeout: 30000 
    });
    
    console.log(`Page loaded: ${response?.status()}`);

    // 等待额外时间让 JS 渲染（针对 500.com）
    await new Promise(resolve => setTimeout(resolve, delay));
    
    console.log('Taking screenshot...');
    
    // 截图
    const screenshot = await page.screenshot({ 
      fullPage: true,
      type: 'png',
      encoding: 'binary'
    });
    
    console.log('Screenshot taken successfully');
    
    // 返回图片
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(screenshot);
    
  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({ 
      error: 'Screenshot failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}
