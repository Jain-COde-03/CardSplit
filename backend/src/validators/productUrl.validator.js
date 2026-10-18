import { z } from 'zod';
import net from 'node:net';

// Allowed retailer domains
export const SUPPORTED_RETAILER_DOMAINS = [
  'amazon.in',
  'www.amazon.in',
  'amazon.com',
  'www.amazon.com',
  'amzn.to',
  'amzn.in',
  'flipkart.com',
  'www.flipkart.com',
  'dl.flipkart.com',
  'croma.com',
  'www.croma.com',
  'apple.com',
  'www.apple.com',
  'myntra.com',
  'www.myntra.com',
  'tatacliq.com',
  'www.tatacliq.com',
  'reliancedigital.in',
  'www.reliancedigital.in',
  'jiomart.com',
  'www.jiomart.com',
  'meesho.com',
  'www.meesho.com',
  'samsung.com',
  'www.samsung.com',
  'oneplus.in',
  'www.oneplus.in',
];

// Parameters commonly used for tracking/analytics that do not alter product identity
const TRACKING_PARAMS = [
  'tag',
  'ascsubtag',
  'ref',
  'ref_',
  'linkCode',
  'camp',
  'creative',
  'creativeASIN',
  'fbclid',
  'gclid',
  'dchild',
  'keywords',
  'qid',
  'sr',
  'crid',
  'sprefix',
];

/**
 * Checks if an IP address string is a private, loopback, or link-local address.
 */
export function isPrivateOrReservedIp(ip) {
  if (!ip) return false;

  // IPv4 Loopback
  if (ip === '127.0.0.1' || ip === '0.0.0.0' || ip.startsWith('127.')) return true;

  // IPv6 Loopback / Unspecified
  if (ip === '::1' || ip === '::' || ip === '0:0:0:0:0:0:0:1') return true;

  // IPv4 Link-local / Cloud metadata (169.254.0.0/16)
  if (ip.startsWith('169.254.')) return true;

  // IPv4 RFC 1918 Private Ranges:
  // 10.0.0.0 - 10.255.255.255
  if (ip.startsWith('10.')) return true;

  // 192.168.0.0 - 192.168.255.255
  if (ip.startsWith('192.168.')) return true;

  // 172.16.0.0 - 172.31.255.255
  const parts = ip.split('.').map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }

  // IPv6 Unique Local Address (fc00::/7) or Link-Local (fe80::/10)
  const lower = ip.toLowerCase();
  if (lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80')) {
    return true;
  }

  return false;
}

/**
 * Validates a submitted product URL against strict SSRF defense rules
 * and supported retailer domain constraints.
 */
export function validateProductUrl(inputUrl) {
  if (typeof inputUrl !== 'string' || !inputUrl.trim()) {
    throw new Error('A product URL is required.');
  }

  const trimmed = inputUrl.trim();

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Invalid URL format. Please provide a well-formed URL.');
  }

  // 1. Enforce HTTPS (HTTP rejected for public shopping sites to protect against MITM)
  if (parsed.protocol !== 'https:') {
    throw new Error('Only secure HTTPS URLs are permitted.');
  }

  // 2. Reject credentials embedded in URL (e.g. https://user:pass@domain.com)
  if (parsed.username || parsed.password) {
    throw new Error('URLs containing embedded credentials are not allowed.');
  }

  const hostname = parsed.hostname.toLowerCase();

  // 3. Reject localhost and raw IP hostnames
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new Error('Localhost URLs are not permitted.');
  }

  // Check if hostname is an IP literal
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new Error('Access to private or local network IP addresses is forbidden.');
    }
    throw new Error('Direct IP addresses are not permitted. Please use the retailer domain.');
  }

  // Check for decimal-encoded or hex-encoded IP addresses (e.g. 2130706433)
  if (/^\d+$/.test(hostname)) {
    throw new Error('Direct IP addresses are not permitted.');
  }

  // 4. Strict retailer allowlist check
  const isAllowedRetailer = SUPPORTED_RETAILER_DOMAINS.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`)
  );

  if (!isAllowedRetailer) {
    throw new Error(
      `Retailer not supported. Supported retailers: Amazon, Flipkart, Croma, Apple, Myntra, Tata Cliq, Reliance Digital, and Meesho.`
    );
  }

  // 5. Normalize URL: strip tracking parameters and fragments
  const normalized = new URL(parsed.toString());
  normalized.hash = '';

  const paramsToDelete = [];
  for (const [key] of normalized.searchParams.entries()) {
    if (
      TRACKING_PARAMS.includes(key.toLowerCase()) ||
      key.toLowerCase().startsWith('utm_') ||
      key.toLowerCase().startsWith('pf_rd_')
    ) {
      paramsToDelete.push(key);
    }
  }

  for (const key of paramsToDelete) {
    normalized.searchParams.delete(key);
  }

  return {
    rawUrl: trimmed,
    normalizedUrl: normalized.toString(),
    hostname,
  };
}

// Zod schema for request body validation
export const analyzeProductSchema = z.object({
  url: z
    .string({ message: 'URL is required' })
    .trim()
    .min(1, 'URL cannot be empty')
    .refine(
      (val) => {
        try {
          validateProductUrl(val);
          return true;
        } catch {
          return false;
        }
      },
      {
        message:
          'Please enter a valid, secure HTTPS product URL from a supported retailer (Amazon India, Flipkart, or Meesho).',
      }
    ),
});

