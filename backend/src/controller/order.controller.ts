import { string } from "zod";
import { prisma } from "../config/prisma.js";
import type { DiscountType, OrderStatus } from "@prisma/client";

export const checkExistingCustomer = async ({
  name,
  phone,
  address,
}: {
  name: string;
  phone: string;
  address: string;
}) => {
  return await prisma.customer.findFirst({
    where: {
      name,
      phone,
      address,
    },
  });
};

export const createNewCustomer = async ({
  name,
  phone,
  address,
}: {
  name: string;
  phone: string;
  address: string;
}) => {
  return await prisma.customer.create({
    data: {
      name,
      phone,
      address,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
    },
  });
};

export const fetchAllfeedProducts = async (feedProductIds: string[]) => {
  if (!Array.isArray(feedProductIds) || feedProductIds.length === 0) {
    return [];
  }

  return prisma.feedProduct.findMany({
    where: { id: { in: feedProductIds } },
    select: {
      id: true,
      pricePerUnit: true,
    },
  });
};

export const placeOrder = async (
  customerId: string,
  adminUserId: string,
  paymentMethod: "CASH" | "CREDIT" | "ONLINE",
  discountType: "FLAT" | "PERCENTAGE" | null,
  discountValue: number,
  totalAmount: number,
  finalAmount: number,
  deliveryDate: string | null,
  orderItemsData: {
    feedProductId: string;
    quantity: number;
    pricePerUnit: number;
    subtotal: number;
  }[]
) => {
  return prisma.order.create({
    data: {
      customerId,
      adminUserId,
      paymentMethod,
      discountType,
      discountValue,
      totalAmount,
      finalAmount,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      items: { create: orderItemsData },
    },
    include: { items: true },
  });
};

export const findExistingFeedStock = async (feedProductId: string) => {
  return await prisma.finishedFeedStock.findUnique({
    where: { feedProductId: feedProductId },
  });
};

export async function createFeedStockTxn(
  feedProductId: string,
  type: "PRODUCTION_IN" | "SALE_OUT" | "ADJUSTMENT",
  quantity: number,
  orderId?: string,
  productionBatchId?: string
) {
  return await prisma.finishedFeedStockTransaction.create({
    data: {
      feedProductId,
      type,
      quantity,
      orderId: orderId || null,
      productionBatchId: productionBatchId || null,
    },
  });
}

export async function updateFinishedStock(
  feedProductId: string,
  quantity: number,
  direction: "IN" | "OUT" = "OUT"
) {
  const stock = await prisma.finishedFeedStock.findUnique({
    where: { feedProductId },
  });

  const delta = direction === "OUT" ? -quantity : quantity;

  if (!stock) {
    // Create initial stock
    return prisma.finishedFeedStock.create({
      data: {
        feedProductId,
        quantityAvailable: Math.max(0, delta),
      },
    });
  }

  // Prevent negative stock
  const newQuantity = stock.quantityAvailable + delta;
  if (newQuantity < 0) {
    throw new Error("Stock cannot go negative");
  }

  return prisma.finishedFeedStock.update({
    where: { feedProductId },
    data: {
      quantityAvailable: newQuantity,
    },
  });
}

// order.controller.ts (or service file)



type PlaceOrderItemInput = {
  feedProductId: string;
  quantity: number;
};

type PlaceOrderCalcInput = {
  items: PlaceOrderItemInput[];
  discountType?: DiscountType | null;
  discountValue?: number;
};

export async function calculateOrderPreview({
  items,
  discountType,
  discountValue,
}: PlaceOrderCalcInput) {
  // 1. Fetch price data
  const feedProductIds = items.map((i) => i.feedProductId);

  const feedProducts = await prisma.feedProduct.findMany({
    where: { id: { in: feedProductIds } },
    select: {
      id: true,
      name: true,
      pricePerUnit: true,
    },
  });

  if (feedProducts.length !== items.length) {
    throw new Error("One or more feedProductId are invalid");
  }

  const priceMap = new Map(feedProducts.map((p) => [p.id, p.pricePerUnit]));
  const nameMap = new Map(feedProducts.map((p) => [p.id, p.name]));

  let totalAmount = 0;

  const detailedItems = items.map((item) => {
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
      name: nameMap.get(item.feedProductId) || "",
      quantity: item.quantity,
      pricePerUnit: price,
      subtotal,
    };
  });

  // discount
  let finalAmount = totalAmount;

  if (discountType && discountValue) {
    if (discountType === "FLAT") {
      finalAmount -= discountValue;
    } else if (discountType === "PERCENTAGE") {
      finalAmount -= totalAmount * (discountValue / 100);
    }
  }

  if (finalAmount < 0) finalAmount = 0;

  return {
    items: detailedItems,
    totalAmount,
    discountType: discountType ?? null,
    discountValue: discountValue ?? 0,
    finalAmount,
  };
}


//Update order STATUS
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  return prisma.order.update({
    where: { id: orderId },
    data: { orderStatus: status },
    include: { items: true },
  });
}
