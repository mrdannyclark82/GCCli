import { chromium, Browser, BrowserContext } from 'playwright';
import { CoreSystemSkill } from './CoreSystemSkill.js';
import { Tool } from '../tools/ToolRegistry.js';

/**
 * BrowserSkill
 * Provides web search and text extraction capabilities using Playwright.
 * Supports an interactive mode for manual logins.
 */
export class BrowserSkill extends CoreSystemSkill {
  name = 'Browser';
  description = 'Provides web search and extraction capabilities using Playwright.';
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private isHeadless: boolean = true;

  async initialize(): Promise<void> {
    console.log('[Browser] Skill initialized.');
  }

  private async getBrowser(options?: { headless?: boolean }): Promise<Browser> {
    const requestedHeadless = options?.headless ?? true;

    // Check if browser is still connected; if not, cleanup.
    if (this.browser && !this.browser.isConnected()) {
      await this.close();
    }

    // If browser exists but we need to switch from headless to interactive, restart it.
    // If we are already interactive (!isHeadless), we stay interactive even if headless is requested.
    if (this.browser) {
      if (this.isHeadless === requestedHeadless || !this.isHeadless) {
        return this.browser;
      }
      await this.close();
    }

    try {
      this.browser = await chromium.launch({ 
        headless: requestedHeadless,
        args: requestedHeadless ? [] : ['--start-maximized']
      });
      this.isHeadless = requestedHeadless;
      if (!requestedHeadless) {
        console.log('[Browser] Interactive browser launched.');
      }
    } catch (error: any) {
      console.error(`[Browser] Failed to launch browser: ${error.message}`);
      throw new Error(`Playwright browser launch failed. Ensure browsers are installed with 'npx playwright install'. Error: ${error.message}`);
    }
    return this.browser;
  }

  private async getBrowserContext(options?: { headless?: boolean }): Promise<BrowserContext> {
    await this.getBrowser(options);
    if (!this.context) {
      this.context = await this.browser!.newContext();
    }
    return this.context;
  }

  async execute(context: any): Promise<any> {
    const { action, query, url } = context;
    if (action === 'search') return this.webSearch(query);
    if (action === 'extract') return this.webExtract(url);
    if (action === 'harvest') return this.webHarvest();
    if (action === 'interactive') {
      await this.getBrowserContext({ headless: false });
      const ctx = await this.getBrowserContext();
      if (ctx.pages().length === 0) {
        await ctx.newPage();
      }
      return 'Interactive browser launched and ready.';
    }
    if (action === 'close') {
      await this.close();
      return 'Browser closed.';
    }
    throw new Error(`Unknown action: ${action}`);
  }

  getCommands() {
    return [
      {
        metadata: {
          name: 'browser',
          description: 'Control the browser (interactive mode or close).',
          usage: '/browser [interactive|close]'
        },
        handler: async (args: string[]) => {
          const action = args[0];
          if (action === 'interactive') {
            await this.execute({ action: 'interactive' });
            console.log('[Browser] Interactive mode active. You can now use the browser for manual logins.');
          } else if (action === 'close') {
            await this.execute({ action: 'close' });
            console.log('[Browser] Browser closed.');
          } else {
            console.log('Usage: /browser [interactive|close]');
          }
        }
      }
    ];
  }

  getTools(): Tool[] {
    return [
      {
        name: 'web_search',
        description: 'Searches the web using DuckDuckGo and returns top results (title, link, snippet).',
        schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The search query.' }
          },
          required: ['query']
        },
        execute: async ({ query }) => this.webSearch(query)
      },
      {
        name: 'web_extract',
        description: 'Navigates to a URL and extracts the main text content.',
        schema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'The URL to extract content from.' }
          },
          required: ['url']
        },
        execute: async ({ url }) => this.webExtract(url)
      },
      {
        name: 'web_harvest',
        description: 'Extracts the raw text content from the currently active browser page.',
        schema: {
          type: 'object',
          properties: {}
        },
        execute: async () => this.webHarvest()
      }
    ];
  }

  private async webSearch(query: string) {
    console.log(`[Browser] Searching for: "${query}"`);
    let context;
    try {
      context = await this.getBrowserContext();
    } catch (err: any) {
      return err.message;
    }

    const page = await context.newPage();
    try {
      // Use DuckDuckGo as the search engine
      await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, { waitUntil: 'networkidle' });
      
      // Extract results using selectors common in DDG
      const results = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('article[data-testid="result"]'));
        return items.slice(0, 5).map(item => {
          const titleEl = item.querySelector('h2 a');
          const snippetEl = item.querySelector('div[data-result="snippet"]');
          return {
            title: titleEl?.textContent || 'No Title',
            link: (titleEl as HTMLAnchorElement)?.href || '',
            snippet: snippetEl?.textContent || 'No Snippet'
          };
        });
      });

      if (results.length === 0) {
        return "No results found. The search engine might have changed its layout or blocked the request.";
      }

      return results;
    } catch (error: any) {
      console.error(`[Browser] Search error: ${error.message}`);
      return `Error performing search: ${error.message}`;
    } finally {
      await page.close();
    }
  }

  private async webExtract(url: string) {
    console.log(`[Browser] Extracting content from: ${url}`);
    let context;
    try {
      context = await this.getBrowserContext();
    } catch (err: any) {
      return err.message;
    }

    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Basic text extraction from the body
      const text = await page.textContent('body');
      return text?.trim().slice(0, 8000) || 'No content found.';
    } catch (error: any) {
      console.error(`[Browser] Extraction error: ${error.message}`);
      return `Error extracting content: ${error.message}`;
    } finally {
      await page.close();
    }
  }

  private async webHarvest() {
    console.log(`[Browser] Harvesting content from active page...`);
    if (!this.context) {
      return "Error: No active browser context. Use /browser interactive first.";
    }
    const pages = this.context.pages();
    if (pages.length === 0) {
      return "Error: No active pages found in browser context.";
    }
    // Get the last page as the "active" one
    const page = pages[pages.length - 1];
    try {
      const text = await page.innerText('body');
      return text || 'No content found on the active page.';
    } catch (error: any) {
      console.error(`[Browser] Harvest error: ${error.message}`);
      return `Error harvesting content: ${error.message}`;
    }
  }

  async close() {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.isHeadless = true;
  }
}
