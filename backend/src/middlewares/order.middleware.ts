import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || "";

export const orderMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.customer_token;

  if (!token)
    return res.status(404).json({
      success: false,
      message: "Invalid or expired token!!",
    });

  try {
    const decoded = jwt.verify(token, CUSTOMER_JWT_SECRET as string);
    
    (req as any).customerId = decoded;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!! Try again!!",
    });
  }
};
