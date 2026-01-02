import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { providerCoverageAreas, ratings } from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { createCoverageAreaSchema, updateCoverageAreaSchema, getCoverageAreasSchema } from "@/lib/validation/schemas";
import { validationError, handleApiError, conflictError } from "@/lib/api/errors";

const MAX_COVERAGE_AREAS = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createCoverageAreaSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(
        "Validation failed",
        validationResult.error.errors
      );
    }

    const { providerAddress, locationLat, locationLng, radius } = validationResult.data;

    // Check how many coverage areas this provider already has
    const existingAreas = await db
      .select()
      .from(providerCoverageAreas)
      .where(eq(providerCoverageAreas.providerAddress, providerAddress));

    if (existingAreas.length >= MAX_COVERAGE_AREAS) {
      return conflictError(`Maximum ${MAX_COVERAGE_AREAS} coverage areas allowed per provider`);
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
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = updateCoverageAreaSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(
        "Validation failed",
        validationResult.error.errors
      );
    }

    const { id, locationLat, locationLng, radius } = validationResult.data;

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
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return validationError("Missing required parameter: id");
    }

    const idNum = parseInt(id);
    if (isNaN(idNum)) {
      return validationError("Invalid id parameter");
    }

    await db
      .delete(providerCoverageAreas)
      .where(eq(providerCoverageAreas.id, idNum));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/coverage-areas DELETE:", error);
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const validationResult = getCoverageAreasSchema.safeParse(params);
    if (!validationResult.success) {
      return validationError(
        "Validation failed",
        validationResult.error.errors
      );
    }

    const { providerAddress } = validationResult.data;

    if (providerAddress) {
      // Get all coverage areas for specific provider
      const coverageAreas = await db
        .select()
        .from(providerCoverageAreas)
        .where(eq(providerCoverageAreas.providerAddress, providerAddress));

      return NextResponse.json({ coverageAreas });
    } else {
      // Get all coverage areas (for consumer dashboard) with average ratings
      // Optimized: Use SQL aggregation to avoid N+1 query problem
      const allCoverageAreas = await db.select().from(providerCoverageAreas);
      
      // Get unique provider addresses
      const uniqueProviders = [...new Set(allCoverageAreas.map(a => a.providerAddress))];
      
      if (uniqueProviders.length === 0) {
        return NextResponse.json({ coverageAreas: [] });
      }

      // Single query to get all ratings for these providers (more efficient than N queries)
      // Fetch all ratings in one query, then aggregate in memory
      const allRatings = await db
        .select()
        .from(ratings)
        .where(inArray(ratings.providerAddress, uniqueProviders));
      
      // Aggregate in memory (still more efficient than N queries)
      const providerRatingsMap = new Map<string, { avg: number; count: number }>();
      uniqueProviders.forEach((address) => {
        const providerRatings = allRatings.filter(r => r.providerAddress === address);
        const avgRating = providerRatings.length > 0
          ? providerRatings.reduce((sum, r) => sum + r.rating, 0) / providerRatings.length
          : 0;
        providerRatingsMap.set(address, { avg: avgRating, count: providerRatings.length });
      });
      
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
    return handleApiError(error);
  }
}

