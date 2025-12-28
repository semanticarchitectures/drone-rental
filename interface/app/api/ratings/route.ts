import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ratings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerAddress, consumerAddress, requestId, rating, comment } = body;

    if (!providerAddress || !consumerAddress || !requestId || !rating) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerAddress = searchParams.get("providerAddress");

    if (!providerAddress) {
      return NextResponse.json(
        { error: "Missing providerAddress" },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

