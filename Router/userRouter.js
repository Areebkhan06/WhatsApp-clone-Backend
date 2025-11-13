import express from "express"
import { createAccount } from "../Controller/userController.js";
import { getCurrentUser } from "../Middleware/authUser.js";

const userRouter = express.Router();


userRouter.post("/signup",createAccount);
userRouter.get("/me",getCurrentUser)

export default userRouter;