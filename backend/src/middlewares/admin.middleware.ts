import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";

console.log("JWT SECRET: ", JWT_SECRET);

export const userMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.token;

  console.log("Token: ", token);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: no token found",
      token,
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string);

    (req as any).admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: invalid or expired token",
    });
  }
};
