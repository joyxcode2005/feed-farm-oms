import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { adminLoginSchema } from "../config/schema.js";
import { checkExistingAdmin } from "../controller/auth.controller.js";


const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "";

// Login router for admin
router.post("/login", async (req: Request, res: Response) => {
  // Parsing the data using zod
  const { success, error, data } = adminLoginSchema.safeParse(req.body);

  // Return if not correct data
  if (!success)
    return res.status(400).json({
      success: false,
      message: "Invalid Input!!",
      error: error.flatten(),
    });

  try {
    // Extract the email and password from the data..
    const { email, password } = data;

    // Check if the admin data is present..
    const existingAdmin = await checkExistingAdmin(email);

    if (!existingAdmin)
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });

    // Check if the password is correct or not!!!
    const isValid = await bcrypt.compare(password, existingAdmin.passwordHash);

    if (!isValid)
      return res.status(402).json({
        success: false,
        message: "Invalid credentials!!!",
      });

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1d" });

    if (!token)
      return res.status(500).json({
        success: false,
        message: "Error while generating token!!!",
      });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // true in production (HTTPS)
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      success: true,
      message: "Admin Login Successfull!!",
    });
    
  } catch (error) {
    console.log("Error: ", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

export default router;