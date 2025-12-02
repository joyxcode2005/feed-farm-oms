import { Router, type Request, type Response } from "express";
import { checkCustomerDataSchema, placeOrderSchema } from "../config/schema.js";
import {
  checkExistingCustomer,
  createFeedStockTxn,
  createNewCustomer,
  fetchAllfeedProducts,
  findExistingFeedStock,
  placeOrder,
  updateFinishedStock,
} from "../controller/order.controller.js";
import jwt from "jsonwebtoken";
import { orderMiddleware } from "../middlewares/order.middleware.js";

const router = Router();

const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || "";

router.post("/check-customer-data", async (req: Request, res: Response) => {
  // Correctly check the data using zod
  const { success, error, data } = checkCustomerDataSchema.safeParse(req.body);

  if (!success)
    return res.status(401).json({
      success: false,
      message: "Invalid Input!!",
      error: error.flatten(),
    });

  try {
    // Destructure the data from body
    const { name, phone, address } = data;

    const existingCustomer = await checkExistingCustomer({
      name,
      phone,
      address,
    });

    if (existingCustomer) {
      const customerToken = jwt.sign(
        { id: existingCustomer.id },
        CUSTOMER_JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.cookie("customer_token", customerToken, {
        httpOnly: true,
        secure: true, // true in production (HTTPS)
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      return res.status(200).json({
        success: true,
        message: "Customer data found!!!",
      });
    }

    const newCustomer = await createNewCustomer({ name, phone, address });

    if (!newCustomer)
      return res.status(400).json({
        success: false,
        message: "Somthing went wrong while adding customer details!!",
      });

    const customer_token = jwt.sign(
      { id: newCustomer.id },
      CUSTOMER_JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.cookie("customer_token", customer_token, {
      httpOnly: true,
      secure: true, // true in production (HTTPS)
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      success: true,
      message: "Customer data added succesfully!!!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

router.use(orderMiddleware);

// Admin can create an order
router.post("/place-order", async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).customerId.id;
    const adminUserId = (req as any).admin.id;

    const { success, error, data } = placeOrderSchema.safeParse(req.body);

    if (!success)
      return res.status(401).json({
        success: false,
        message: "Invalid Input!!",
        error: error.flatten(),
      });

    try {
      // Destructure schema-validated data
      const {
        paymentMethod,
        discountType,
        discountValue,
        deliveryDate,
        items,
      } = data;

      // Fetch product pricing
      const feedProductIds = items.map((i) => i.feedProductId);
      const feedProducts = await fetchAllfeedProducts(feedProductIds);

      if (feedProducts.length !== items.length) {
        return res.status(400).json({
          success: false,
          message: "One or more feedProductId are invalid",
        });
      }

      // Prepare price lookup
      const priceMap = new Map(feedProducts.map((p) => [p.id, p.pricePerUnit]));

      let totalAmount = 0;

      // Build `orderItemsData`
      const orderItemsData = items.map((item) => {
        const price = priceMap.get(item.feedProductId);

        if (!price) {
          throw new Error(`Invalid feedProductId: ${item.feedProductId}`);
        }

        if (item.quantity <= 0) {
          throw new Error(`Invalid quantity for product ${item.feedProductId}`);
        }

        const subtotal = price * item.quantity;
        totalAmount += subtotal;

        return {
          feedProductId: item.feedProductId,
          quantity: item.quantity,
          pricePerUnit: price,
          subtotal,
        };
      });

      // Compute finalAmount after discount
      let finalAmount = totalAmount;

      if (discountType && discountValue) {
        if (discountType === "FLAT") {
          finalAmount -= discountValue;
        } else if (discountType === "PERCENTAGE") {
          finalAmount -= totalAmount * (discountValue / 100);
        }
      }

      if (finalAmount < 0) finalAmount = 0;

      // ---- CREATE ORDER ----
      const order = await placeOrder(
        customerId,
        adminUserId,
        paymentMethod,
        discountType ?? null,
        discountValue || 0,
        totalAmount,
        finalAmount,
        deliveryDate ?? null,
        orderItemsData
      );


      // ---- DEDUCT STOCK + CREATE STOCK TXN ----
      for (const item of order.items) {
        const stock = await findExistingFeedStock(item.feedProductId);

        console.log("Stock: ", stock);

        if (!stock || stock.quantityAvailable < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for product ${item.feedProductId}`,
          });
        }

        // Create SALE_OUT transaction
        await createFeedStockTxn(
          item.feedProductId,
          "SALE_OUT",
          item.quantity,
          order.id
        );

        // Deduct stock (your helper should handle decrement)
        await updateFinishedStock(item.feedProductId, item.quantity);
      }

      return res.status(200).json({
        success: true,
        message: "Order placed successfully!",
        data: order,
      });
    } catch (error: any) {
      console.error("Order Error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal Server Error!!",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Outer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
    });
  }
});

export default router;
