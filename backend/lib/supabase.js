import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

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
