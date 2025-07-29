/**
 * Puppeteer Test Setup and Configuration
 * TDD GREEN Phase - Setup infrastructure for visual testing
 */

import puppeteer, { Browser, Page, Viewport } from 'puppeteer';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface PuppeteerTestConfig {
  headless: boolean | 'new';
  slowMo?: number;
  devtools?: boolean;
  defaultViewport?: Viewport;
  timeout?: number;
  args?: string[];
}

export interface ViewportTestCase {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  isLandscape?: boolean;
}

/**
 * Predefined viewport configurations for comprehensive testing
 */
export const VIEWPORT_CONFIGURATIONS: ViewportTestCase[] = [
  // Mobile Devices
  {
    name: 'iphone-se',
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  {
    name: 'iphone-12',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  {
    name: 'iphone-12-landscape',
    width: 844,
    height: 390,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    isLandscape: true,
  },
  {
    name: 'android-pixel-5',
    width: 393,
    height: 851,
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
  },
  
  // Tablet Devices
  {
    name: 'ipad',
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: true,
  },
  {
    name: 'ipad-landscape',
    width: 1024,
    height: 768,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: true,
    isLandscape: true,
  },
  {
    name: 'ipad-pro',
    width: 1024,
    height: 1366,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: true,
  },
  
  // Desktop Resolutions
  {
    name: 'desktop-small',
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  {
    name: 'desktop-standard',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  {
    name: 'desktop-large',
    width: 2560,
    height: 1440,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  {
    name: 'desktop-4k',
    width: 3840,
    height: 2160,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  {
    name: 'ultrawide',
    width: 3440,
    height: 1440,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  
  // High DPI variants
  {
    name: 'desktop-standard-hidpi',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
  },
  {
    name: 'desktop-large-hidpi',
    width: 2560,
    height: 1440,
    deviceScaleFactor: 1.5,
    isMobile: false,
    hasTouch: false,
  },
];

/**
 * Font size test configurations
 */
export const FONT_SIZE_CONFIGURATIONS = [
  { name: 'xs', size: '10px', description: 'Extra Small' },
  { name: 'sm', size: '12px', description: 'Small' },
  { name: 'base', size: '14px', description: 'Base/Default' },
  { name: 'lg', size: '16px', description: 'Large' },
  { name: 'xl', size: '18px', description: 'Extra Large' },
  { name: '2xl', size: '20px', description: 'Double Extra Large' },
  { name: '3xl', size: '24px', description: 'Triple Extra Large' },
];

/**
 * Theme configurations for testing
 */
export const THEME_CONFIGURATIONS = [
  { name: 'cyberpunk', description: 'Cyberpunk Neon Theme' },
  { name: 'matrix', description: 'Matrix Green Theme' },
  { name: 'dracula', description: 'Dracula Theme' },
  { name: 'monokai', description: 'Monokai Theme' },
  { name: 'solarized-dark', description: 'Solarized Dark Theme' },
  { name: 'solarized-light', description: 'Solarized Light Theme' },
  { name: 'nord', description: 'Nord Theme' },
  { name: 'one-dark', description: 'One Dark Theme' },
];

/**
 * Puppeteer Test Manager
 */
export class PuppeteerTestManager {
  private browser: Browser | null = null;
  private pages: Map<string, Page> = new Map();
  private config: PuppeteerTestConfig;
  private outputDir: string;

  constructor(config?: Partial<PuppeteerTestConfig>) {
    this.config = {
      headless: 'new',
      slowMo: 0,
      devtools: false,
      timeout: 30000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--font-render-hinting=none',
        '--disable-font-subpixel-positioning',
      ],
      ...config,
    };
    
    this.outputDir = join(process.cwd(), 'test-results', 'screenshots');
    this.ensureOutputDirectory();
  }

  private async ensureOutputDirectory(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  /**
   * Initialize browser instance
   */
  async initializeBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      slowMo: this.config.slowMo,
      devtools: this.config.devtools,
      args: this.config.args,
      defaultViewport: this.config.defaultViewport,
    });

    return this.browser;
  }

  /**
   * Create a new page with specific configuration
   */
  async createPage(pageId: string, viewport?: ViewportTestCase): Promise<Page> {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    const page = await this.browser!.newPage();
    
    if (viewport) {
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.deviceScaleFactor || 1,
        isMobile: viewport.isMobile || false,
        hasTouch: viewport.hasTouch || false,
        isLandscape: viewport.isLandscape || false,
      });
    }

    // Set user agent for mobile testing
    if (viewport?.isMobile) {
      await page.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
      );
    }

    // Configure page settings
    await page.setDefaultTimeout(this.config.timeout!);
    
    // Enable console logging for debugging
    page.on('console', (msg) => {
      if (process.env.NODE_ENV === 'test') {
        console.log(`Page Console [${pageId}]:`, msg.text());
      }
    });

    // Handle page errors
    page.on('error', (err) => {
      console.error(`Page Error [${pageId}]:`, err);
    });

    page.on('pageerror', (err) => {
      console.error(`Page Error [${pageId}]:`, err);
    });

    this.pages.set(pageId, page);
    return page;
  }

  /**
   * Navigate to the application
   */
  async navigateToApp(page: Page, url: string = 'http://localhost:8080'): Promise<void> {
    await page.goto(url, {
      waitUntil: ['networkidle2', 'domcontentloaded'],
      timeout: this.config.timeout,
    });

    // Wait for the terminal to be ready
    await page.waitForSelector('[data-testid="terminal-container"]', {
      timeout: 10000,
    });

    // Additional wait for any async initialization
    await page.waitForTimeout(500);
  }

  /**
   * Take a screenshot with metadata
   */
  async takeScreenshot(
    page: Page,
    name: string,
    options?: {
      fullPage?: boolean;
      clip?: { x: number; y: number; width: number; height: number };
      quality?: number;
      type?: 'png' | 'jpeg';
    }
  ): Promise<Buffer> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = join(this.outputDir, filename);

    const screenshot = await page.screenshot({
      path: filepath,
      fullPage: options?.fullPage || false,
      clip: options?.clip,
      quality: options?.quality,
      type: options?.type || 'png',
    });

    return screenshot as Buffer;
  }

  /**
   * Apply theme to the application
   */
  async applyTheme(page: Page, themeName: string): Promise<void> {
    await page.evaluate((theme) => {
      // Check if themeManager exists
      if (typeof (window as any).themeManager !== 'undefined') {
        (window as any).themeManager.setTheme(theme);
      } else {
        // Fallback: set theme via CSS classes or attributes
        document.documentElement.setAttribute('data-theme', theme);
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
      }
    }, themeName);

    // Wait for theme application
    await page.waitForTimeout(300);
  }

  /**
   * Set font size for testing
   */
  async setFontSize(page: Page, fontSize: string): Promise<void> {
    await page.evaluate((size) => {
      const terminalOutput = document.querySelector('[data-testid="terminal-output"]');
      const terminalInput = document.querySelector('[data-testid="terminal-input"]');
      
      if (terminalOutput) {
        (terminalOutput as HTMLElement).style.fontSize = size;
      }
      if (terminalInput) {
        (terminalInput as HTMLElement).style.fontSize = size;
      }
      
      // Also set on the root for consistency
      document.documentElement.style.fontSize = size;
    }, fontSize);

    // Wait for font rendering
    await page.waitForTimeout(200);
  }

  /**
   * Simulate terminal input
   */
  async typeInTerminal(page: Page, text: string, options?: { delay?: number }): Promise<void> {
    const terminalInput = '[data-testid="terminal-input"]';
    
    // Focus the terminal first
    await page.click(terminalInput);
    await page.waitForTimeout(100);
    
    // Type the text
    await page.type(terminalInput, text, {
      delay: options?.delay || 50,
    });
  }

  /**
   * Execute terminal command
   */
  async executeCommand(page: Page, command: string): Promise<void> {
    await this.typeInTerminal(page, command);
    await page.keyboard.press('Enter');
    
    // Wait for command execution
    await page.waitForTimeout(1000);
  }

  /**
   * Get cursor position
   */
  async getCursorPosition(page: Page): Promise<{ x: number; y: number; width: number; height: number } | null> {
    return await page.evaluate(() => {
      const cursor = document.querySelector('[data-testid="terminal-cursor"]');
      if (!cursor) return null;
      
      const rect = cursor.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
    });
  }

  /**
   * Get terminal metrics
   */
  async getTerminalMetrics(page: Page): Promise<{
    container: DOMRect;
    output: DOMRect;
    cursor?: DOMRect;
    fontMetrics: { width: number; height: number };
  }> {
    return await page.evaluate(() => {
      const container = document.querySelector('[data-testid="terminal-container"]');
      const output = document.querySelector('[data-testid="terminal-output"]');
      const cursor = document.querySelector('[data-testid="terminal-cursor"]');
      
      // Calculate font metrics
      const testChar = document.createElement('span');
      testChar.style.fontFamily = 'monospace';
      testChar.style.fontSize = getComputedStyle(output || document.body).fontSize;
      testChar.style.visibility = 'hidden';
      testChar.style.position = 'absolute';
      testChar.textContent = 'M';
      document.body.appendChild(testChar);
      const charRect = testChar.getBoundingClientRect();
      document.body.removeChild(testChar);
      
      return {
        container: container?.getBoundingClientRect() || new DOMRect(),
        output: output?.getBoundingClientRect() || new DOMRect(),
        cursor: cursor?.getBoundingClientRect(),
        fontMetrics: {
          width: charRect.width,
          height: charRect.height,
        },
      };
    });
  }

  /**
   * Wait for terminal to be ready
   */
  async waitForTerminalReady(page: Page): Promise<void> {
    await page.waitForSelector('[data-testid="terminal-container"]');
    await page.waitForSelector('[data-testid="terminal-output"]');
    
    // Wait for any async initialization
    await page.waitForFunction(() => {
      const container = document.querySelector('[data-testid="terminal-container"]');
      return container && container.getBoundingClientRect().width > 0;
    });
  }

  /**
   * Clear terminal content
   */
  async clearTerminal(page: Page): Promise<void> {
    await page.evaluate(() => {
      const output = document.querySelector('[data-testid="terminal-output"]');
      const input = document.querySelector('[data-testid="terminal-input"]');
      
      if (output) {
        output.textContent = '';
      }
      if (input) {
        (input as HTMLInputElement).value = '';
      }
    });
  }

  /**
   * Get page by ID
   */
  getPage(pageId: string): Page | undefined {
    return this.pages.get(pageId);
  }

  /**
   * Close specific page
   */
  async closePage(pageId: string): Promise<void> {
    const page = this.pages.get(pageId);
    if (page) {
      await page.close();
      this.pages.delete(pageId);
    }
  }

  /**
   * Close all pages and browser
   */
  async cleanup(): Promise<void> {
    // Close all pages
    for (const [pageId, page] of this.pages) {
      try {
        await page.close();
      } catch (error) {
        console.warn(`Error closing page ${pageId}:`, error);
      }
    }
    this.pages.clear();

    // Close browser
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.warn('Error closing browser:', error);
      }
      this.browser = null;
    }
  }
}

/**
 * Utility function to create test matrix
 */
export function createTestMatrix<T>(
  testCases: T[],
  iterator: (testCase: T, index: number) => Promise<void>
): Promise<void[]> {
  return Promise.all(testCases.map(iterator));
}

/**
 * Wait for network idle
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Take a screenshot of a specific element
 */
export async function screenshotElement(
  page: Page,
  selector: string,
  name: string
): Promise<Buffer> {
  const element = await page.$(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  
  return await element.screenshot() as Buffer;
}

/**
 * Compare two screenshots and return similarity
 */
export async function quickScreenshotComparison(
  screenshot1: Buffer,
  screenshot2: Buffer
): Promise<number> {
  // Quick comparison using basic buffer comparison
  if (screenshot1.length !== screenshot2.length) {
    return 0;
  }
  
  let differences = 0;
  for (let i = 0; i < screenshot1.length; i++) {
    if (screenshot1[i] !== screenshot2[i]) {
      differences++;
    }
  }
  
  return 1 - (differences / screenshot1.length);
}