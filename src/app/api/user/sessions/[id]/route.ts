import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/api-helpers";
import { auth } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const sessionId = params.id;

    // Get current session to prevent deleting it
    const currentSession = await auth.api.getSession({
      headers: request.headers,
    });

    // Check if session belongs to user
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
    });

    if (!session) {
      return createErrorResponse("Session not found", 404);
    }

    // Prevent deleting current session
    if (session.token === currentSession?.session?.token) {
      return createErrorResponse("Cannot delete current session", 400);
    }

    // Delete the session
    await prisma.session.delete({
      where: { id: sessionId },
    });

    return createSuccessResponse({ message: "Session revoked successfully" });
  } catch (error) {
    console.error("Error revoking session:", error);
    return createErrorResponse("Failed to revoke session", 500);
  }
}

