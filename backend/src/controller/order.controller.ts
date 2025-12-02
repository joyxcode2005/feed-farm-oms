import { string } from "zod";
import { prisma } from "../config/prisma.js";

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
