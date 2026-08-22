// Convert snake_case to camelCase
export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Convert camelCase to snake_case
export const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

// Convert object keys from snake_case to camelCase
export const keysToCamel = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(keysToCamel);
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = toCamelCase(key);
      result[camelKey] = keysToCamel(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

// Convert object keys from camelCase to snake_case
export const keysToSnake = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(keysToSnake);
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = toSnakeCase(key);
      result[snakeKey] = keysToSnake(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

// Build WHERE clause from filters
export const buildWhereClause = (filters: Record<string, any>): { clause: string; values: any[] } => {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const snakeKey = toSnakeCase(key);
      conditions.push(`${snakeKey} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
};

// Build UPDATE SET clause
export const buildUpdateClause = (updates: Record<string, any>): { clause: string; values: any[] } => {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      const snakeKey = toSnakeCase(key);
      setClauses.push(`${snakeKey} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  return {
    clause: `SET ${setClauses.join(', ')}`,
    values,
  };
};

// Keep list endpoints bounded even when callers do not provide pagination.
export const parsePagination = (
  query: Record<string, unknown>,
  defaultLimit = 100,
  maxLimit = 100
): { limit: number; offset: number } => {
  const requestedLimit = Number(query.limit);
  const requestedOffset = Number(query.offset);

  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), maxLimit)
    : defaultLimit;
  const offset = Number.isFinite(requestedOffset)
    ? Math.max(Math.floor(requestedOffset), 0)
    : 0;

  return { limit, offset };
};
