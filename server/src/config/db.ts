import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const connIns = await mongoose.connect(process.env.MONGO_URI!);
        console.log(`MongoDB Connected: ${connIns.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
    }
}