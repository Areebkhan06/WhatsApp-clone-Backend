import jwt from "jsonwebtoken";

export const authUser = (req, res, next) => {
  try {
    const token = req.cookies.authToken;

    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id; // Save ID for next handlers
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
