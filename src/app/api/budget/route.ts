import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const budgets = await prisma.budget.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return createSuccessResponse(budgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return createErrorResponse("Failed to fetch budgets", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { name, category, allocated, spent, period } = body;

    if (!name || !category || !allocated || !period) {
      return createErrorResponse("Missing required fields");
    }

    const allocatedAmount = parseFloat(allocated);
    const spentAmount = parseFloat(spent || 0);
    const percentage = (spentAmount / allocatedAmount) * 100;

    let status = "On Track";
    if (percentage >= 100) {
      status = "Over Budget";
    } else if (percentage >= 80) {
      status = "Warning";
    }

    const budget = await prisma.budget.create({
      data: {
        name,
        category,
        allocated: allocatedAmount,
        spent: spentAmount,
        period,
        status,
        userId: user.id,
      },
    });

    return createSuccessResponse(budget, 201);
  } catch (error) {
    console.error("Error creating budget:", error);
    return createErrorResponse("Failed to create budget", 500);
  }
}

