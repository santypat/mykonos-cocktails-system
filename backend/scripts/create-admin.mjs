import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { supabase, requireRow } from '../lib/supabase.js';

dotenv.config();

const username = process.env.INIT_ADMIN_USERNAME || 'admin';
const password = process.env.INIT_ADMIN_PASSWORD || 'admin123';
const fullName = process.env.INIT_ADMIN_NAME || 'Administrador Principal';

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = requireRow(await supabase
    .from('app_users')
    .select('*')
    .eq('username', username)
    .maybeSingle());

  if (existing) {
    await supabase
      .from('app_users')
      .update({
        password_hash: passwordHash,
        full_name: fullName,
        role: 'admin',
        is_principal: true,
        is_active: true
      })
      .eq('id', existing.id)
      .throwOnError();
    console.log(`Admin user updated: ${username}`);
  } else {
    await supabase
      .from('app_users')
      .insert({
        username,
        password_hash: passwordHash,
        full_name: fullName,
        role: 'admin',
        is_principal: true,
        is_active: true
      })
      .throwOnError();
    console.log(`Admin user created: ${username}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
