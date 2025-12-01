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

    const where: any = { userId: user.id };
    if (type && type !== "all") {
      where.type = type;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return createSuccessResponse(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return createErrorResponse("Failed to fetch categories", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { name, type, description, color } = body;

    if (!name || !type) {
      return createErrorResponse("Name and type are required");
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        description: description || null,
        color: color || "#3b82f6",
        userId: user.id,
      },
    });

    return createSuccessResponse(category, 201);
  } catch (error) {
    console.error("Error creating category:", error);
    return createErrorResponse("Failed to create category", 500);
  }
}

