import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ratings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createRatingSchema } from "@/lib/validation/schemas";
import { validationError, handleApiError } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createRatingSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(
        "Validation failed",
        validationResult.error.errors
      );
    }

    const { providerAddress, consumerAddress, requestId, rating, comment } = validationResult.data;

    await db.insert(ratings).values({
      providerAddress,
      consumerAddress,
      requestId,
      rating,
      comment: comment || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/ratings POST:", error);
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerAddress = searchParams.get("providerAddress");

    if (!providerAddress) {
      return validationError("Missing providerAddress parameter");
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(providerAddress)) {
      return validationError("Invalid wallet address format");
    }

    const allRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.providerAddress, providerAddress));

    const avgRating =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
        : 0;

    return NextResponse.json({
      ratings: allRatings,
      averageRating: avgRating,
      count: allRatings.length,
    });
  } catch (error) {
    console.error("Error in /api/ratings GET:", error);
    return handleApiError(error);
  }
}

