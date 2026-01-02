import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bids } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { createBidSchema, getBidsSchema } from "@/lib/validation/schemas";
import { validationError, handleApiError } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createBidSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(
        "Validation failed",
        validationResult.error.errors
      );
    }

    const {
      bidId,
      requestId,
      providerAddress,
      amount,
      timeline,
      status = "pending",
    } = validationResult.data;

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
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const validationResult = getBidsSchema.safeParse(params);
    if (!validationResult.success) {
      return validationError(
        "Validation failed",
        validationResult.error.errors
      );
    }

    const { requestId, providerAddress, page, limit } = validationResult.data;
    const offset = (page - 1) * limit;

    let query = db.select().from(bids).orderBy(desc(bids.createdAt));

    // Build where conditions
    const conditions = [];
    if (requestId) {
      conditions.push(eq(bids.requestId, requestId));
    }
    if (providerAddress) {
      conditions.push(eq(bids.providerAddress, providerAddress));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allBids = await query;
    const total = allBids.length;
    const paginatedBids = allBids.slice(offset, offset + limit);

    return NextResponse.json({
      bids: paginatedBids,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in /api/bids GET:", error);
    return handleApiError(error);
  }
}

