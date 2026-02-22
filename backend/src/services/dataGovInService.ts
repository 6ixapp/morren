/**
 * Indian Spices Board Scraper Service
 * Fetches cardamom market prices by scraping indianspices.com daily price page
 */

import axios from 'axios';
import { DataGovInRecord } from '../types';

const INDIANSPICES_URL =
  'https://www.indianspices.com/marketing/price/domestic/daily-price.html';

const MONTH_MAP: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

/** Converts "21-Feb-2026" to "2026-02-21" */
function parseDateStr(dateStr: string): string {
  const m = dateStr.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (m) {
    const [, dd, mon, yyyy] = m;
    const mm = MONTH_MAP[mon] || '01';
    return `${yyyy}-${mm}-${dd.padStart(2, '0')}`;
  }
  return dateStr.trim();
}

/** Extract a field value from a text block like "Field:\nvalue," */
function extractField(text: string, label: string): string {
  const re = new RegExp(label + '[:\\s]+([^,\\n]+)', 'i');
  const m = text.match(re);
  return m ? m[1].trim().replace(/,$/, '') : '';
}

/**
 * Fetches and parses cardamom prices from indianspices.com
 */
export async function fetchCardamomPrices(): Promise<DataGovInRecord[]> {
  console.log('🔍 Fetching cardamom prices from indianspices.com...');

  const response = await axios.get<string>(INDIANSPICES_URL, {
    timeout: 30000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; CardamomPriceFetcher/1.0)',
    },
    responseType: 'text',
  });

  const html: string = response.data;

  // Extract marquee content
  const marqueeMatch = html.match(/<marquee[^>]*>([\s\S]*?)<\/marquee>/i);
  if (!marqueeMatch) {
    throw new Error('Could not find marquee price data on indianspices.com');
  }
  const marqueeHtml = marqueeMatch[1];

  // Strip HTML tags to get plain text
  const plainText = marqueeHtml.replace(/<[^>]+>/g, ' ');

  // Split into blocks by "Spice:" keyword
  const blocks = plainText.split(/(?=Spice\s*:)/i).filter((b) => b.trim());

  const records: DataGovInRecord[] = [];

  for (const block of blocks) {
    const spiceMatch = block.match(/Spice\s*:\s*([^\n,]+)/i);
    if (!spiceMatch) continue;
    const spice = spiceMatch[1].trim();

    if (/small cardamom/i.test(spice)) {
      // Auction record: Date of Auction, Auctioneer, Max Price, Avg. Price
      const dateRaw = extractField(block, 'Date of Auction');
      const auctioneer = extractField(block, 'Auctioneer');
      const maxPrice = extractField(block, 'Max Price \\(Rs\\.?\\/Kg\\)');
      const avgPrice = extractField(block, 'Avg\\.? Price \\(Rs\\.?\\/Kg\\)');

      if (!dateRaw || !auctioneer || !avgPrice) continue;

      records.push({
        state: undefined,
        district: undefined,
        market: auctioneer,
        commodity: 'Small Cardamom',
        variety: 'Small',
        arrival_date: parseDateStr(dateRaw),
        min_price: '',
        max_price: maxPrice,
        modal_price: avgPrice,
      });
    } else if (/large cardamom/i.test(spice)) {
      // Market record: Date, Market, Type, Price
      const dateRaw = extractField(block, 'Date');
      const market = extractField(block, 'Market');
      const type = extractField(block, 'Type');
      const price = extractField(block, 'Price \\(Rs\\.?\\/Kg\\)');

      if (!dateRaw || !market || !price) continue;

      records.push({
        state: undefined,
        district: undefined,
        market,
        commodity: 'Large Cardamom',
        variety: type || 'Unknown',
        arrival_date: parseDateStr(dateRaw),
        min_price: '',
        max_price: price,
        modal_price: price,
      });
    }
  }

  console.log(`✅ Scraped ${records.length} cardamom price records from indianspices.com`);
  return records;
}

/**
 * Fetches cardamom prices with retry logic
 */
export async function fetchCardamomPricesWithRetry(
  maxRetries: number = 3
): Promise<DataGovInRecord[]> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchCardamomPrices();
    } catch (error) {
      lastError = error as Error;
      console.log(`⚠️ Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);

      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying in ${waitTime / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Failed to fetch cardamom prices after retries');
}
