import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { providerProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getProviderProfileSchema, createProviderProfileSchema, updateProviderProfileSchema } from "@/lib/validation/schemas";
import { validationError, handleApiError, conflictError } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const validationResult = getProviderProfileSchema.safeParse(params);
    if (!validationResult.success) {
      return validationError(
        "Validation failed",
        validationResult.error.errors
      );
    }

    const { providerAddress } = validationResult.data;

    const profile = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.providerAddress, providerAddress))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile: profile[0] });
  } catch (error) {
    console.error("Error in /api/provider-profiles GET:", error);
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createProviderProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(
        "Validation failed",
        validationResult.error.errors
      );
    }

    const {
      providerAddress,
      droneImageUrl,
      droneModel,
      specialization,
      offersGroundImaging,
      groundImagingTypes,
      bio,
    } = validationResult.data;

    // Check if profile already exists
    const existingProfile = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.providerAddress, providerAddress))
      .limit(1);

    if (existingProfile.length > 0) {
      return conflictError("Profile already exists. Use PUT to update.");
    }

    // Create new profile
    const result = await db.insert(providerProfiles).values({
      providerAddress,
      droneImageUrl: droneImageUrl || null,
      droneModel: droneModel || null,
      specialization: specialization || null,
      offersGroundImaging: offersGroundImaging || false,
      groundImagingTypes: groundImagingTypes || null,
      bio: bio || null,
    });

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error("Error in /api/provider-profiles POST:", error);
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = updateProviderProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(
        "Validation failed",
        validationResult.error.errors
      );
    }

    const {
      providerAddress,
      droneImageUrl,
      droneModel,
      specialization,
      offersGroundImaging,
      groundImagingTypes,
      bio,
    } = validationResult.data;

    // Check if profile exists
    const existingProfile = await db
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.providerAddress, providerAddress))
      .limit(1);

    if (existingProfile.length === 0) {
      // Create profile if it doesn't exist
      const result = await db.insert(providerProfiles).values({
        providerAddress,
        droneImageUrl: droneImageUrl || null,
        droneModel: droneModel || null,
        specialization: specialization || null,
        offersGroundImaging: offersGroundImaging || false,
        groundImagingTypes: groundImagingTypes || null,
        bio: bio || null,
      });
      return NextResponse.json({ success: true, id: result.lastInsertRowid });
    }

    // Update existing profile
    await db
      .update(providerProfiles)
      .set({
        droneImageUrl: droneImageUrl !== undefined ? droneImageUrl : existingProfile[0].droneImageUrl,
        droneModel: droneModel !== undefined ? droneModel : existingProfile[0].droneModel,
        specialization: specialization !== undefined ? specialization : existingProfile[0].specialization,
        offersGroundImaging: offersGroundImaging !== undefined ? offersGroundImaging : existingProfile[0].offersGroundImaging,
        groundImagingTypes: groundImagingTypes !== undefined ? groundImagingTypes : existingProfile[0].groundImagingTypes,
        bio: bio !== undefined ? bio : existingProfile[0].bio,
        updatedAt: new Date(),
      })
      .where(eq(providerProfiles.providerAddress, providerAddress));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/provider-profiles PUT:", error);
    return handleApiError(error);
  }
}

