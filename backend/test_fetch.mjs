import axios from 'axios';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function test() {
  const url = 'https://www.amazon.in/dp/B0GZ3FBR3W';
  console.log('Testing axios fetch for:', url);
  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8',
        'sec-ch-ua': '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
      },
    });
    console.log('Axios success! Status:', response.status, 'HTML length:', response.data.length);
    console.log('Bot challenge:', response.data.includes('api-services-support@amazon.com') || response.data.includes('validateCaptcha'));
  } catch (err) {
    console.log('Axios failed:', err.message);
  }

  console.log('\nTesting curl fallback fetch for:', url);
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
    console.log('Curl success! HTML length:', stdout.length);
    console.log('Bot challenge in curl:', stdout.includes('api-services-support@amazon.com') || stdout.includes('validateCaptcha'));
  } catch (err) {
    console.log('Curl failed:', err.message);
  }
}

test();
