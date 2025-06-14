import { MongoClient } from "mongodb";

const mongoUrl = 'mongodb+srv://kalmantamaskrisztian:fDEeid6qSOMfXA6H@cluster0.slglkme.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

export const connectDB = async () => {
  const client = await MongoClient.connect(
    mongoUrl,
    );
  return client;
};