import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function getAuthenticatedUser(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return null;
  }

  return session.user;
}

export function createErrorResponse(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

export function createSuccessResponse(data: any, status: number = 200) {
  return Response.json(data, { status });
}

