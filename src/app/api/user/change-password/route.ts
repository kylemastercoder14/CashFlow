import { NextRequest } from "next/server";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/api-helpers";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return createErrorResponse("Current password and new password are required", 400);
    }

    if (newPassword.length < 8) {
      return createErrorResponse("New password must be at least 8 characters long", 400);
    }

    // Use better-auth's changePassword API which handles password verification and hashing
    try {
      const result = await auth.api.changePassword({
        body: {
          currentPassword,
          newPassword,
        },
        headers: request.headers,
      });

      if (result?.error) {
        return createErrorResponse(result.error.message || "Failed to change password", 400);
      }

      return createSuccessResponse({ message: "Password changed successfully" });
    } catch (error: any) {
      console.error("Error changing password:", error);
      // Better-auth will return appropriate error messages
      if (error?.message) {
        return createErrorResponse(error.message, 400);
      }
      return createErrorResponse("Failed to change password", 500);
    }
  } catch (error) {
    console.error("Error changing password:", error);
    return createErrorResponse("Failed to change password", 500);
  }
}

