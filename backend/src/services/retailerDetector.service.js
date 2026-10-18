/**
 * Retailer detector service.
 * Identifies the retailer platform based on URL hostname and patterns.
 */
export function detectRetailer(urlOrHostname) {
  if (!urlOrHostname) return 'unsupported';

  let hostname;
  try {
    if (urlOrHostname.startsWith('http://') || urlOrHostname.startsWith('https://')) {
      const parsed = new URL(urlOrHostname);
      hostname = parsed.hostname.toLowerCase();
    } else {
      hostname = urlOrHostname.toLowerCase();
    }
  } catch {
    return 'unsupported';
  }

  if (hostname.includes('amazon') || hostname.includes('amzn')) {
    return 'amazon';
  }

  if (hostname.includes('flipkart')) {
    return 'flipkart';
  }

  if (hostname.includes('croma')) {
    return 'croma';
  }

  if (hostname.includes('apple')) {
    return 'apple';
  }

  if (hostname.includes('myntra')) {
    return 'myntra';
  }

  if (hostname.includes('tatacliq')) {
    return 'tatacliq';
  }

  if (hostname.includes('reliance')) {
    return 'reliancedigital';
  }

  if (hostname.includes('jiomart')) {
    return 'jiomart';
  }

  if (hostname.includes('meesho')) {
    return 'meesho';
  }

  if (hostname.includes('samsung')) {
    return 'samsung';
  }

  if (hostname.includes('oneplus')) {
    return 'oneplus';
  }

  return 'other';
}

export default {
  detectRetailer,
};
