import { query } from '../db';
import { DataGovInRecord } from '../types';

export interface CardamomInsertSummary {
  fetched: number;
  inserted: number;
  skipped: number;
  invalid: number;
}

/** Insert a refresh in one database round trip instead of one query per row. */
export async function persistCardamomRecords(
  records: DataGovInRecord[],
  source = 'indianspices.com'
): Promise<CardamomInsertSummary> {
  const valid = records.flatMap((record) => {
    const modalPrice = Number.parseFloat(record.modal_price);
    if (!Number.isFinite(modalPrice) || !record.market || !record.arrival_date) return [];

    return [{
      state: record.state || null,
      district: record.district || null,
      market: record.market,
      variety: record.variety || 'Unknown',
      minPrice: record.min_price ? Number.parseFloat(record.min_price) : null,
      maxPrice: record.max_price ? Number.parseFloat(record.max_price) : null,
      modalPrice,
      arrivalDate: record.arrival_date,
    }];
  });

  if (valid.length === 0) {
    return { fetched: records.length, inserted: 0, skipped: 0, invalid: records.length };
  }

  const result = await query(
    `INSERT INTO cardamom_prices
       (state, district, market, variety, min_price, max_price, modal_price, arrival_date, source)
     SELECT *
     FROM UNNEST(
       $1::text[], $2::text[], $3::text[], $4::text[],
       $5::numeric[], $6::numeric[], $7::numeric[], $8::date[], $9::text[]
     ) AS rows(state, district, market, variety, min_price, max_price, modal_price, arrival_date, source)
     ON CONFLICT (market, variety, arrival_date) DO NOTHING
     RETURNING id`,
    [
      valid.map((row) => row.state),
      valid.map((row) => row.district),
      valid.map((row) => row.market),
      valid.map((row) => row.variety),
      valid.map((row) => row.minPrice),
      valid.map((row) => row.maxPrice),
      valid.map((row) => row.modalPrice),
      valid.map((row) => row.arrivalDate),
      valid.map(() => source),
    ]
  );

  return {
    fetched: records.length,
    inserted: result.rowCount || 0,
    skipped: valid.length - (result.rowCount || 0),
    invalid: records.length - valid.length,
  };
}

export async function deleteExpiredCardamomRecords(): Promise<number> {
  const result = await query(
    `DELETE FROM cardamom_prices
     WHERE arrival_date < CURRENT_DATE - INTERVAL '7 days'`
  );
  return result.rowCount || 0;
}
