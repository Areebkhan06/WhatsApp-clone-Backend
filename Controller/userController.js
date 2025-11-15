import User from "../Model/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Message from "../Model/message.js";
import mongoose from "mongoose";
import Otp from "../Model/otp.js";
import transport from "../Config/emailConfig.js";

export const loginEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.json({ success: false, message: "Email required" });

    // 1️⃣ Check if user already exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "User does not exist. Please sign up.",
      });
    }

    // 2️⃣ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3️⃣ Hash OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    // 4️⃣ Save OTP in DB (delete previous OTP first)
    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // 5️⃣ Send OTP Email
    await transport.sendMail({
      from: `"Your App" <${process.env.EMAIL}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    });

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      success: false,
      message: "Something went wrong while sending OTP",
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.json({ success: false, message: "Email & OTP required" });

    // Find OTP record
    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord)
      return res.json({ success: false, message: "OTP not found or expired" });

    // Check expiry
    if (otpRecord.expiresAt < Date.now()) {
      await Otp.deleteMany({ email });
      return res.json({ success: false, message: "OTP expired" });
    }

    // Compare OTP
    const isMatch = await bcrypt.compare(String(otp), otpRecord.otp);
    if (!isMatch) return res.json({ success: false, message: "Invalid OTP" });

    // Remove OTP
    await Otp.deleteMany({ email });

    // Find user
    const user = await User.findOne({ email }).populate("friends");
    if (!user) return res.json({ success: false, message: "User not found" });

    // Generate Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Save Cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "OTP verified successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to verify OTP" });
  }
};

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
      httpOnly: true,
      secure: true, // ✅ must be true on Vercel (HTTPS)
      sameSite: "none", // ✅ allow cross-site cookie
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

export const addFriend = async (req, res) => {
  try {
    const userId = req.userId; // logged-in user
    const friendId = "6917848135df8cb633d48b64";
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ error: "Invalid friend ID" });
    }

    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { friends: friendId } }, // add friend to array
      { new: true }
    );

    res.json({ success: true, message: "Friend added successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to add friend" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const userId = req.userId; // from middleware
    const { receiverId, message } = req.body;
    console.log(req.body);

    if (!receiverId || !message) {
      return res
        .status(400)
        .json({ error: "receiverId and message are required" });
    }

    const newMsg = await Message.create({
      sender: userId,
      receiver: receiverId,
      message,
    });

    res.json({
      success: true,
      message: "Message sent",
      data: newMsg,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Message sending failed" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { receiverId } = req.body;

    const message = await Message.find({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    const formattedMessages = message.map((msg) => ({
      _id: msg._id,
      message: msg.message,
      sender: msg.sender,
      receiver: msg.receiver,
      createdAt: msg.createdAt,
      isSender: msg.sender.toString() === userId.toString(),
    }));

    res.json({ success: true, messages: formattedMessages });
  } catch (error) {
    console.log(error);
    res.json({ error: "Message fetching failed" });
  }
};
