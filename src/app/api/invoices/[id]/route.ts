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
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      return createErrorResponse("Invoice not found", 404);
    }

    return createSuccessResponse(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return createErrorResponse("Failed to fetch invoice", 500);
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
    const { customer, date, dueDate, status, items, notes, tax } = body;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!invoice) {
      return createErrorResponse("Invoice not found", 404);
    }

    let updateData: any = {};
    if (customer) updateData.customer = customer;
    if (date) updateData.date = new Date(date);
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // If items are provided, recalculate totals
    if (items && items.length > 0) {
      const subtotal = items.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
      }, 0);
      const taxAmount = parseFloat(tax || 0);
      updateData.subtotal = subtotal;
      updateData.tax = taxAmount;
      updateData.total = subtotal + taxAmount;

      // Delete existing items and create new ones
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        ...updateData,
        ...(items && items.length > 0 && {
          items: {
            create: items.map((item: any) => ({
              description: item.description,
              quantity: parseFloat(item.quantity),
              price: parseFloat(item.price),
            })),
          },
        }),
      },
      include: {
        items: true,
      },
    });

    return createSuccessResponse(updated);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return createErrorResponse("Failed to update invoice", 500);
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
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!invoice) {
      return createErrorResponse("Invoice not found", 404);
    }

    await prisma.invoice.delete({
      where: { id },
    });

    return createSuccessResponse({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return createErrorResponse("Failed to delete invoice", 500);
  }
}

