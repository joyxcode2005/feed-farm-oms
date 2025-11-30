import { prisma } from "../config/prisma.js";

export const checkExistingAdmin = async (email: string) => {
  return await prisma.adminUser.findFirst({
    where: { email },
  });
};

export const getUserData = async (email: string) => {
  return await prisma.adminUser.findFirst({
    where: { email },
  });
};
