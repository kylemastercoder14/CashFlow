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

    const category = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!category) {
      return createErrorResponse("Category not found", 404);
    }

    return createSuccessResponse(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return createErrorResponse("Failed to fetch category", 500);
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
    const { name, type, description, color } = body;

    const category = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!category) {
      return createErrorResponse("Category not found", 404);
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
      },
    });

    return createSuccessResponse(updated);
  } catch (error) {
    console.error("Error updating category:", error);
    return createErrorResponse("Failed to update category", 500);
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

    const category = await prisma.category.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!category) {
      return createErrorResponse("Category not found", 404);
    }

    await prisma.category.delete({
      where: { id: params.id },
    });

    return createSuccessResponse({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return createErrorResponse("Failed to delete category", 500);
  }
}

