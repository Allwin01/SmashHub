


import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect().then((client) => {
    console.log("✅ MongoDB connected");
    return client;
  });
}


clientPromise = global._mongoClientPromise;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default clientPromise;
