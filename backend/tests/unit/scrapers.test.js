import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import AmazonScraper from '../../src/scrapers/amazon.scraper.js';
import FlipkartScraper from '../../src/scrapers/flipkart.scraper.js';
import MeeshoScraper from '../../src/scrapers/meesho.scraper.js';
import offerScraperService from '../../src/services/offerScraper.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, '../fixtures');

describe('Retailer Scrapers & Offer Extraction', () => {
  describe('AmazonScraper', () => {
    const scraper = new AmazonScraper();
    const sampleUrl = 'https://www.amazon.in/dp/B0BDK62PDX';
    const html = fs.readFileSync(path.join(fixturesDir, 'amazon-product.html'), 'utf-8');

    it('canHandle accurately identifies Amazon URLs', () => {
      expect(scraper.canHandle('https://www.amazon.in/dp/B0BDK62PDX')).toBe(true);
      expect(scraper.canHandle('https://amzn.to/3xyz')).toBe(true);
      expect(scraper.canHandle('https://www.flipkart.com/item')).toBe(false);
    });

    it('extractProductId extracts the 10-character ASIN', () => {
      expect(scraper.extractProductId('https://www.amazon.in/dp/B0BDK62PDX')).toBe('B0BDK62PDX');
      expect(
        scraper.extractProductId('https://www.amazon.in/Apple-iPhone-14-128GB/dp/B0BDK62PDX/ref=sr_1_1')
      ).toBe('B0BDK62PDX');
    });

    it('scrapeProduct correctly parses product fields from HTML fixture', () => {
      const product = scraper.scrapeProduct(sampleUrl, html);

      expect(product.name).toBe('Apple iPhone 14 (128 GB) - Blue');
      expect(product.brand).toBe('Apple');
      expect(product.price).toBe(56999);
      expect(product.currency).toBe('INR');
      expect(product.availability).toBe('in_stock');
      expect(product.retailer).toBe('amazon');
      expect(product.retailerProductId).toBe('B0BDK62PDX');
      expect(product.canonicalProductUrl).toBe('https://www.amazon.in/dp/B0BDK62PDX');
      expect(product.rawOffers.length).toBeGreaterThan(0);
    });
  });

  describe('FlipkartScraper', () => {
    const scraper = new FlipkartScraper();
    const sampleUrl =
      'https://www.flipkart.com/apple-iphone-14-blue-128-gb/p/itm12345?pid=MOBGHWFHUPRBGPUM';
    const html = fs.readFileSync(path.join(fixturesDir, 'flipkart-product.html'), 'utf-8');

    it('canHandle accurately identifies Flipkart URLs', () => {
      expect(scraper.canHandle(sampleUrl)).toBe(true);
      expect(scraper.canHandle('https://www.amazon.in/item')).toBe(false);
    });

    it('extractProductId extracts PID from searchParams or path', () => {
      expect(scraper.extractProductId(sampleUrl)).toBe('MOBGHWFHUPRBGPUM');
      expect(scraper.extractProductId('https://www.flipkart.com/product/p/itm222c09265ff35')).toBe(
        'ITM222C09265FF35'
      );
    });

    it('scrapeProduct correctly parses product details from HTML fixture', () => {
      const product = scraper.scrapeProduct(sampleUrl, html);

      expect(product.name).toBe('Apple iPhone 14 (Blue, 128 GB)');
      expect(product.brand).toBe('Apple');
      expect(product.price).toBe(57999);
      expect(product.currency).toBe('INR');
      expect(product.retailer).toBe('flipkart');
      expect(product.retailerProductId).toBe('MOBGHWFHUPRBGPUM');
      expect(product.rawOffers.length).toBeGreaterThan(0);
    });
  });

  describe('MeeshoScraper', () => {
    const scraper = new MeeshoScraper();
    const sampleUrl = 'https://www.meesho.com/printed-kurti/p/12345';
    const html = fs.readFileSync(path.join(fixturesDir, 'meesho-product.html'), 'utf-8');

    it('canHandle identifies Meesho URLs', () => {
      expect(scraper.canHandle(sampleUrl)).toBe(true);
      expect(scraper.canHandle('https://www.flipkart.com')).toBe(false);
    });

    it('extractProductId extracts product SKU/slug identifier', () => {
      expect(scraper.extractProductId(sampleUrl)).toBe('12345');
    });

    it('scrapeProduct correctly parses product fields', () => {
      const product = scraper.scrapeProduct(sampleUrl, html);

      expect(product.name).toBe('Women Rayon Printed Straight Kurti');
      expect(product.price).toBe(499);
      expect(product.retailer).toBe('meesho');
    });
  });

  describe('offerScraperService', () => {
    it('accurately identifies bank names from offer text', () => {
      expect(offerScraperService.detectBank('10% off on HDFC Bank Credit Card')).toBe('HDFC Bank');
      expect(offerScraperService.detectBank('5% cashback with Amazon Pay ICICI card')).toBe('ICICI Bank');
      expect(offerScraperService.detectBank('Flat Rs 1000 off on SBI Card')).toBe('SBI Card');
      expect(offerScraperService.detectBank('Flipkart Axis Bank Card offer')).toBe('Axis Bank');
    });

    it('parses percentage discount, cap, and min purchase from offer strings', () => {
      const rawText =
        '10% Instant Discount up to ₹5,000 on HDFC Bank Credit Card Non-EMI Transactions. Min purchase value ₹50,000.';
      const parsed = offerScraperService.parseOfferDetails(rawText);

      expect(parsed.bank).toBe('HDFC Bank');
      expect(parsed.discountType).toBe('instant_discount_percentage');
      expect(parsed.discountValue).toBe(10);
      expect(parsed.maximumDiscount).toBe(5000);
      expect(parsed.minimumPurchase).toBe(50000);
      expect(parsed.verificationStatus).toBe('unverified');
    });

    it('parses flat discount offers correctly', () => {
      const rawText = 'Flat ₹1,500 off on ICICI Bank Cards on orders of ₹15,000 and above';
      const parsed = offerScraperService.parseOfferDetails(rawText);

      expect(parsed.bank).toBe('ICICI Bank');
      expect(parsed.discountType).toBe('instant_discount_flat');
      expect(parsed.discountValue).toBe(1500);
      expect(parsed.minimumPurchase).toBe(15000);
    });

    it('keeps delayed cashback and EMI offers distinct from instant discounts', () => {
      expect(offerScraperService.parseOfferDetails('₹500 cashback on HDFC Bank Credit Card').discountType).toBe('cashback_flat');
      expect(offerScraperService.parseOfferDetails('10% off on HDFC Bank Credit Card via EMI').discountType).toBe('emi_discount');
      expect(offerScraperService.parseOfferDetails('₹1,000 off on HDFC Bank Credit Card EMI').discountType).toBe('emi_discount');
    });
  });
});
