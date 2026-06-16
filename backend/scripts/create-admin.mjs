import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const username = process.env.INIT_ADMIN_USERNAME || 'admin';
const password = process.env.INIT_ADMIN_PASSWORD || 'admin123';
const fullName = process.env.INIT_ADMIN_NAME || 'Administrador Principal';

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ username });
  if (existing) {
    existing.fullName = fullName;
    existing.role = 'admin';
    existing.isPrincipal = true;
    existing.isActive = true;
    existing.password = password;
    await existing.save();
    console.log(`Admin user updated: ${username}`);
  } else {
    await User.create({
      username,
      password,
      fullName,
      role: 'admin',
      isPrincipal: true,
      isActive: true
    });
    console.log(`Admin user created: ${username}`);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
