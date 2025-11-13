import User from "../Model/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const createAccount = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // 1️⃣ Validate required fields
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2️⃣ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    // Generating Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Save Cookie
    res.cookie("authToken", token, {
      httpOnly: true, // prevents JS access (secure)
      secure: process.env.NODE_ENV === "production", // use true only in HTTPS
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
        about: user.about,
        lastSeen: user.lastSeen,
        friends: user.friends,
      },
    });
  } catch (error) {
    console.error("Error creating account:", error);
    res.json({ success: false, message: "Internal server error" });
  }
};
