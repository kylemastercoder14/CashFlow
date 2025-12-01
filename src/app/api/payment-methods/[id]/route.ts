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

    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!paymentMethod) {
      return createErrorResponse("Payment method not found", 404);
    }

    return createSuccessResponse(paymentMethod);
  } catch (error) {
    console.error("Error fetching payment method:", error);
    return createErrorResponse("Failed to fetch payment method", 500);
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
    const { type, accountNumber, accountName, cvc, expiryDate, isDefault, notes } = body;

    // Check if payment method exists and belongs to user
    const existing = await prisma.paymentMethod.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return createErrorResponse("Payment method not found", 404);
    }

    // If setting as default, unset other defaults
    if (isDefault && !existing.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const paymentMethod = await prisma.paymentMethod.update({
      where: { id: params.id },
      data: {
        ...(type && { type }),
        ...(accountNumber && { accountNumber }),
        ...(accountName && { accountName }),
        ...(cvc !== undefined && { cvc: cvc || null }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(isDefault !== undefined && { isDefault }),
        ...(notes !== undefined && { notes }),
      },
    });

    return createSuccessResponse(paymentMethod);
  } catch (error) {
    console.error("Error updating payment method:", error);
    return createErrorResponse("Failed to update payment method", 500);
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

    // Check if payment method exists and belongs to user
    const existing = await prisma.paymentMethod.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return createErrorResponse("Payment method not found", 404);
    }

    await prisma.paymentMethod.delete({
      where: { id: params.id },
    });

    return createSuccessResponse({ message: "Payment method deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return createErrorResponse("Failed to delete payment method", 500);
  }
}

