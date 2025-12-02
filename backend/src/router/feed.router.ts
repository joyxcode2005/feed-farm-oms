import { Router, type Request, type Response } from "express";
import { feedProductSchema } from "../config/schema.js";
import {
  createFeedProduct,
  existingFeedProduct,
  getAllFeedProduct,
  updateFeedUnitSize,
} from "../controller/feed.controller.js";

const router = Router();

// create feedProduct
router.post("/create-feed", async (req: Request, res: Response) => {
  const { success, error, data } = feedProductSchema.safeParse(req.body);

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

// Update order unit size
router.patch("/update/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { unitSize } = req.body;

  // strict validation
  if (
    unitSize === undefined ||
    typeof unitSize !== "number" ||
    Number.isNaN(unitSize) ||
    unitSize <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "unitSize must be a positive number greater than zero.",
    });
  }

  if (!id) {
    return res.status(404).json({
      success: false,
      message: "Order not found.",
    });
  }

  try {
    const updated = await updateFeedUnitSize(id, unitSize);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order unit size updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Order update error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.get("/bulk", async (req: Request, res: Response) => {
  try {
    const feedProducts = await getAllFeedProduct();
    if (feedProducts.length <= 0)
      return res.status(200).json({
        success: true,
        message: "No Feed Product",
        feedProducts,
      });
    return res.status(200).json({
      success: true,
      message: "Feed Products Found",
      feedProducts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});



export default router;
