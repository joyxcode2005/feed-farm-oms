import dotenv from "dotenv";
dotenv.config();

import express, { type Request, type Response } from "express";

const PORT = process.env.PORT || 8080;
const app = express();

app.get("/health", (req: Request, res: Response) => {
  res.json({
    message: "Server is healthy!!!",
  });
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
