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
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");

    const where: any = { userId: user.id };
    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }
    if (status && status !== "all") {
      where.status = status;
    }

    const revenues = await prisma.revenue.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { date: "desc" },
    });

    return createSuccessResponse(revenues);
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return createErrorResponse("Failed to fetch revenue", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { description, categoryId, amount, date, paymentMethod, status, customer, notes } = body;

    if (!description || !categoryId || !amount || !date || !paymentMethod) {
      return createErrorResponse("Missing required fields");
    }

    const revenue = await prisma.revenue.create({
      data: {
        description,
        categoryId,
        amount: parseFloat(amount),
        date: new Date(date),
        paymentMethod,
        status: status || "Pending",
        customer: customer || null,
        notes: notes || null,
        userId: user.id,
      },
      include: {
        category: true,
      },
    });

    return createSuccessResponse(revenue, 201);
  } catch (error) {
    console.error("Error creating revenue:", error);
    return createErrorResponse("Failed to create revenue", 500);
  }
}

