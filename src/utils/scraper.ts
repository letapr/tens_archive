import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';

export async function scrapeGameData(): Promise<{ title: string; correctAnswers: string[] } | null> {
    let browser: Browser | undefined;
    let page: Page | undefined;
    
    try {
        // Launch puppeteer with more debugging options
        console.log('Launching browser...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-logging']
        });

        // Create a new page and set up console logging
        console.log('Creating new page...');
        page = await browser.newPage();
        page.on('console', msg => console.log('Browser console:', msg.text()));
        
        // Enable request tracking
        page.on('request', req => console.log('Request:', req.url()));
        page.on('requestfailed', req => console.log('Failed request:', req.url()));

        // Set a reasonable viewport
        await page.setViewport({ width: 1280, height: 800 });

        // Enable JavaScript
        await page.setJavaScriptEnabled(true);

        // Navigate to the page and wait for initial load
        console.log('Loading page...');
        await page.goto('https://dailytens.com', {
            waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
            timeout: 30000
        });

        // Wait for and click the PLAY button
        console.log('Waiting for PLAY button...');
        await page.waitForSelector('.playButton', { timeout: 10000 });
        await page.click('.playButton');
        
        // Wait for content to load after clicking play
        console.log('Clicked PLAY, waiting for game content...');
        
        // First wait for the loading state to go away
        await page.waitForFunction(() => {
            const loadingText = document.querySelector('.test-text');
            return !loadingText || loadingText.textContent !== 'loading font...';
        }, { timeout: 10000 });

        // Then wait for any element that might contain our content
        console.log('Waiting for title to appear...');
        const selectors = [
            '.Title',
            '.title-container div',
            'div[class*="title"]',
            'div[class*="Title"]'
        ];

        let foundSelector = null;
        for (const selector of selectors) {
            try {
                await page.waitForSelector(selector, { timeout: 5000 });
                console.log(`Found selector: ${selector}`);
                foundSelector = selector;
                break;
            } catch (e) {
                const error = e as Error;
                console.log(`Selector ${selector} failed:`, error.message);
            }
        }

        if (!foundSelector) {
            // Let's get the page content to see what's there
            const content = await page.content();
            console.log('Page content:', content);
            
            // Take a screenshot to help debug
            await page.screenshot({ path: 'debug-screenshot.png' });
            
            throw new Error('Could not find any title element after clicking PLAY');
        }

        // Get the title using the found selector
        const title = await page.$eval(foundSelector, (el: Element) => el.textContent?.trim() || '');
        console.log('Found title:', title);

        if (!title) {
            console.error('Could not find title element');
            return null;
        }

        // Try different selectors for answers
        const answerSelectors = [
            '.flip-card-back .texty',
            '.flip-card .texty',
            '[class*="flip-card"] [class*="texty"]'
        ];

        let answers: string[] = [];
        for (const selector of answerSelectors) {
            try {
                answers = await page.$$eval(selector, 
                    (elements: Element[]) => elements.map(el => el.textContent?.trim() || '').filter(Boolean)
                );
                if (answers.length > 0) {
                    console.log(`Found answers using selector: ${selector}`);
                    break;
                }
            } catch (e) {
                console.log(`Selector ${selector} failed:`, e.message);
            }
        }

        console.log(`Found ${answers.length} answers`);

        // Validate we have all answers
        if (answers.length !== 10) {
            console.error(`Expected 10 answers but found ${answers.length}`);
            return null;
        }

        // Return the scraped data
        return {
            title,
            correctAnswers: answers
        };
    } catch (error) {
        console.error('Error during scraping:', error);
        return null;
    } finally {
        // Clean up resources
        if (page) await page.close();
        if (browser) await browser.close();
    }
}