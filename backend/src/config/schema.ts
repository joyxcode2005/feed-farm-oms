import { DiscountType, PaymentMethod } from "@prisma/client";
import z, { number, string } from "zod";

export const adminLoginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const feedProductSchema = z.object({
  animalType: z.enum(["PIG", "CATTLE"]),
  feedType: z.enum(["STARTER", "GROWER", "FINISHER", "GESTATION", "LACTATING"]),
  name: z.string().min(1),
  unit: z.string().min(1),
  unitSize: z.number().int().positive(),
  pricePerUnit: z.number().positive(),
});

export const checkCustomerDataSchema = z.object({
  name: z.string(),
  phone: z.string().max(10),
  address: z.string(),
});

const orderItemSchema = z.object({
  feedProductId: z.string(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

export const placeOrderSchema = z.object({
  paymentMethod: z.enum(["CASH", "CREDIT", "ONLINE"]),
  discountType: z.enum(["FLAT", "PERCENTAGE"]).optional(),
  discountValue: z.number().optional(),
  deliveryDate: z.string().nullable().optional(),
  items: z
    .array(orderItemSchema)
    .min(1, "Order must include at least one item"),
});
