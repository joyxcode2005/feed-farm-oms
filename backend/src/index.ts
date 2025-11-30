import dotenv from "dotenv";
dotenv.config();

import express, { type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./router/auth.router.js";

const PORT = process.env.PORT || 8080;
const app = express();

app.get("/health", (req: Request, res: Response) => {
  res.json({
    message: "Server is healthy!!!",
  });
});

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

//Routers
app.use("/api/v1/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
