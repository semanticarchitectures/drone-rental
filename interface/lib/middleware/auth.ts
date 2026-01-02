import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";

/**
 * Middleware to verify wallet ownership
 * Uses signature verification pattern (SIWE - Sign-In With Ethereum)
 * 
 * For now, we'll use a simpler approach: verify the wallet address matches
 * the resource being accessed. In production, implement full SIWE.
 */
export async function verifyWalletOwnership(
  request: NextRequest,
  requiredAddress: string
): Promise<{ authorized: boolean; error?: string }> {
  try {
    // Get wallet address from headers or query params
    const walletAddress = request.headers.get("x-wallet-address") || 
                         new URL(request.url).searchParams.get("walletAddress");

    if (!walletAddress) {
      return { authorized: false, error: "Missing wallet address" };
    }

    // Verify addresses match (case-insensitive)
    if (walletAddress.toLowerCase() !== requiredAddress.toLowerCase()) {
      return { authorized: false, error: "Wallet address mismatch" };
    }

    // TODO: In production, implement full signature verification
    // const signature = request.headers.get("x-signature");
    // const message = request.headers.get("x-message");
    // if (!signature || !message) {
    //   return { authorized: false, error: "Missing signature" };
    // }
    // const isValid = await verifyMessage({
    //   address: walletAddress as `0x${string}`,
    //   message,
    //   signature: signature as `0x${string}`,
    // });

    return { authorized: true };
  } catch (error) {
    console.error("Error verifying wallet ownership:", error);
    return { authorized: false, error: "Verification failed" };
  }
}

/**
 * Middleware wrapper for API routes that require wallet ownership
 */
export function withWalletAuth(
  handler: (req: NextRequest, walletAddress: string) => Promise<NextResponse>,
  getRequiredAddress: (req: NextRequest) => Promise<string | null>
) {
  return async (req: NextRequest) => {
    try {
      const requiredAddress = await getRequiredAddress(req);
      
      if (!requiredAddress) {
        return NextResponse.json(
          { error: "Unable to determine required wallet address" },
          { status: 400 }
        );
      }

      const walletAddress = req.headers.get("x-wallet-address") || 
                           new URL(req.url).searchParams.get("walletAddress");

      if (!walletAddress) {
        return NextResponse.json(
          { error: "Missing wallet address" },
          { status: 401 }
        );
      }

      const verification = await verifyWalletOwnership(req, requiredAddress);
      
      if (!verification.authorized) {
        return NextResponse.json(
          { error: verification.error || "Unauthorized" },
          { status: 403 }
        );
      }

      return handler(req, walletAddress);
    } catch (error) {
      console.error("Error in wallet auth middleware:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Simple middleware to check if user is authenticated (has wallet address)
 * For routes that just need to know a user is logged in
 */
export function requireWalletAddress(req: NextRequest): string | null {
  const walletAddress = req.headers.get("x-wallet-address") || 
                       new URL(req.url).searchParams.get("walletAddress");
  return walletAddress;
}
