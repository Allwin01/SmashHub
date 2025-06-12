import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);
const dbName = "badmintonClub";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { username, password } = req.body;

  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection("users");

    const user = await users.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid username or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid username or password" });

    return res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
