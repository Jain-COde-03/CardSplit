import offerScraperService from './src/services/offerScraper.service.js';
import { recommendOffers } from './src/services/offerRecommendation.service.js';

const rawOffers = [
  {
    title: 'Bank Offer Upto ₹4,000.00 discount on SBI Credit Cards, SBI Debit Cards 22 offers',
    source: 'page_scrape',
    retailer: 'amazon'
  },
  {
    title: 'No Cost EMI Upto ₹4,708.26 EMI interest savings on select Credit Cards, HDFC Bank Debit Cards, Amazon Pay Later 3 offers',
    source: 'page_scrape',
    retailer: 'amazon'
  },
  {
    title: 'Cashback Upto ₹1,799.00 cashback as Amazon Pay Balance when you pay with Amazon Pay ICICI Bank Credit Cards 1 offer',
    source: 'page_scrape',
    retailer: 'amazon'
  }
];

const normalized = offerScraperService.normalizeOffers(rawOffers);
console.log('Normalized offers:', JSON.stringify(normalized, null, 2));

const rec = await recommendOffers(normalized, 'amazon', 59990);
console.log('Recommended offers:', JSON.stringify(rec, null, 2));
