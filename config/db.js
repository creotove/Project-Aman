import mongoose from "mongoose";

const connectDB = async () => {
  try {
    let mongoURL;
    if (process.env.NODE_ENV === "production") {
      mongoURL = process.env.MONGODB_URI;
      console.log('Connected to production');
    } else {
      mongoURL = "mongodb://localhost:27017/tryingNew";
      console.log('Connected to development');
    }
    const conn = await mongoose.connect(mongoURL);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};
export default connectDB;
