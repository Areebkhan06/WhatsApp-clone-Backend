import express from "express";
import { addFriend, createAccount, getMessages, loginEmail, sendMessage, verifyOtp } from "../Controller/userController.js";
import { getCurrentUser } from "../Middleware/getCurrentUser.js";
import { authUser } from "../Middleware/authUser.js";

const userRouter = express.Router();

userRouter.get("/me", getCurrentUser);
userRouter.post("/login", loginEmail);
userRouter.post("/verify-otp", verifyOtp);
userRouter.post("/signup", createAccount);
userRouter.post("/message", authUser, sendMessage);
userRouter.post("/add-friend", authUser, addFriend);
userRouter.post("/get-messages", authUser, getMessages);

export default userRouter;
