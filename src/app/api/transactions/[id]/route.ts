import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/api-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        category: true,
      },
    });

    if (!transaction) {
      return createErrorResponse("Transaction not found", 404);
    }

    return createSuccessResponse(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return createErrorResponse("Failed to fetch transaction", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const {
      date,
      recipientName,
      recipientEmail,
      type,
      amount,
      currency,
      paymentMethod,
      cardLastFour,
      status,
      categoryId,
    } = body;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!transaction) {
      return createErrorResponse("Transaction not found", 404);
    }

    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(recipientName && { recipientName }),
        ...(recipientEmail !== undefined && { recipientEmail }),
        ...(type && { type }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(currency && { currency }),
        ...(paymentMethod && { paymentMethod }),
        ...(cardLastFour !== undefined && { cardLastFour }),
        ...(status && { status }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: {
        category: true,
      },
    });

    return createSuccessResponse(updated);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return createErrorResponse("Failed to update transaction", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!transaction) {
      return createErrorResponse("Transaction not found", 404);
    }

    await prisma.transaction.delete({
      where: { id: params.id },
    });

    return createSuccessResponse({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return createErrorResponse("Failed to delete transaction", 500);
  }
}

