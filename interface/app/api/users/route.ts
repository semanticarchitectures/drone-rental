import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, userType } = await request.json();

    if (!walletAddress || !userType) {
      return NextResponse.json(
        { error: "Missing walletAddress or userType" },
        { status: 400 }
      );
    }

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Missing walletAddress" },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

