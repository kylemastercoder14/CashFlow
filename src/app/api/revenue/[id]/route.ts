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

    const revenue = await prisma.revenue.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        category: true,
      },
    });

    if (!revenue) {
      return createErrorResponse("Revenue not found", 404);
    }

    return createSuccessResponse(revenue);
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return createErrorResponse("Failed to fetch revenue", 500);
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
    const { description, categoryId, amount, date, paymentMethod, status, customer, notes } = body;

    const revenue = await prisma.revenue.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!revenue) {
      return createErrorResponse("Revenue not found", 404);
    }

    const updated = await prisma.revenue.update({
      where: { id: params.id },
      data: {
        ...(description && { description }),
        ...(categoryId && { categoryId }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(paymentMethod && { paymentMethod }),
        ...(status && { status }),
        ...(customer !== undefined && { customer }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        category: true,
      },
    });

    return createSuccessResponse(updated);
  } catch (error) {
    console.error("Error updating revenue:", error);
    return createErrorResponse("Failed to update revenue", 500);
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

    const revenue = await prisma.revenue.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!revenue) {
      return createErrorResponse("Revenue not found", 404);
    }

    await prisma.revenue.delete({
      where: { id: params.id },
    });

    return createSuccessResponse({ message: "Revenue deleted successfully" });
  } catch (error) {
    console.error("Error deleting revenue:", error);
    return createErrorResponse("Failed to delete revenue", 500);
  }
}

