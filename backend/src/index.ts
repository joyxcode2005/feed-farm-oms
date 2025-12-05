import dotenv from "dotenv";
dotenv.config();

import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import adminRouter from "./router/admin.router.js";

const PORT = process.env.PORT || 8080;
const app = express();

app.get("/health", (req: Request, res: Response) => {
  res.json({
    message: "Server is healthy!!!",
  });
});

// CORS configuration - IMPORTANT!
app.use(cors({
  origin: "http://localhost:3000", // Allow frontend origin
  credentials: true, // Allow cookies
}));

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Routers
app.use("/api/v1/admin", adminRouter);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
