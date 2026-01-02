import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { createRequestSchema, getRequestsSchema } from "@/lib/validation/schemas";
import { validationError, handleApiError } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = createRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return validationError(
        "Validation failed",
        validationResult.error.errors
      );
    }

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
    } = validationResult.data;

    const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
    
    const result = await db.insert(requests).values({
      requestId,
      consumerAddress,
      title,
      description,
      locationLat,
      locationLng,
      budget: budget.toString(),
      deadline: deadlineDate,
      status,
    });

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error("Error in /api/requests POST:", error);
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const validationResult = getRequestsSchema.safeParse(params);
    if (!validationResult.success) {
      return validationError(
        "Validation failed",
        validationResult.error.errors
      );
    }

    const { consumerAddress, status, page, limit } = validationResult.data;
    const offset = (page - 1) * limit;

    let query = db.select().from(requests).orderBy(desc(requests.createdAt));

    // Build where conditions
    const conditions = [];
    if (consumerAddress) {
      conditions.push(eq(requests.consumerAddress, consumerAddress));
    }
    if (status) {
      conditions.push(eq(requests.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allRequests = await query;
    const total = allRequests.length;
    const paginatedRequests = allRequests.slice(offset, offset + limit);

    return NextResponse.json({
      requests: paginatedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in /api/requests GET:", error);
    return handleApiError(error);
  }
}

