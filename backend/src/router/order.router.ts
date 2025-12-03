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
    console.log(error)
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

    if (!success) {
      return res.status(401).json({
        success: false,
        message: "Invalid Input!!",
        error: error.flatten(),
      });
    }

    try {
      const {
        paymentMethod,
        discountType,
        discountValue,
        deliveryDate,
        items,
      } = data;

      // 🔁 reuse calculation
      const summary = await calculateOrderPreview({
        items: items.map((i) => ({
          feedProductId: i.feedProductId,
          quantity: i.quantity,
        })),
        discountType: discountType ?? null,
        discountValue: discountValue ?? 0,
      });

      const cleanedOrderItems = summary.items.map(i => ({
  feedProductId: i.feedProductId,
  quantity: i.quantity,
  pricePerUnit: i.pricePerUnit,
  subtotal: i.subtotal,
}));

const totalAmount = summary.totalAmount;
const finalAmount = summary.finalAmount;


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
  cleanedOrderItems
);


      // ---- STOCK HANDLING ----
      for (const item of order.items) {
        const stock = await findExistingFeedStock(item.feedProductId);

        if (!stock || stock.quantityAvailable < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for product ${item.feedProductId}`,
          });
        }


        await createFeedStockTxn(
          item.feedProductId,
          "SALE_OUT",
          item.quantity,
          order.id
        );

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



import { calculateOrderPreview } from "../controller/order.controller.js";


// You can use orderMiddleware here or not,
// depending on whether preview requires login / customer cookie.
router.post("/preview-order", async (req: Request, res: Response) => {
  // Validate body with same Zod schema
  const { success, error, data } = placeOrderSchema.safeParse(req.body);

  if (!success) {
    return res.status(400).json({
      success: false,
      message: "Invalid input!!",
      error: error.flatten(),
    });
  }

  try {
    const { items, discountType, discountValue } = data;

    // Use shared calculation helper
    const summary = await calculateOrderPreview({
      items: items.map((i) => ({
        feedProductId: i.feedProductId, // make sure your Zod schema uses `feedProductId`
        quantity: i.quantity,
      })),
      discountType: discountType ?? null,
      discountValue: discountValue ?? 0,
    });

    return res.status(200).json({
      success: true,
      message: "Order preview generated successfully",
      data: summary,
    });
  } catch (err: any) {
    console.error("Preview Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error!!",
      error: err.message,
    });
  }
});


export default router;
