import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { extractTransaction } from "../lib/gemini.js";
import { auth } from "../lib/auth.js";

const transactions = new Hono();

// Extract transaction from text
const extractSchema = z.object({
  text: z.string().min(1, "Text is required"),
});

transactions.post("/extract", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const validation = extractSchema.safeParse(body);
  
  if (!validation.success) {
    return c.json({ error: validation.error.errors[0].message }, 400);
  }

  const { text } = validation.data;
  const userId = session.user.id;

  // Get user's organization (create personal org if doesn't exist)
  let member = await prisma.member.findFirst({
    where: { userId },
    include: { organization: true },
  });

  if (!member) {
    // Create a personal organization for the user
    const org = await prisma.organization.create({
      data: {
        name: `${session.user.name}'s Transactions`,
        slug: `user-${userId}-${Date.now()}`,
        members: {
          create: {
            userId,
            role: "owner",
          },
        },
      },
    });
    member = await prisma.member.findFirst({
      where: { userId, organizationId: org.id },
      include: { organization: true },
    });
  }

  const organizationId = member!.organizationId;

  try {
    // Extract transaction using Gemini
    const extracted = await extractTransaction(text);

    // Save to database
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        organizationId,
        date: extracted.date,
        description: extracted.description,
        amount: extracted.amount,
        balance: extracted.balance,
        category: extracted.category,
        rawText: text,
        confidence: extracted.confidence,
      },
    });

    return c.json({
      success: true,
      transaction: {
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        balance: transaction.balance,
        category: transaction.category,
        confidence: transaction.confidence,
      },
    });
  } catch (error) {
    console.error("Extraction error:", error);
    return c.json({ error: "Failed to extract transaction" }, 500);
  }
});

// Get transactions with cursor-based pagination
transactions.get("/", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userId = session.user.id;
  const cursor = c.req.query("cursor");
  const limit = Math.min(parseInt(c.req.query("limit") || "10"), 50);

  // Get user's organization
  const member = await prisma.member.findFirst({
    where: { userId },
  });

  if (!member) {
    return c.json({ transactions: [], nextCursor: null });
  }

  const where = {
    userId,
    organizationId: member.organizationId,
    ...(cursor && {
      createdAt: {
        lt: new Date(cursor),
      },
    }),
  };

  const items = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    select: {
      id: true,
      date: true,
      description: true,
      amount: true,
      balance: true,
      category: true,
      confidence: true,
      createdAt: true,
    },
  });

  let nextCursor: string | null = null;
  if (items.length > limit) {
    const nextItem = items.pop();
    nextCursor = nextItem!.createdAt.toISOString();
  }

  return c.json({
    transactions: items,
    nextCursor,
  });
});

export default transactions;
