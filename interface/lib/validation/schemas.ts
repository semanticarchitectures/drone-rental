import { z } from "zod";

// User schemas
export const createUserSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  userType: z.enum(["consumer", "provider", "both"]),
});

// Request schemas
export const createRequestSchema = z.object({
  requestId: z.number().int().positive(),
  consumerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  budget: z.string().regex(/^\d+$/, "Budget must be a valid number string"),
  deadline: z.string().datetime() || z.date(),
  status: z.enum(["open", "bid_accepted", "in_progress", "delivered", "completed", "disputed", "cancelled"]).optional(),
});

export const getRequestsSchema = z.object({
  consumerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address").optional(),
  status: z.enum(["open", "bid_accepted", "in_progress", "delivered", "completed", "disputed", "cancelled"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

// Bid schemas
export const createBidSchema = z.object({
  bidId: z.number().int().positive(),
  requestId: z.number().int().positive(),
  providerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  amount: z.string().regex(/^\d+$/, "Amount must be a valid number string"),
  timeline: z.number().int().positive().max(365),
  status: z.enum(["pending", "accepted", "rejected", "completed"]).optional(),
});

export const getBidsSchema = z.object({
  requestId: z.coerce.number().int().positive().optional(),
  providerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address").optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

// Coverage area schemas
export const createCoverageAreaSchema = z.object({
  providerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  radius: z.number().positive().max(50000), // Max 50km in meters
});

export const updateCoverageAreaSchema = z.object({
  id: z.number().int().positive(),
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  radius: z.number().positive().max(50000),
});

export const getCoverageAreasSchema = z.object({
  providerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address").optional(),
});

// Area of interest schemas
export const createAreaOfInterestSchema = z.object({
  consumerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  radius: z.number().positive().max(50000),
});

export const getAreaOfInterestSchema = z.object({
  consumerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address").optional(),
});

// Provider profile schemas
export const createProviderProfileSchema = z.object({
  providerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  droneImageUrl: z.string().url().optional().nullable(),
  droneModel: z.string().max(200).optional().nullable(),
  specialization: z.string().max(500).optional().nullable(),
  offersGroundImaging: z.boolean().optional(),
  groundImagingTypes: z.string().optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
});

export const updateProviderProfileSchema = createProviderProfileSchema.partial().extend({
  providerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

export const getProviderProfileSchema = z.object({
  providerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

// Rating schemas
export const createRatingSchema = z.object({
  providerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  consumerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  requestId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
});

// Agent route schemas
export const agentCreateRequestSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address").optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  locationLat: z.coerce.number().min(-90).max(90),
  locationLng: z.coerce.number().min(-180).max(180),
  budget: z.string().min(1),
  deadline: z.string(),
});

export const agentSubmitBidSchema = z.object({
  requestId: z.coerce.number().int().positive(),
  amount: z.string().min(1),
  timeline: z.coerce.number().int().positive().max(365),
});

export const agentAcceptBidSchema = z.object({
  requestId: z.coerce.number().int().positive(),
  bidId: z.coerce.number().int().positive(),
  amount: z.string().min(1),
});

export const agentDeliverJobSchema = z.object({
  requestId: z.coerce.number().int().positive(),
});

export const agentApproveDeliverySchema = z.object({
  requestId: z.coerce.number().int().positive(),
});


