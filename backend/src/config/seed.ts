import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";

async function main() {
  console.log("🌱 Seeding database...");

  const email = "joysengupta252005@gmail.com";
  const password = "joy@123";
  const name = "Joy Sengupta";
  const phone = "8777699459";

  const hashed = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hashed,
      name,
      role: "admin",
      phone,
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
