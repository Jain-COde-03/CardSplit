import { describe, expect, it } from 'vitest';
import {
  validateProductUrl,
  isPrivateOrReservedIp,
  analyzeProductSchema,
} from '../../src/validators/productUrl.validator.js';

describe('Product URL Validator & SSRF Defenses', () => {
  describe('Valid URL parsing and normalization', () => {
    it('accepts and normalizes valid Amazon India URLs', () => {
      const url =
        'https://www.amazon.in/dp/B0BDK62PDX?tag=affiliate-21&ref=sr_1_1&utm_source=test#reviews';
      const result = validateProductUrl(url);

      expect(result.hostname).toBe('www.amazon.in');
      expect(result.normalizedUrl).toBe('https://www.amazon.in/dp/B0BDK62PDX');
      expect(result.rawUrl).toBe(url);
    });

    it('accepts valid Flipkart URLs with product ID', () => {
      const url =
        'https://www.flipkart.com/apple-iphone-14-blue-128-gb/p/itm12345?pid=MOBGHWFHUPRBGPUM&lid=LST123';
      const result = validateProductUrl(url);

      expect(result.hostname).toBe('www.flipkart.com');
      expect(result.normalizedUrl).toContain('pid=MOBGHWFHUPRBGPUM');
    });

    it('accepts valid Meesho URLs', () => {
      const url = 'https://www.meesho.com/printed-kurti/p/3b8x2?utm_medium=cpc';
      const result = validateProductUrl(url);

      expect(result.hostname).toBe('www.meesho.com');
      expect(result.normalizedUrl).toBe('https://www.meesho.com/printed-kurti/p/3b8x2');
    });
  });

  describe('SSRF Protections & Strict Rejection Rules', () => {
    it('rejects insecure HTTP URLs', () => {
      expect(() =>
        validateProductUrl('http://www.amazon.in/dp/B0BDK62PDX')
      ).toThrowError(/Only secure HTTPS URLs are permitted/);
    });

    it('rejects URLs containing embedded credentials', () => {
      expect(() =>
        validateProductUrl('https://admin:secret@www.amazon.in/dp/B0BDK62PDX')
      ).toThrowError(/embedded credentials are not allowed/);
    });

    it('rejects localhost and loopback hostnames', () => {
      expect(() => validateProductUrl('https://localhost/product')).toThrowError(
        /Localhost URLs are not permitted/
      );
      expect(() => validateProductUrl('https://app.localhost/product')).toThrowError(
        /Localhost URLs are not permitted/
      );
    });

    it('rejects direct IP addresses (loopback, private, cloud metadata)', () => {
      expect(() => validateProductUrl('https://127.0.0.1/admin')).toThrowError(
        /forbidden|Direct IP/
      );
      expect(() => validateProductUrl('https://169.254.169.254/latest/meta-data')).toThrowError(
        /forbidden|Direct IP/
      );
      expect(() => validateProductUrl('https://192.168.1.1/product')).toThrowError(
        /forbidden|Direct IP/
      );
      expect(() => validateProductUrl('https://10.0.0.1/product')).toThrowError(
        /forbidden|Direct IP/
      );
    });

    it('rejects unsupported retailer domains', () => {
      expect(() => validateProductUrl('https://random-store.com/item/123')).toThrowError(
        /Retailer not supported/
      );
      expect(() => validateProductUrl('https://malicious-site.org/payload')).toThrowError(
        /Retailer not supported/
      );
    });
  });

  describe('isPrivateOrReservedIp helper', () => {
    it('accurately detects private IPv4 ranges', () => {
      expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('10.1.2.3')).toBe(true);
      expect(isPrivateOrReservedIp('192.168.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('172.20.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true);
      expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false);
      expect(isPrivateOrReservedIp('104.244.42.1')).toBe(false);
    });
  });

  describe('analyzeProductSchema Zod validation', () => {
    it('validates correct URL payloads', () => {
      const parsed = analyzeProductSchema.safeParse({
        url: 'https://www.amazon.in/dp/B0BDK62PDX',
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects invalid or empty URL payloads', () => {
      const parsed = analyzeProductSchema.safeParse({ url: '' });
      expect(parsed.success).toBe(false);

      const parsedUnsupported = analyzeProductSchema.safeParse({
        url: 'https://unknown.com/item',
      });
      expect(parsedUnsupported.success).toBe(false);
    });
  });
});

