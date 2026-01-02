import { z } from "zod";

/**
 * Environment variable validation schema
 */
const envSchema = z.object({
  // Required environment variables
  NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: z.string().min(1, "Dynamic environment ID is required"),
  NEXT_PUBLIC_CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
  NEXT_PUBLIC_RPC_URL: z.string().url().optional().default("http://localhost:8545"),
  
  // Optional but recommended
  NEXT_PUBLIC_CHAIN_ID: z.string().optional(),
  AGENT_API_KEY: z.string().optional(),
  AGENT_PRIVATE_KEY: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

/**
 * Validated environment variables
 * Throws error at startup if required variables are missing
 */
export function validateEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
      NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
      NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
      AGENT_API_KEY: process.env.AGENT_API_KEY,
      AGENT_PRIVATE_KEY: process.env.AGENT_PRIVATE_KEY,
    });
  } catch (error) {
    if (error instanceof z.ZodError && error.errors) {
      const missingVars = error.errors.map(e => e.path.join(".")).join(", ");
      throw new Error(
        `Missing or invalid environment variables: ${missingVars}\n` +
        `Please check your .env file and ensure all required variables are set.`
      );
    }
    throw error;
  }
}

// Validate on module load (server-side only)
if (typeof window === "undefined") {
  try {
    validateEnv();
  } catch (error) {
    console.error("Environment validation failed:", error);
    // Don't throw in development to allow for gradual setup
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
  }
}

