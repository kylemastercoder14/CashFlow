import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/api-helpers";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    // Get current session token from headers
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        expiresAt: true,
        createdAt: true,
        ipAddress: true,
        userAgent: true,
        token: true,
      },
    });

    // Mark current session
    const sessionsWithCurrent = sessions.map((sessionData) => ({
      ...sessionData,
      isCurrent: sessionData.token === session?.session?.token,
    }));

    return createSuccessResponse(sessionsWithCurrent);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return createErrorResponse("Failed to fetch sessions", 500);
  }
}

