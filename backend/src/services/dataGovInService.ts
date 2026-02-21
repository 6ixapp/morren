/**
 * Data.gov.in API Service
 * Fetches cardamom market prices from India's Open Government Data platform
 */

import axios from 'axios';
import { DataGovInRecord, DataGovInResponse } from '../types';

const DATA_GOV_IN_BASE_URL = 'https://api.data.gov.in/resource';

/**
 * Fetches cardamom prices from data.gov.in API
 * @returns Array of cardamom price records
 * @throws Error if API key/resource ID not configured or API call fails
 */
export async function fetchCardamomPrices(): Promise<DataGovInRecord[]> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  const resourceId = process.env.DATA_GOV_IN_RESOURCE_ID;

  if (!apiKey || !resourceId) {
    throw new Error(
      'DATA_GOV_IN_API_KEY and DATA_GOV_IN_RESOURCE_ID must be set in environment variables'
    );
  }

  try {
    console.log('🔍 Fetching cardamom prices from data.gov.in...');

    const response = await axios.get<DataGovInResponse>(
      `${DATA_GOV_IN_BASE_URL}/${resourceId}`,
      {
        params: {
          'api-key': apiKey,
          format: 'json',
          // Filter for cardamom commodity
          // Note: Exact filter syntax may vary based on data.gov.in API implementation
          // If filtering doesn't work, we'll filter in code after fetching
          limit: 1000, // Fetch up to 1000 records
        },
        timeout: 30000, // 30 second timeout
      }
    );

    // Extract records from response
    const records = response.data.records || [];

    // Filter for cardamom if API-level filtering didn't work
    const cardamomRecords = records.filter(
      (record) =>
        record.commodity &&
        record.commodity.toLowerCase().includes('cardamom')
    );

    console.log(`✅ Fetched ${cardamomRecords.length} cardamom price records`);

    return cardamomRecords;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // API responded with error status
        console.error(
          `❌ Data.gov.in API error: ${error.response.status} - ${error.response.statusText}`
        );
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        // Request made but no response received
        console.error('❌ No response from data.gov.in API');
      } else {
        // Error in request setup
        console.error('❌ Error setting up data.gov.in request:', error.message);
      }
    } else {
      console.error('❌ Unexpected error fetching cardamom prices:', error);
    }

    throw error;
  }
}

/**
 * Fetches cardamom prices with retry logic
 * @param maxRetries Maximum number of retry attempts
 * @returns Array of cardamom price records
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
      console.log(`⚠️ Attempt ${attempt}/${maxRetries} failed`);

      if (attempt < maxRetries) {
        // Exponential backoff: wait 2^attempt seconds
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying in ${waitTime / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Failed to fetch cardamom prices after retries');
}
