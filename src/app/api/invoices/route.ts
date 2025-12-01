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
    const status = searchParams.get("status");

    const where: any = { userId: user.id };
    if (status && status !== "all") {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { date: "desc" },
    });

    return createSuccessResponse(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return createErrorResponse("Failed to fetch invoices", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { customer, date, dueDate, status, items, notes, tax } = body;

    if (!customer || !date || !dueDate || !items || items.length === 0) {
      return createErrorResponse("Missing required fields");
    }

    // Generate invoice number
    const count = await prisma.invoice.count({
      where: { userId: user.id },
    });
    const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
    }, 0);
    const taxAmount = parseFloat(tax || 0);
    const total = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customer,
        date: new Date(date),
        dueDate: new Date(dueDate),
        status: status || "Draft",
        subtotal,
        tax: taxAmount,
        total,
        notes: notes || null,
        userId: user.id,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            price: parseFloat(item.price),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return createSuccessResponse(invoice, 201);
  } catch (error) {
    console.error("Error creating invoice:", error);
    return createErrorResponse("Failed to create invoice", 500);
  }
}

