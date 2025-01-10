import mongoose from 'mongoose';
import { initializeAdmin } from '../models/admin.modal.js';
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.MONGO_DB_NAME
        });
        await initializeAdmin();
        console.log('******************************');
        console.log('* MongoDB connected successfully! *');
        console.log('******************************');

    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }

};

export default connectDB;
