import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/db"; // adjust path if not using src

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { firstName, surname, sex, email, address, username, password } = req.body;

  if (!firstName || !surname || !sex || !email || !address || !username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("badmintonClub");
    const users = db.collection("users");

    const existing = await users.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    await users.insertOne({ firstName, surname, sex, email, address, username, password });

    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
