import z from "zod";

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


