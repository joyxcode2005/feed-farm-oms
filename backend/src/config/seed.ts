import bcrypt from "bcryptjs";
import  { prisma } from "./prisma.js";


async function main() {
  console.log("🌱 Seeding database...");

  const email = "admin@example.com";
  const password = "admin123";
  const name = "Default Admin";

  const hashed = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hashed,
      name,
      role: "admin",
    },
  });

  console.log("✅ Admin seeded:");
  console.log(admin);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:");
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });