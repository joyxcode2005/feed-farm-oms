import { prisma } from "../config/prisma.js";
import type { z } from "zod";
import { feedProductSchema } from "../config/schema.js";

export enum AnimalType {
  PIG = "PIG",
  CATTLE = "CATTLE",
}

export enum FeedType {
  STARTER = "STARTER",
  GROWER = "GROWER",
  FINISHER = "FINISHER",
  GESTATION = "GESTATION",
  LACTATING = "LACTATING",
}

export type CreateFeedProductSchema = Omit<
  z.infer<typeof feedProductSchema>,
  "initalStock"
>;
export type ExistingFeedProductSchema = Pick<
  CreateFeedProductSchema,
  "name" | "animalType" | "feedType"
>;

export const createFeedProduct = async ({
  animalType,
  feedType,
  name,
  unit,
  unitSize,
  pricePerUnit,
}: CreateFeedProductSchema) => {
  return await prisma.feedProduct.create({
    data: {
      animalType,
      feedType,
      name,
      unit,
      unitSize,
      pricePerUnit,
    },
  });
};

export const existingFeedProduct = async ({
  name,
  animalType,
  feedType,
}: ExistingFeedProductSchema) => {
  return await prisma.feedProduct.findFirst({
    where: {
      name,
      animalType,
      feedType,
    },
  });
};

export async function createInitialFinishedStock(
  feedProductId: string,
  quantityAvailable: number
) {
  return await prisma.finishedFeedStock.create({
    data: {
      feedProductId,
      quantityAvailable,
    },
  });
}

export async function createInitialFinishedStockwithInitailStock(
  feedProductId: string,
  initialStock: number
) {
  return await prisma.finishedFeedStockTransaction.create({
    data: {
      feedProductId: feedProductId,
      type: "PRODUCTION_IN",
      quantity: initialStock,
      productionBatchId: null,
    },
  });
}

export const updateFeedUnitSize = async (id: string, unitSize: number) => {
  try {
    const updated = await prisma.feedProduct.update({
      where: { id },
      data: { unitSize },
    });
    return updated;
  } catch (err) {
    return null; // order not found OR prisma error
  }
};

export const getAllFeedProduct = async () => {
  return await prisma.feedProduct.findMany({
    select: {
      id: true,
      animalType: true,
      feedType: true,
      name: true,
      unit: true,
      unitSize: true,
      pricePerUnit: true,
    },
  });
};
