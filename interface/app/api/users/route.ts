import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireWalletAuth } from "@/lib/middleware/auth";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, userType } = await request.json();

    if (!walletAddress || !userType) {
      return NextResponse.json(
        { error: "Missing walletAddress or userType" },
        { status: 400 }
      );
    }

    // Verify wallet authentication (optional for user creation, but recommended)
    // For now, we'll allow it without auth for initial user setup
    // In production, you may want to require auth here

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user
      await db
        .update(users)
        .set({ userType })
        .where(eq(users.walletAddress, walletAddress));
    } else {
      // Create new user
      await db.insert(users).values({
        walletAddress,
        userType,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/users:", error);
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return validationError("Missing walletAddress parameter");
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return validationError("Invalid wallet address format");
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: user[0] });
  } catch (error) {
    console.error("Error in /api/users GET:", error);
    return handleApiError(error);
  }
}

