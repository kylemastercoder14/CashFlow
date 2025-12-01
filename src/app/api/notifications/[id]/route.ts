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

    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!notification) {
      return createErrorResponse("Notification not found", 404);
    }

    return createSuccessResponse(notification);
  } catch (error) {
    console.error("Error fetching notification:", error);
    return createErrorResponse("Failed to fetch notification", 500);
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
    const { title, message, type, isRead, reminderDate, relatedId, relatedType } = body;

    // Check if notification exists and belongs to user
    const existing = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return createErrorResponse("Notification not found", 404);
    }

    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(message && { message }),
        ...(type && { type }),
        ...(isRead !== undefined && { isRead }),
        ...(reminderDate !== undefined && { reminderDate: reminderDate ? new Date(reminderDate) : null }),
        ...(relatedId !== undefined && { relatedId }),
        ...(relatedType !== undefined && { relatedType }),
      },
    });

    return createSuccessResponse(notification);
  } catch (error) {
    console.error("Error updating notification:", error);
    return createErrorResponse("Failed to update notification", 500);
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

    // Check if notification exists and belongs to user
    const existing = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existing) {
      return createErrorResponse("Notification not found", 404);
    }

    await prisma.notification.delete({
      where: { id: params.id },
    });

    return createSuccessResponse({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return createErrorResponse("Failed to delete notification", 500);
  }
}

