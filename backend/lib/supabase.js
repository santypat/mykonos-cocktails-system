import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined
});

export async function withTransaction(work) {
  const client = await pool.connect();

  try {
    await client.query('begin');
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

const TABLES = new Set([
  'app_users',
  'inventory',
  'products',
  'sales',
  'movements',
  'shifts'
]);

function assertTable(table) {
  if (!TABLES.has(table)) {
    throw new Error(`Invalid table: ${table}`);
  }
}

function jsonColumnsFor(table) {
  if (table === 'products') return new Set(['preparation']);
  if (table === 'sales') return new Set(['items']);
  return new Set();
}

function normalizeValue(table, column, value) {
  if (jsonColumnsFor(table).has(column)) {
    return JSON.stringify(value ?? []);
  }
  return value;
}

class QueryBuilder {
  constructor(table) {
    assertTable(table);
    this.table = table;
    this.action = 'select';
    this.payload = null;
    this.conditions = [];
    this.orderBy = null;
    this.returning = false;
  }

  select() {
    this.returning = true;
    return this;
  }

  insert(payload) {
    this.action = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload) {
    this.action = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column, value) {
    this.conditions.push({ column, op: '=', value });
    return this;
  }

  gte(column, value) {
    this.conditions.push({ column, op: '>=', value });
    return this;
  }

  lte(column, value) {
    this.conditions.push({ column, op: '<=', value });
    return this;
  }

  in(column, values) {
    this.conditions.push({ column, op: 'in', value: values });
    return this;
  }

  order(column, options = {}) {
    this.orderBy = { column, ascending: options.ascending !== false };
    return this;
  }

  async single() {
    const result = await this.execute();
    if (result.error) return result;
    if (!result.data?.length) return { data: null, error: { message: 'Row not found' } };
    return { data: result.data[0], error: null };
  }

  async maybeSingle() {
    const result = await this.execute();
    if (result.error) return result;
    return { data: result.data?.[0] || null, error: null };
  }

  async throwOnError() {
    const result = await this.execute();
    if (result.error) throw result.error;
    return result;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  buildWhere(params) {
    if (!this.conditions.length) return '';

    const parts = this.conditions.map((condition) => {
      if (condition.op === 'in') {
        const placeholders = condition.value.map((value) => {
          params.push(value);
          return `$${params.length}`;
        });
        return `${condition.column} in (${placeholders.join(', ')})`;
      }

      params.push(condition.value);
      return `${condition.column} ${condition.op} $${params.length}`;
    });

    return ` where ${parts.join(' and ')}`;
  }

  async execute() {
    try {
      const params = [];
      let sql = '';

      if (this.action === 'select') {
        sql = `select * from ${this.table}${this.buildWhere(params)}`;
        if (this.orderBy) {
          sql += ` order by ${this.orderBy.column} ${this.orderBy.ascending ? 'asc' : 'desc'}`;
        }
      }

      if (this.action === 'insert') {
        const payload = Array.isArray(this.payload) ? this.payload : [this.payload];
        const columns = Object.keys(payload[0] || {});
        const valuesSql = payload.map((row) => {
          const placeholders = columns.map((column) => {
            params.push(normalizeValue(this.table, column, row[column]));
            return `$${params.length}`;
          });
          return `(${placeholders.join(', ')})`;
        });

        sql = `insert into ${this.table} (${columns.join(', ')}) values ${valuesSql.join(', ')}`;
        if (this.returning) sql += ' returning *';
      }

      if (this.action === 'update') {
        const columns = Object.keys(this.payload || {});
        const setSql = columns.map((column) => {
          params.push(normalizeValue(this.table, column, this.payload[column]));
          return `${column} = $${params.length}`;
        });

        sql = `update ${this.table} set ${setSql.join(', ')}${this.buildWhere(params)}`;
        if (this.returning) sql += ' returning *';
      }

      if (this.action === 'delete') {
        sql = `delete from ${this.table}${this.buildWhere(params)}`;
        if (this.returning) sql += ' returning *';
      }

      const result = await pool.query(sql, params);
      return { data: result.rows, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

export const supabase = {
  from(table) {
    return new QueryBuilder(table);
  }
};

export const mapUser = (row) => row && ({
  _id: row.id,
  id: row.id,
  username: row.username,
  fullName: row.full_name,
  role: row.role,
  isActive: row.is_active,
  isPrincipal: row.is_principal,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapInventory = (row) => row && ({
  _id: row.id,
  id: row.id,
  name: row.name,
  quantity: Number(row.quantity),
  unit: row.unit,
  minStock: Number(row.min_stock),
  lastUpdate: row.last_update,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapProduct = (row, preparation = row?.preparation || []) => row && ({
  _id: row.id,
  id: row.id,
  name: row.name,
  price: Number(row.price),
  image: row.image || '',
  isActive: row.is_active,
  preparation,
  category: row.category,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapSale = (row) => row && ({
  _id: row.id,
  id: row.id,
  items: row.items || [],
  total: Number(row.total),
  paymentMethod: row.payment_method,
  cashReceived: Number(row.cash_received || 0),
  changeAmount: Number(row.change_amount || 0),
  seller: row.seller_id,
  sellerName: row.seller_name,
  invoiceNumber: row.invoice_number,
  date: row.date,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapMovement = (row) => row && ({
  _id: row.id,
  id: row.id,
  type: row.type,
  amount: Number(row.amount),
  paymentMethod: row.payment_method,
  cashReceived: Number(row.cash_received || 0),
  changeAmount: Number(row.change_amount || 0),
  description: row.description,
  category: row.category,
  user: row.user_id,
  userName: row.user_name,
  date: row.date,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const mapShift = (row) => row && ({
  _id: row.id,
  id: row.id,
  user: row.user_id,
  userName: row.user_name,
  startTime: row.start_time,
  endTime: row.end_time,
  isActive: row.is_active,
  totalSales: Number(row.total_sales),
  salesCount: Number(row.sales_count),
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export function requireRow(result) {
  if (result.error) throw result.error;
  return result.data;
}
