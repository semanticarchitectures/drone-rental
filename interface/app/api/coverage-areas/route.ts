import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { providerCoverageAreas, ratings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const MAX_COVERAGE_AREAS = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerAddress, locationLat, locationLng, radius } = body;

    if (!providerAddress || locationLat === undefined || locationLng === undefined || !radius) {
      return NextResponse.json(
        { error: "Missing required fields: providerAddress, locationLat, locationLng, radius" },
        { status: 400 }
      );
    }

    // Check how many coverage areas this provider already has
    const existingAreas = await db
      .select()
      .from(providerCoverageAreas)
      .where(eq(providerCoverageAreas.providerAddress, providerAddress));

    if (existingAreas.length >= MAX_COVERAGE_AREAS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_COVERAGE_AREAS} coverage areas allowed per provider` },
        { status: 400 }
      );
    }

    // Create new coverage area
    const result = await db.insert(providerCoverageAreas).values({
      providerAddress,
      locationLat,
      locationLng,
      radius,
    });

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error("Error in /api/coverage-areas POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, locationLat, locationLng, radius } = body;

    if (!id || locationLat === undefined || locationLng === undefined || !radius) {
      return NextResponse.json(
        { error: "Missing required fields: id, locationLat, locationLng, radius" },
        { status: 400 }
      );
    }

    // Update existing coverage area
    await db
      .update(providerCoverageAreas)
      .set({
        locationLat,
        locationLng,
        radius,
        updatedAt: new Date(),
      })
      .where(eq(providerCoverageAreas.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/coverage-areas PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    await db
      .delete(providerCoverageAreas)
      .where(eq(providerCoverageAreas.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/coverage-areas DELETE:", error);
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

    if (providerAddress) {
      // Get all coverage areas for specific provider
      const coverageAreas = await db
        .select()
        .from(providerCoverageAreas)
        .where(eq(providerCoverageAreas.providerAddress, providerAddress));

      return NextResponse.json({ coverageAreas });
    } else {
      // Get all coverage areas (for consumer dashboard) with average ratings
      const allCoverageAreas = await db.select().from(providerCoverageAreas);
      
      // Fetch average ratings for each provider (group by provider address)
      const providerRatingsMap = new Map<string, { avg: number; count: number }>();
      
      // Get unique provider addresses
      const uniqueProviders = [...new Set(allCoverageAreas.map(a => a.providerAddress))];
      
      // Fetch ratings for each provider
      await Promise.all(
        uniqueProviders.map(async (address) => {
          const providerRatings = await db
            .select()
            .from(ratings)
            .where(eq(ratings.providerAddress, address));
          
          const avgRating =
            providerRatings.length > 0
              ? providerRatings.reduce((sum, r) => sum + r.rating, 0) / providerRatings.length
              : 0;
          
          providerRatingsMap.set(address, { avg: avgRating, count: providerRatings.length });
        })
      );
      
      // Add ratings to each coverage area
      const coverageAreasWithRatings = allCoverageAreas.map((area) => {
        const ratingInfo = providerRatingsMap.get(area.providerAddress) || { avg: 0, count: 0 };
        return {
          ...area,
          averageRating: ratingInfo.avg,
          ratingCount: ratingInfo.count,
        };
      });
      
      return NextResponse.json({ coverageAreas: coverageAreasWithRatings });
    }
  } catch (error) {
    console.error("Error in /api/coverage-areas GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

