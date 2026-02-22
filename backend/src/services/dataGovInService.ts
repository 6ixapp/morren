/**
 * Indian Spices Board Scraper Service
 * Fetches cardamom market prices by scraping indianspices.com daily price page
 */

import axios from 'axios';
import { DataGovInRecord } from '../types';

const INDIANSPICES_URL =
  'https://www.indianspices.com/marketing/price/domestic/daily-price.html';

const INDIANSPICES_SMALL_ARCHIVE_URL =
  'https://www.indianspices.com/marketing/price/domestic/daily-price-small.html';

const INDIANSPICES_LARGE_ARCHIVE_URL =
  'https://www.indianspices.com/marketing/price/domestic/daily-price-large.html';

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
 * Fetches small cardamom archive prices from indianspices.com/daily-price-small.html
 * Parses the embedded JSON array used by the Export Excel button.
 */
async function fetchSmallCardamomArchive(): Promise<DataGovInRecord[]> {
  console.log('🔍 Fetching small cardamom archive from indianspices.com...');
  const response = await axios.get<string>(INDIANSPICES_SMALL_ARCHIVE_URL, {
    timeout: 30000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CardamomPriceFetcher/1.0)' },
    responseType: 'text',
  });
  const html: string = response.data;

  // Extract the JSON array embedded for the Export Excel button
  const jsonMatch = html.match(/var\s+auction_array1\s*=\s*(\[[\s\S]*?\]);/);
  if (!jsonMatch) {
    console.warn('⚠️ Could not find small cardamom JSON array on archive page');
    return [];
  }

  let rows: any[];
  try {
    rows = JSON.parse(jsonMatch[1]);
  } catch {
    console.warn('⚠️ Failed to parse small cardamom JSON array');
    return [];
  }

  return rows.map((row) => ({
    state: undefined,
    district: undefined,
    market: row.auctioneer,
    commodity: 'Small Cardamom',
    variety: 'Small',
    arrival_date: row.auction_date, // already "YYYY-MM-DD"
    min_price: row.minprice || '',
    max_price: row.maxprice || '',
    modal_price: row.avgprice,
  }));
}

/**
 * Fetches large cardamom archive prices from indianspices.com/daily-price-large.html
 * Parses the HTML table rows.
 */
async function fetchLargeCardamomArchive(): Promise<DataGovInRecord[]> {
  console.log('🔍 Fetching large cardamom archive from indianspices.com...');
  const response = await axios.get<string>(INDIANSPICES_LARGE_ARCHIVE_URL, {
    timeout: 30000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CardamomPriceFetcher/1.0)' },
    responseType: 'text',
  });
  const html: string = response.data;

  const records: DataGovInRecord[] = [];
  // Match each data row: <td>Sno</td><td>Date</td><td>Market</td><td>Type</td><td>Price</td>
  const rowRegex = /<tr>\s*<td[^>]*>\d+<\/td>\s*<td[^>]*>([\d\-A-Za-z]+)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>([\d.]+)<\/td>\s*<\/tr>/gi;
  let m: RegExpExecArray | null;
  while ((m = rowRegex.exec(html)) !== null) {
    const [, dateRaw, market, type, price] = m;
    const arrival_date = parseDateStr(dateRaw.trim());
    records.push({
      state: undefined,
      district: undefined,
      market: market.trim(),
      commodity: 'Large Cardamom',
      variety: type.trim() || 'Unknown',
      arrival_date,
      min_price: '',
      max_price: price.trim(),
      modal_price: price.trim(),
    });
  }

  console.log(`✅ Scraped ${records.length} large cardamom records from archive page`);
  return records;
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

  console.log(`✅ Scraped ${records.length} cardamom price records from marquee`);

  // Also fetch from archive pages for multi-day history
  const [smallArchive, largeArchive] = await Promise.allSettled([
    fetchSmallCardamomArchive(),
    fetchLargeCardamomArchive(),
  ]);

  if (smallArchive.status === 'fulfilled') {
    records.push(...smallArchive.value);
  } else {
    console.warn('⚠️ Small cardamom archive fetch failed:', smallArchive.reason);
  }

  if (largeArchive.status === 'fulfilled') {
    records.push(...largeArchive.value);
  } else {
    console.warn('⚠️ Large cardamom archive fetch failed:', largeArchive.reason);
  }

  console.log(`✅ Total ${records.length} cardamom price records (marquee + archives)`);
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
