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
    const status = searchParams.get("status");

    const where: any = { userId: user.id };
    if (type && type !== "all") {
      where.type = type;
    }
    if (status && status !== "all") {
      where.status = status;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { date: "desc" },
    });

    return createSuccessResponse(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return createErrorResponse("Failed to fetch transactions", 500);
  }
}

export async function POST(request: NextRequest) {
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

    if (!date || !recipientName || !type || !amount || !paymentMethod) {
      return createErrorResponse("Missing required fields");
    }

    // Generate transaction ID
    const count = await prisma.transaction.count({
      where: { userId: user.id },
    });
    const transactionId = `#${String(count + 1).padStart(4, "0")}`;

    const transaction = await prisma.transaction.create({
      data: {
        transactionId,
        date: new Date(date),
        recipientName,
        recipientEmail: recipientEmail || "",
        type,
        amount: parseFloat(amount),
        currency: currency || "PHP",
        paymentMethod,
        cardLastFour: cardLastFour || null,
        status: status || "Pending",
        categoryId: categoryId || null,
        userId: user.id,
      },
      include: {
        category: true,
      },
    });

    return createSuccessResponse(transaction, 201);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return createErrorResponse("Failed to create transaction", 500);
  }
}

