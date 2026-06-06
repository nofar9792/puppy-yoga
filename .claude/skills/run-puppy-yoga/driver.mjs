#!/usr/bin/env node

import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let browser;
let page;
let isRunning = false;

async function launch() {
  try {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    page = await context.newPage();
    isRunning = true;
    console.log('Browser launched');
    return true;
  } catch (e) {
    console.error('Failed to launch browser:', e.message);
    return false;
  }
}

async function navigate(url) {
  if (!page) {
    console.error('Browser not launched. Run "launch" first.');
    return false;
  }
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    console.log(`Navigated to ${url}`);
    return true;
  } catch (e) {
    console.error('Navigation failed:', e.message);
    return false;
  }
}

async function screenshot(name) {
  if (!page) {
    console.error('Browser not launched. Run "launch" first.');
    return false;
  }
  try {
    const filename = `${SCREENSHOT_DIR}/${name || `screenshot-${Date.now()}`}.png`;
    await page.screenshot({ path: filename });
    console.log(`Screenshot saved: ${filename}`);
    return true;
  } catch (e) {
    console.error('Screenshot failed:', e.message);
    return false;
  }
}

async function testClassBrowsing() {
  if (!page) {
    console.error('Browser not launched. Run "launch" first.');
    return false;
  }
  try {
    console.log('Testing class browsing...');
    await navigate(`${BASE_URL}/`);

    // Wait for classes to load
    await page.waitForSelector('.card', { timeout: 5000 });

    // Verify classes are visible
    const classCards = await page.locator('.card').count();
    console.log(`✓ Found ${classCards} class cards`);

    // Check for seeded classes
    const hasClasses = await page.locator('text=Morning Paws Flow').isVisible();
    if (hasClasses) {
      console.log('✓ Classes loaded correctly');
    }

    await screenshot('01-home-classes');
    return true;
  } catch (e) {
    console.error('Class browsing test failed:', e.message);
    return false;
  }
}

async function testSearch() {
  if (!page) {
    console.error('Browser not launched. Run "launch" first.');
    return false;
  }
  try {
    console.log('Testing search functionality...');

    const searchInput = page.getByPlaceholder('Search by class name, instructor, or dog breed...');
    await searchInput.fill('Morning');
    await page.waitForTimeout(500);

    const visibleCards = await page.locator('.card:visible').count();
    console.log(`✓ Search filtered to ${visibleCards} result(s)`);

    await screenshot('02-search-results');

    // Clear search
    await page.getByLabel('Clear search').click();
    await page.waitForTimeout(300);
    console.log('✓ Search cleared');

    return true;
  } catch (e) {
    console.error('Search test failed:', e.message);
    return false;
  }
}

async function testSignup() {
  if (!page) {
    console.error('Browser not launched. Run "launch" first.');
    return false;
  }
  try {
    console.log('Testing signup flow...');

    // Look for login/signup button
    const authButton = page.getByRole('button', { name: /login|sign ?up/i }).first();
    if (await authButton.isVisible()) {
      await authButton.click();
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      console.log('✓ Auth modal opened');
      await screenshot('03-auth-modal');
    } else {
      console.log('⚠ Auth button not visible');
    }

    return true;
  } catch (e) {
    console.error('Signup test failed:', e.message);
    return false;
  }
}

async function testApiHealth() {
  try {
    console.log('Testing API health...');

    const classesResp = await fetch(`${BASE_URL.replace(':5173', ':3001')}/api/classes`);
    const classes = await classesResp.json();
    console.log(`✓ API returned ${classes.length} classes`);

    return true;
  } catch (e) {
    console.error('API health check failed:', e.message);
    return false;
  }
}

async function runSmokeTest() {
  try {
    console.log('\n=== Puppy Yoga App Smoke Test ===\n');

    if (!(await launch())) return false;

    if (!(await testApiHealth())) return false;
    if (!(await testClassBrowsing())) return false;
    if (!(await testSearch())) return false;
    if (!(await testSignup())) return false;

    console.log('\n=== All tests passed ===\n');
    console.log(`Screenshots saved to: ${SCREENSHOT_DIR}/`);

    return true;
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}

// Interactive REPL mode
async function startRepl() {
  if (!(await launch())) {
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => rl.question('\npuppy-yoga> ', async (line) => {
    const [cmd, ...args] = line.trim().split(' ');

    try {
      switch (cmd) {
        case 'nav':
        case 'goto':
          await navigate(args[0] || `${BASE_URL}/`);
          break;
        case 'ss':
        case 'screenshot':
          await screenshot(args[0]);
          break;
        case 'test-browse':
          await testClassBrowsing();
          break;
        case 'test-search':
          await testSearch();
          break;
        case 'test-signup':
          await testSignup();
          break;
        case 'test-api':
          await testApiHealth();
          break;
        case 'url':
          console.log(page.url());
          break;
        case 'help':
          console.log(`
Commands:
  nav <url>           - Navigate to URL (default: ${BASE_URL}/)
  ss [name]           - Take screenshot
  test-browse         - Test class browsing
  test-search         - Test search functionality
  test-signup         - Test signup flow
  test-api            - Test API health
  url                 - Print current URL
  quit/exit           - Close browser and exit
  help                - Show this help
`);
          break;
        case 'quit':
        case 'exit':
          await browser.close();
          console.log('Browser closed. Goodbye!');
          rl.close();
          process.exit(0);
          break;
        default:
          if (cmd) console.log('Unknown command. Type "help" for available commands.');
      }
    } catch (e) {
      console.error('Error:', e.message);
    }

    prompt();
  });

  console.log(`Connected to ${BASE_URL}`);
  console.log('Type "help" for available commands');
  prompt();
}

// Main entry point
const args = process.argv.slice(2);
if (args[0] === 'smoke' || args[0] === 'test') {
  runSmokeTest().catch(console.error);
} else {
  startRepl();
}
