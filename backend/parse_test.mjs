import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('/tmp/amazon_test.html', 'utf8');
const $ = cheerio.load(html);

console.log('Title:', $('#productTitle').text().trim());
console.log('priceToPay a-offscreen:', $('.priceToPay .a-offscreen').first().text().trim());
console.log('corePriceDisplay a-price-whole:', $('#corePriceDisplay_desktop_feature_div .a-price-whole').first().text().trim());
console.log('first a-price-whole:', $('.a-price-whole').first().text().trim());
console.log('first a-offscreen:', $('.a-offscreen').first().text().trim());
console.log('basisPrice:', $('.basisPrice .a-offscreen').first().text().trim());

const offers = [];
$('[id*="bank"], [id*="offer"], .offers-items, .a-carousel-card').each((_, el) => {
  const text = $(el).text().replace(/\s+/g, ' ').trim();
  if (/bank offer|discount|cashback|emi/i.test(text) && text.length < 300) {
    if (!offers.includes(text)) offers.push(text);
  }
});
console.log('Found offers count:', offers.length);
console.log('Offers sample:', offers.slice(0, 5));
