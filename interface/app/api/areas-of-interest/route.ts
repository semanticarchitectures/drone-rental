import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { consumerAreasOfInterest } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createAreaOfInterestSchema, getAreaOfInterestSchema } from "@/lib/validation/schemas";
import { validationError, handleApiError } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createAreaOfInterestSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(
        "Validation failed",
        validationResult.error.errors
      );
    }

    const { consumerAddress, locationLat, locationLng, radius } = validationResult.data;

    // Check if area of interest exists for this consumer
    const existing = await db
      .select()
      .from(consumerAreasOfInterest)
      .where(eq(consumerAreasOfInterest.consumerAddress, consumerAddress))
      .limit(1);

    if (existing.length > 0) {
      // Update existing area of interest
      await db
        .update(consumerAreasOfInterest)
        .set({
          locationLat,
          locationLng,
          radius,
          updatedAt: new Date(),
        })
        .where(eq(consumerAreasOfInterest.consumerAddress, consumerAddress));
    } else {
      // Create new area of interest
      await db.insert(consumerAreasOfInterest).values({
        consumerAddress,
        locationLat,
        locationLng,
        radius,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/areas-of-interest POST:", error);
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const validationResult = getAreaOfInterestSchema.safeParse(params);
    if (!validationResult.success && searchParams.has("consumerAddress")) {
      return validationError(
        "Validation failed",
        validationResult.error.errors
      );
    }

    const consumerAddress = searchParams.get("consumerAddress");

    if (consumerAddress) {
      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(consumerAddress)) {
        return validationError("Invalid wallet address format");
      }
      // Get area of interest for specific consumer
      const areaOfInterest = await db
        .select()
        .from(consumerAreasOfInterest)
        .where(eq(consumerAreasOfInterest.consumerAddress, consumerAddress))
        .limit(1);

      if (areaOfInterest.length === 0) {
        return NextResponse.json({ areaOfInterest: null });
      }

      return NextResponse.json({ areaOfInterest: areaOfInterest[0] });
    } else {
      // Get all areas of interest (for provider dashboard)
      const allAreasOfInterest = await db.select().from(consumerAreasOfInterest);
      return NextResponse.json({ areasOfInterest: allAreasOfInterest });
    }
  } catch (error) {
    console.error("Error in /api/areas-of-interest GET:", error);
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consumerAddress = searchParams.get("consumerAddress");

    if (!consumerAddress) {
      return validationError("Missing required parameter: consumerAddress");
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(consumerAddress)) {
      return validationError("Invalid wallet address format");
    }

    await db
      .delete(consumerAreasOfInterest)
      .where(eq(consumerAreasOfInterest.consumerAddress, consumerAddress));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/areas-of-interest DELETE:", error);
    return handleApiError(error);
  }
}

