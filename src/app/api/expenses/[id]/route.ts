import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/api-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const expense = await prisma.expense.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        category: true,
      },
    });

    if (!expense) {
      return createErrorResponse("Expense not found", 404);
    }

    return createSuccessResponse(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return createErrorResponse("Failed to fetch expense", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const body = await request.json();
    const { description, categoryId, amount, date, paymentMethod, status, vendor, notes } = body;

    const expense = await prisma.expense.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!expense) {
      return createErrorResponse("Expense not found", 404);
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(categoryId && { categoryId }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(paymentMethod && { paymentMethod }),
        ...(status && { status }),
        ...(vendor !== undefined && { vendor }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        category: true,
      },
    });

    return createSuccessResponse(updated);
  } catch (error) {
    console.error("Error updating expense:", error);
    return createErrorResponse("Failed to update expense", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const expense = await prisma.expense.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!expense) {
      return createErrorResponse("Expense not found", 404);
    }

    await prisma.expense.delete({
      where: { id },
    });

    return createSuccessResponse({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return createErrorResponse("Failed to delete expense", 500);
  }
}

