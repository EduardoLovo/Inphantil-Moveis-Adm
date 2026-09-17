import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_DEV_EMAIL;
  const password = process.env.SEED_DEV_PASSWORD;
  const name = process.env.SEED_DEV_NAME || "Dev Inphantil";

  if (!email || !password) {
    throw new Error(
      "Defina SEED_DEV_EMAIL e SEED_DEV_PASSWORD no .env antes de rodar o seed.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const dev = await prisma.user.upsert({
    where: { email },
    // Re-rodar o seed sincroniza o DEV inicial com o .env (inclui a senha).
    update: { role: Role.DEV, isActive: true, name, passwordHash },
    create: { email, name, passwordHash, role: Role.DEV, isActive: true },
  });

  console.log(`✅ DEV pronto: ${dev.email} (${dev.role})`);
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
