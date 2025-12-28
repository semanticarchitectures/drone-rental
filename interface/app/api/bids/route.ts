import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bids } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bidId,
      requestId,
      providerAddress,
      amount,
      timeline,
      status = "pending",
    } = body;

    if (!bidId || !requestId || !providerAddress || !amount || !timeline) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await db.insert(bids).values({
      bidId,
      requestId,
      providerAddress,
      amount: amount.toString(),
      timeline,
      status,
    });

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error("Error in /api/bids POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");
    const providerAddress = searchParams.get("providerAddress");

    let query = db.select().from(bids).orderBy(desc(bids.createdAt));

    if (requestId) {
      query = query.where(eq(bids.requestId, parseInt(requestId))) as any;
    }

    if (providerAddress) {
      query = query.where(eq(bids.providerAddress, providerAddress)) as any;
    }

    const allBids = await query;

    return NextResponse.json({ bids: allBids });
  } catch (error) {
    console.error("Error in /api/bids GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

