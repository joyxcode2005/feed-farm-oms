import { Router, type Request, type Response } from "express";


const router = Router();

// Admin can create an order
router.post("/place-order", (req:Request, res: Response) => {
  
})

export default router;