import { prisma } from "../config/prisma.js";
import type { z } from "zod";
import { feedProductInput } from "../config/schema.js";

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

export type CreateFeedProductSchema = z.infer<typeof feedProductInput>;
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
