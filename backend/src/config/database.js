import mongoose from 'mongoose';

export const connectDatabase = async (mongodbUri) => {
  await mongoose.connect(mongodbUri);
  console.log('Connected to MongoDB');
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
};
