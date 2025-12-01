import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId: user.id },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    return createSuccessResponse(paymentMethods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return createErrorResponse("Failed to fetch payment methods", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { type, accountNumber, accountName, cvc, expiryDate, isDefault, notes } = body;

    if (!type || !accountNumber || !accountName) {
      return createErrorResponse("Type, account number, and account name are required");
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        type,
        accountNumber,
        accountName,
        cvc: cvc || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isDefault: isDefault || false,
        notes: notes || null,
        userId: user.id,
      },
    });

    return createSuccessResponse(paymentMethod, 201);
  } catch (error) {
    console.error("Error creating payment method:", error);
    return createErrorResponse("Failed to create payment method", 500);
  }
}

