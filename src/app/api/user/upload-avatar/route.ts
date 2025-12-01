import { NextRequest } from "next/server";
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from "@/lib/api-helpers";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { imageData } = body; // base64 string

    if (!imageData) {
      return createErrorResponse("Image data is required", 400);
    }

    // Validate base64 image format
    const base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
    if (!base64Regex.test(imageData)) {
      return createErrorResponse("Invalid image format. Only PNG, JPEG, JPG, GIF, and WEBP are allowed", 400);
    }

    // Extract image data
    const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return createErrorResponse("Invalid base64 image data", 400);
    }

    const imageType = matches[1];
    const base64Data = matches[2];

    // Validate file size (max 5MB)
    const imageSize = (base64Data.length * 3) / 4;
    if (imageSize > 5 * 1024 * 1024) {
      return createErrorResponse("Image size must be less than 5MB", 400);
    }

    // Create avatars directory if it doesn't exist
    const avatarsDir = join(process.cwd(), "public", "avatars");
    if (!existsSync(avatarsDir)) {
      await mkdir(avatarsDir, { recursive: true });
    }

    // Get current user to check for existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { image: true },
    });

    // Delete old avatar if it exists and is in the avatars folder
    if (currentUser?.image && currentUser.image.startsWith("/avatars/")) {
      const oldImagePath = join(process.cwd(), "public", currentUser.image);
      if (existsSync(oldImagePath)) {
        try {
          await unlink(oldImagePath);
        } catch (error) {
          console.error("Error deleting old avatar:", error);
          // Continue even if deletion fails
        }
      }
    }

    // Generate unique filename
    const filename = `${user.id}-${Date.now()}.${imageType}`;
    const filepath = join(avatarsDir, filename);

    // Convert base64 to buffer and save
    const buffer = Buffer.from(base64Data, "base64");
    await writeFile(filepath, buffer);

    // Return the public URL path
    const imageUrl = `/avatars/${filename}`;

    return createSuccessResponse({ imageUrl });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return createErrorResponse("Failed to upload avatar", 500);
  }
}

