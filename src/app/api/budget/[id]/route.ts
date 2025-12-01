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
    const budget = await prisma.budget.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!budget) {
      return createErrorResponse("Budget not found", 404);
    }

    return createSuccessResponse(budget);
  } catch (error) {
    console.error("Error fetching budget:", error);
    return createErrorResponse("Failed to fetch budget", 500);
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
    const { name, category, allocated, spent, period } = body;

    const budget = await prisma.budget.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!budget) {
      return createErrorResponse("Budget not found", 404);
    }

    const allocatedAmount = allocated !== undefined ? parseFloat(allocated) : budget.allocated;
    const spentAmount = spent !== undefined ? parseFloat(spent) : budget.spent;
    const percentage = (spentAmount / allocatedAmount) * 100;

    let status = "On Track";
    if (percentage >= 100) {
      status = "Over Budget";
    } else if (percentage >= 80) {
      status = "Warning";
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(allocated !== undefined && { allocated: allocatedAmount }),
        ...(spent !== undefined && { spent: spentAmount }),
        ...(period && { period }),
        status,
      },
    });

    return createSuccessResponse(updated);
  } catch (error) {
    console.error("Error updating budget:", error);
    return createErrorResponse("Failed to update budget", 500);
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
    const budget = await prisma.budget.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!budget) {
      return createErrorResponse("Budget not found", 404);
    }

    await prisma.budget.delete({
      where: { id },
    });

    return createSuccessResponse({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return createErrorResponse("Failed to delete budget", 500);
  }
}

