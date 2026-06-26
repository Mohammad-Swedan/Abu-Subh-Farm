import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedCategories } from "../src/config/categories";

const prisma = new PrismaClient();

// Helper: days ago as a Date
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

async function main() {
  // ── Wipe existing rows in FK-safe order (children → parents) ──────────────
  await prisma.inventoryTransaction.deleteMany();
  await prisma.advance.deleteMany();
  await prisma.salaryPayment.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.recurringExpense.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.crop.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ── Owner user ────────────────────────────────────────────────────────────
  const password = process.env.SEED_OWNER_PASSWORD ?? "abusubh2026";
  await prisma.user.create({
    data: {
      name: "أبو صبح",
      role: "OWNER",
      passwordHash: bcrypt.hashSync(password, 10),
    },
  });

  // ── Categories (from shared config) ─────────────────────────────────────────
  for (const c of seedCategories) {
    await prisma.category.create({
      data: {
        nameAr: c.nameAr,
        kind: c.kind,
        isSystem: c.isSystem,
        sortOrder: c.sortOrder,
      },
    });
  }

  // ── Crops ────────────────────────────────────────────────────────────────
  const [grape, olive, citrus] = await Promise.all([
    prisma.crop.create({ data: { nameAr: "عنب", isActive: true } }),
    prisma.crop.create({ data: { nameAr: "زيتون", isActive: true } }),
    prisma.crop.create({ data: { nameAr: "حمضيات", isActive: true } }),
  ]);

  // Helper to look up a category by Arabic name, with fallback to first EXPENSE/INCOME
  const allCategories = await prisma.category.findMany();
  const catByName = (nameAr: string) =>
    allCategories.find((c) => c.nameAr === nameAr);
  const firstExpenseCat =
    allCategories.find((c) => c.kind === "EXPENSE" || c.kind === "BOTH") ??
    allCategories[0];
  const pickExpenseCat = (nameAr: string) =>
    catByName(nameAr) ?? firstExpenseCat;

  // ── Expenses (OUT / source EXPENSE / scope FARM) ───────────────────────────
  // Each money movement creates exactly ONE LedgerEntry, atomically.
  const expenseSeed: {
    nameAr: string; // category name
    amountFils: number;
    cropId?: string;
    vendor?: string;
    note?: string;
    date: Date;
  }[] = [
    { nameAr: "أسمدة", amountFils: 120000, cropId: grape.id, vendor: "مؤسسة الزراعة", note: "سماد للعنب", date: daysAgo(25) },
    { nameAr: "محروقات", amountFils: 45000, vendor: "محطة الوقود", note: "ديزل للجرار", date: daysAgo(18) },
    { nameAr: "مياه وري", amountFils: 60000, cropId: olive.id, note: "فاتورة مياه", date: daysAgo(10) },
    { nameAr: "أسمدة", amountFils: 38000, cropId: citrus.id, vendor: "مؤسسة الزراعة", date: daysAgo(4) },
  ];

  for (const e of expenseSeed) {
    const cat = pickExpenseCat(e.nameAr);
    await prisma.$transaction(async (tx) => {
      const ledger = await tx.ledgerEntry.create({
        data: {
          date: e.date,
          direction: "OUT",
          amountFils: e.amountFils,
          scope: "FARM",
          source: "EXPENSE",
          categoryId: cat.id,
          cropId: e.cropId ?? null,
          note: e.note ?? null,
        },
      });
      await tx.expense.create({
        data: {
          date: e.date,
          amountFils: e.amountFils,
          categoryId: cat.id,
          scope: "FARM",
          cropId: e.cropId ?? null,
          vendor: e.vendor ?? null,
          note: e.note ?? null,
          ledgerEntryId: ledger.id,
        },
      });
    });
  }

  // ── Sales (IN / source SALE / scope FARM) ──────────────────────────────────
  const saleSeed: {
    cropId: string;
    marketName: string;
    quantityKg: number;
    grossFils: number;
    commissionFils: number;
    otherDeductionsFils: number;
    netFils: number;
    buyer?: string;
    date: Date;
  }[] = [
    {
      cropId: grape.id,
      marketName: "حسبة عمان المركزية",
      quantityKg: 800,
      grossFils: 800000,
      commissionFils: 80000,
      otherDeductionsFils: 20000,
      netFils: 700000,
      buyer: "تاجر الجملة",
      date: daysAgo(12),
    },
    {
      cropId: olive.id,
      marketName: "الدلال أبو محمد",
      quantityKg: 500,
      grossFils: 600000,
      commissionFils: 60000,
      otherDeductionsFils: 15000,
      netFils: 525000,
      buyer: "معصرة الزيتون",
      date: daysAgo(6),
    },
  ];

  for (const s of saleSeed) {
    await prisma.$transaction(async (tx) => {
      const ledger = await tx.ledgerEntry.create({
        data: {
          date: s.date,
          direction: "IN",
          amountFils: s.netFils,
          scope: "FARM",
          source: "SALE",
          cropId: s.cropId,
        },
      });
      await tx.sale.create({
        data: {
          date: s.date,
          cropId: s.cropId,
          marketName: s.marketName,
          quantityKg: s.quantityKg,
          grossFils: s.grossFils,
          commissionFils: s.commissionFils,
          otherDeductionsFils: s.otherDeductionsFils,
          netFils: s.netFils,
          buyer: s.buyer ?? null,
          ledgerEntryId: ledger.id,
        },
      });
    });
  }

  // ── Employees ──────────────────────────────────────────────────────────────
  const monthlyEmp = await prisma.employee.create({
    data: {
      name: "خالد العامل",
      payType: "MONTHLY",
      monthlySalaryFils: 300000,
      phone: "0790000000",
      isActive: true,
    },
  });
  await prisma.employee.create({
    data: {
      name: "سعيد اليومي",
      payType: "DAILY",
      dailyRateFils: 15000,
      phone: "0791111111",
      isActive: true,
    },
  });

  // ── Salary payments (OUT / source SALARY) ──────────────────────────────────
  const salarySeed: {
    employeeId: string | null;
    amountFils: number;
    periodLabel: string;
    workersCount?: number;
    note?: string;
    date: Date;
  }[] = [
    {
      employeeId: monthlyEmp.id,
      amountFils: 300000,
      periodLabel: "2026-06",
      note: "راتب شهري",
      date: daysAgo(2),
    },
    {
      employeeId: null,
      amountFils: 75000,
      periodLabel: "قطاف العنب",
      workersCount: 5,
      note: "أجور موسمية لقطاف العنب",
      date: daysAgo(11),
    },
  ];

  for (const p of salarySeed) {
    await prisma.$transaction(async (tx) => {
      const ledger = await tx.ledgerEntry.create({
        data: {
          date: p.date,
          direction: "OUT",
          amountFils: p.amountFils,
          scope: "FARM",
          source: "SALARY",
          note: p.note ?? null,
        },
      });
      await tx.salaryPayment.create({
        data: {
          employeeId: p.employeeId,
          date: p.date,
          amountFils: p.amountFils,
          periodLabel: p.periodLabel,
          workersCount: p.workersCount ?? null,
          note: p.note ?? null,
          ledgerEntryId: ledger.id,
        },
      });
    });
  }

  // ── Inventory ──────────────────────────────────────────────────────────────
  const urea = await prisma.inventoryItem.create({
    data: {
      nameAr: "سماد يوريا",
      unit: "KG",
      quantityOnHand: 200,
      lowStockThreshold: 50,
      isActive: true,
    },
  });
  await prisma.inventoryItem.create({
    data: {
      nameAr: "ديزل",
      unit: "L",
      quantityOnHand: 300,
      lowStockThreshold: 80,
      isActive: true,
    },
  });
  await prisma.inventoryItem.create({
    data: {
      nameAr: "مبيد حشري",
      unit: "L",
      quantityOnHand: 40,
      lowStockThreshold: 10,
      isActive: true,
    },
  });

  await prisma.inventoryTransaction.create({
    data: {
      itemId: urea.id,
      type: "IN",
      quantity: 200,
      date: daysAgo(25),
      note: "شراء دفعة سماد يوريا",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
