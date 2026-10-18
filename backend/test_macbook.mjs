import { execFile } from 'child_process';
import { promisify } from 'util';
import AmazonScraper from './src/scrapers/amazon.scraper.js';

const execFileAsync = promisify(execFile);

async function testMacbook() {
  const url = 'https://www.amazon.in/Apple-2026-MacBook-Laptop-chip/dp/B0GR1C18B7';
  console.log('Fetching MacBook URL via curl:', url);
  try {
    const { stdout } = await execFileAsync('curl', [
      '-s',
      '-L',
      '--compressed',
      '-A',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      '-H',
      'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      '-H',
      'Accept-Language: en-IN,en-US;q=0.9,en;q=0.8',
      url,
    ], { maxBuffer: 10 * 1024 * 1024 });

    console.log('Curl stdout length:', stdout.length);
    const scraper = new AmazonScraper();
    const result = scraper.scrapeProduct(url, stdout);
    console.log('Scraped Product:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testMacbook();
