import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import userRouter from "./Router/userRouter.js";
import connectDB from "./Config/database.js";

dotenv.config();

const app = express();

// ✅ Middleware
app.use(
  cors({
    origin: [
      "https://whats-app-clone-coral-five.vercel.app",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser()); // ✅ parse cookies in incoming requests

// ✅ Connect Database
connectDB();

// ✅ Routes
app.use("/user", userRouter);

app.get("/", (req, res) => {
  res.send("🚀 Server is running successfully!");
});

// ✅ PORT setup
const PORT = process.env.PORT || 3015;

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on: http://localhost:${PORT}`);
});
