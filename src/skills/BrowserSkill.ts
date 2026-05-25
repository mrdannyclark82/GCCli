import { chromium, Browser } from 'playwright';
import { CoreSystemSkill } from './CoreSystemSkill.js';
import { Tool } from '../tools/ToolRegistry.js';

/**
 * BrowserSkill
 * Provides web search and text extraction capabilities using Playwright.
 * Part of Phase 5: Proactive Agency.
 */
export class BrowserSkill extends CoreSystemSkill {
  name = 'Browser';
  description = 'Provides web search and extraction capabilities using Playwright.';
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    console.log('[Browser] Skill initialized.');
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      try {
        this.browser = await chromium.launch({ headless: true });
      } catch (error: any) {
        console.error(`[Browser] Failed to launch browser: ${error.message}`);
        throw new Error(`Playwright browser launch failed. Ensure browsers are installed with 'npx playwright install'. Error: ${error.message}`);
      }
    }
    return this.browser;
  }

  async execute(context: any): Promise<any> {
    const { action, query, url } = context;
    if (action === 'search') return this.webSearch(query);
    if (action === 'extract') return this.webExtract(url);
    throw new Error(`Unknown action: ${action}`);
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
      }
    ];
  }

  private async webSearch(query: string) {
    console.log(`[Browser] Searching for: "${query}"`);
    let browser;
    try {
      browser = await this.getBrowser();
    } catch (err: any) {
      return err.message;
    }

    const page = await browser.newPage();
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
    let browser;
    try {
      browser = await this.getBrowser();
    } catch (err: any) {
      return err.message;
    }

    const page = await browser.newPage();
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

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
