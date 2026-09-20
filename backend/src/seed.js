import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { getEnv } from './config/env.js';
import User from './models/User.js';

const requiredSeedVariables = [
  'SEED_PATIENT_NAME',
  'SEED_PATIENT_EMAIL',
  'SEED_PATIENT_PASSWORD',
  'SEED_INSURER_NAME',
  'SEED_INSURER_EMAIL',
  'SEED_INSURER_PASSWORD',
];

const getSeedUsers = () => {
  const missingVariables = requiredSeedVariables.filter((variableName) => !process.env[variableName]);

  if (missingVariables.length > 0) {
    throw new Error(`Missing seed environment variables: ${missingVariables.join(', ')}`);
  }

  return [
    {
      name: process.env.SEED_PATIENT_NAME,
      email: process.env.SEED_PATIENT_EMAIL,
      password: process.env.SEED_PATIENT_PASSWORD,
      role: 'patient',
    },
    {
      name: process.env.SEED_INSURER_NAME,
      email: process.env.SEED_INSURER_EMAIL,
      password: process.env.SEED_INSURER_PASSWORD,
      role: 'insurer',
    },
  ];
};

const seed = async () => {
  getEnv();
  await connectDatabase(process.env.MONGODB_URI);

  for (const seedUser of getSeedUsers()) {
    const existingUser = await User.findOne({ email: seedUser.email.toLowerCase() }).select('+password');

    if (existingUser) {
      existingUser.name = seedUser.name;
      existingUser.password = seedUser.password;
      existingUser.role = seedUser.role;
      await existingUser.save();
    } else {
      await User.create(seedUser);
    }
  }

  console.log('Seeded patient and insurer users');
};

seed()
  .catch((error) => {
    console.error(`Unable to seed users: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await disconnectDatabase();
    }
  });
