import fs from 'fs';
import * as cheerio from 'cheerio';
import AmazonScraper from './src/scrapers/amazon.scraper.js';

const html = fs.readFileSync('/tmp/amazon_test.html', 'utf8');
const scraper = new AmazonScraper();
const result = scraper.scrapeProduct('https://www.amazon.in/dp/B0GZ3FBR3W', html);
console.log('Scraper result:', JSON.stringify(result, null, 2));
