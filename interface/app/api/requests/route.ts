import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      requestId,
      consumerAddress,
      title,
      description,
      locationLat,
      locationLng,
      budget,
      deadline,
      status = "open",
    } = body;

    if (!requestId || !consumerAddress || !title || !description || !locationLat || !locationLng || !budget || !deadline) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await db.insert(requests).values({
      requestId,
      consumerAddress,
      title,
      description,
      locationLat,
      locationLng,
      budget: budget.toString(),
      deadline: new Date(deadline),
      status,
    });

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error("Error in /api/requests POST:", error);
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
    const status = searchParams.get("status");

    let query = db.select().from(requests).orderBy(desc(requests.createdAt));

    if (consumerAddress) {
      query = query.where(eq(requests.consumerAddress, consumerAddress)) as any;
    }

    const allRequests = await query;

    let filtered = allRequests;
    if (status) {
      filtered = allRequests.filter((r) => r.status === status);
    }

    return NextResponse.json({ requests: filtered });
  } catch (error) {
    console.error("Error in /api/requests GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

