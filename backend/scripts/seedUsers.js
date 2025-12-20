import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../models/User.js";

dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");

  const sample = [
    {
      username: "ayesha",
      email: "ayesha@example.com",
      bio: "Frontend dev",
      avatarURL: "",
      password: "Password123",
    },
    {
      username: "ravi",
      email: "ravi@example.com",
      bio: "Backend dev",
      avatarURL: "",
      password: "Password123",
    },
  ];

  for (const s of sample) {
    const exists = await User.findOne({ email: s.email });
    if (exists) continue;

    // hash password
    const passwordHash = await bcrypt.hash(s.password, 10);

    const user = new User({
      username: s.username,
      email: s.email,
      passwordHash,
      bio: s.bio,
      avatarURL: s.avatarURL,
    });

    await user.save();
    console.log(`✅ Added ${s.username}`);
  }

  console.log("Done seeding users");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
