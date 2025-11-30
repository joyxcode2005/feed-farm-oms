import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { adminLoginSchema, feedProductScheam } from "../config/schema.js";
import {
  checkExistingAdmin,
  getUserData,
} from "../controller/auth.controller.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import orderRouter from "./order.router.js";
import {
  createFeedProduct,
  existingFeedProduct,
} from "../controller/feed.controller.js";

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

router.use(adminMiddleware);

// Get admin info
router.get("/info", async (req: Request, res: Response) => {
  const admin = (req as any).admin;

  if (!admin)
    return res.status(500).json({
      success: false,
      message: "User data missing from request",
    });

  try {
    const userData = await getUserData(admin.email);

    if (!userData)
      return res.status(404).json({
        success: false,
        message: "Admin not found!!",
      });

    return res.status(200).json({
      success: true,
      message: "Admin info fetched successfully",
      data: {
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

// create feedProduct
router.post("/feed-product", async (req: Request, res: Response) => {
  const { success, error, data } = feedProductScheam.safeParse(req.body);

  if (!success)
    return res.status(400).json({
      success: false,
      message: "Invalid Input!!!",
      errors: error.flatten(),
    });

  try {
    const { animalType, feedType, name, unit, unitSize, pricePerUnit } = data;

    const existingProduct = await existingFeedProduct({
      name,
      animalType,
      feedType,
    });

    if (existingProduct)
      return res.status(409).json({
        success: false,
        message: "A feed product with these details already exists.",
      });

    const feedProduct = await createFeedProduct({
      animalType,
      feedType,
      name,
      unit,
      unitSize,
      pricePerUnit,
    });

    if (!feedProduct)
      return res.status(400).json({
        success: false,
        message: "Failed to create product!!",
      });

    return res.status(201).json({
      success: true,
      message: "Feed product created successfully.",
      data: feedProduct,
    });
  } catch (error) {
    console.error("Feed product creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}); 

// Order realted router
router.use("/order", orderRouter);

export default router;
