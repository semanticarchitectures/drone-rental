import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  walletAddress: text("wallet_address").notNull().unique(),
  userType: text("user_type").notNull(), // "consumer", "provider", "both"
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const requests = sqliteTable("requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requestId: integer("request_id").notNull(), // On-chain request ID
  consumerAddress: text("consumer_address").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  locationLat: real("location_lat").notNull(),
  locationLng: real("location_lng").notNull(),
  budget: text("budget").notNull(), // Stored as string to handle large numbers
  deadline: integer("deadline", { mode: "timestamp" }).notNull(),
  status: text("status").notNull().default("open"), // "open", "bid_accepted", "in_progress", "delivered", "completed", "disputed", "cancelled"
  acceptedBidId: integer("accepted_bid_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const bids = sqliteTable("bids", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bidId: integer("bid_id").notNull(), // On-chain bid ID
  requestId: integer("request_id").notNull(),
  providerAddress: text("provider_address").notNull(),
  amount: text("amount").notNull(), // Stored as string to handle large numbers
  timeline: integer("timeline").notNull(), // Days
  status: text("status").notNull().default("pending"), // "pending", "accepted", "rejected", "completed"
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const ratings = sqliteTable("ratings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  providerAddress: text("provider_address").notNull(),
  consumerAddress: text("consumer_address").notNull(),
  requestId: integer("request_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const providerCoverageAreas = sqliteTable("provider_coverage_areas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  providerAddress: text("provider_address").notNull(), // Removed unique constraint to allow multiple areas
  locationLat: real("location_lat").notNull(),
  locationLng: real("location_lng").notNull(),
  radius: real("radius").notNull(), // in meters
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const consumerAreasOfInterest = sqliteTable("consumer_areas_of_interest", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  consumerAddress: text("consumer_address").notNull().unique(), // One area of interest per consumer
  locationLat: real("location_lat").notNull(),
  locationLng: real("location_lng").notNull(),
  radius: real("radius").notNull(), // in meters
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const providerProfiles = sqliteTable("provider_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  providerAddress: text("provider_address").notNull().unique(),
  droneImageUrl: text("drone_image_url"), // URL to uploaded drone image
  droneModel: text("drone_model"), // e.g., "DJI Mavic 3", "Autel EVO II"
  specialization: text("specialization"), // e.g., "Aerial photography", "Surveying", "Inspections"
  offersGroundImaging: integer("offers_ground_imaging", { mode: "boolean" }).default(false),
  groundImagingTypes: text("ground_imaging_types"), // JSON array or comma-separated: ["camera", "cell_phone", "action_camera"]
  bio: text("bio"), // Additional information about the provider
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

