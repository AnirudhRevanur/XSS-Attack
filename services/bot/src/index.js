const puppeteer = require('puppeteer');

const WEB_URL = process.env.WEB_URL || 'http://web:3000';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminpass';
const RELOAD_INTERVAL = parseInt(process.env.RELOAD_INTERVAL || '5000'); // 5 seconds default

async function runBot() {
  console.log('Starting admin bot...');
  console.log(`Web URL: ${WEB_URL}`);
  console.log(`Reload interval: ${RELOAD_INTERVAL}ms`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();

    // Set a reasonable viewport
    await page.setViewport({ width: 1280, height: 720 });

    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto(`${WEB_URL}/login`, { waitUntil: 'networkidle2' });

    // Fill in login form
    console.log('Logging in as admin...');
    await page.type('input[name="username"]', ADMIN_USERNAME);
    await page.type('input[name="password"]', ADMIN_PASSWORD);

    // Submit login form
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]')
    ]);

    console.log('Logged in successfully!');
    console.log('Starting periodic board reloads...');

    let reloadCount = 0;

    // Periodically reload the board page
    const reloadBoard = async () => {
      try {
        reloadCount++;
        console.log(`[${new Date().toISOString()}] Reload #${reloadCount} - Loading board...`);

        await page.goto(`${WEB_URL}/board`, {
          waitUntil: 'networkidle2',
          timeout: 300000
        });

        // Wait a bit for any scripts to execute
        await page.waitForTimeout(5000);

        console.log(`[${new Date().toISOString()}] Reload #${reloadCount} - Complete`);
      } catch (error) {
        console.error(`Error during reload #${reloadCount}:`, error.message);
      }
    };

    // Initial load
    await reloadBoard();

    // Set up periodic reloads
    setInterval(reloadBoard, RELOAD_INTERVAL);

  } catch (error) {
    console.error('Bot error:', error);
    await browser.close();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down bot...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down bot...');
  process.exit(0);
});

runBot().catch(console.error);
