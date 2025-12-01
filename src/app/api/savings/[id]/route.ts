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
    const savings = await prisma.savings.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!savings) {
      return createErrorResponse("Savings record not found", 404);
    }

    return createSuccessResponse(savings);
  } catch (error) {
    console.error("Error fetching savings record:", error);
    return createErrorResponse("Failed to fetch savings record", 500);
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
    const { description, type, amount, date, category, notes } = body;

    const savings = await prisma.savings.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!savings) {
      return createErrorResponse("Savings record not found", 404);
    }

    if (type && type !== "Deposit" && type !== "Withdrawal") {
      return createErrorResponse("Type must be 'Deposit' or 'Withdrawal'");
    }

    const updated = await prisma.savings.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(type && { type }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(category !== undefined && { category }),
        ...(notes !== undefined && { notes }),
      },
    });

    return createSuccessResponse(updated);
  } catch (error) {
    console.error("Error updating savings record:", error);
    return createErrorResponse("Failed to update savings record", 500);
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
    const savings = await prisma.savings.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!savings) {
      return createErrorResponse("Savings record not found", 404);
    }

    await prisma.savings.delete({
      where: { id },
    });

    return createSuccessResponse({ message: "Savings record deleted successfully" });
  } catch (error) {
    console.error("Error deleting savings record:", error);
    return createErrorResponse("Failed to delete savings record", 500);
  }
}

