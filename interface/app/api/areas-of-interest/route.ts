import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { consumerAreasOfInterest } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { consumerAddress, locationLat, locationLng, radius } = body;

    if (!consumerAddress || locationLat === undefined || locationLng === undefined || !radius) {
      return NextResponse.json(
        { error: "Missing required fields: consumerAddress, locationLat, locationLng, radius" },
        { status: 400 }
      );
    }

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consumerAddress = searchParams.get("consumerAddress");

    if (consumerAddress) {
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consumerAddress = searchParams.get("consumerAddress");

    if (!consumerAddress) {
      return NextResponse.json(
        { error: "Missing required parameter: consumerAddress" },
        { status: 400 }
      );
    }

    await db
      .delete(consumerAreasOfInterest)
      .where(eq(consumerAreasOfInterest.consumerAddress, consumerAddress));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/areas-of-interest DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

