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
    const isRead = searchParams.get("isRead");
    const type = searchParams.get("type");

    const where: any = { userId: user.id };
    if (isRead !== null && isRead !== undefined) {
      where.isRead = isRead === "true";
    }
    if (type && type !== "all") {
      where.type = type;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: [
        { isRead: "asc" },
        { reminderDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return createSuccessResponse(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return createErrorResponse("Failed to fetch notifications", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { title, message, type, reminderDate, relatedId, relatedType } = body;

    if (!title || !message || !type) {
      return createErrorResponse("Title, message, and type are required");
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        reminderDate: reminderDate ? new Date(reminderDate) : null,
        relatedId: relatedId || null,
        relatedType: relatedType || null,
        userId: user.id,
      },
    });

    return createSuccessResponse(notification, 201);
  } catch (error) {
    console.error("Error creating notification:", error);
    return createErrorResponse("Failed to create notification", 500);
  }
}

