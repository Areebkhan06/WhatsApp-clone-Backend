import jwt from "jsonwebtoken";
import User from "../Model/user.js";

export const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.authToken;
    if (!token) return res.json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("friends", "name email profilePic"); 
      // 👆 populate only selected fields

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user });

  } catch (error) {
    console.log(error);
    res.json({ message: "Invalid or expired token" });
  }
};

