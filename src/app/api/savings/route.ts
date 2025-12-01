import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = { userId: user.id };
    if (type && type !== "all") {
      where.type = type;
    }
    if (startDate) {
      where.date = { ...where.date, gte: new Date(startDate) };
    }
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) };
    }

    const savings = await prisma.savings.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return createSuccessResponse(savings);
  } catch (error) {
    console.error("Error fetching savings:", error);
    return createErrorResponse("Failed to fetch savings", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { description, type, amount, date, category, notes } = body;

    if (!description || !type || !amount || !date) {
      return createErrorResponse("Missing required fields");
    }

    if (type !== "Deposit" && type !== "Withdrawal") {
      return createErrorResponse("Type must be 'Deposit' or 'Withdrawal'");
    }

    const savings = await prisma.savings.create({
      data: {
        description,
        type,
        amount: parseFloat(amount),
        date: new Date(date),
        category: category || null,
        notes: notes || null,
        userId: user.id,
      },
    });

    return createSuccessResponse(savings, 201);
  } catch (error) {
    console.error("Error creating savings record:", error);
    return createErrorResponse("Failed to create savings record", 500);
  }
}

