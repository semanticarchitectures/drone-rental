import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { anvil } from "viem/chains";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { privateKey, requestId } = body;

    if (!privateKey || !requestId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const account = privateKeyToAccount(`0x${privateKey.replace(/^0x/, "")}` as `0x${string}`);
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";
    
    const walletClient = createWalletClient({
      account,
      chain: anvil,
      transport: http(rpcUrl),
    });

    const publicClient = createPublicClient({
      chain: anvil,
      transport: http(rpcUrl),
    });

    // Deliver job on-chain
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "deliverJob",
      args: [BigInt(requestId)],
    });

    // Wait for transaction
    await publicClient.waitForTransactionReceipt({ hash });

    // Update database
    await db
      .update(requests)
      .set({ status: "delivered" })
      .where(eq(requests.requestId, parseInt(requestId)));

    return NextResponse.json({
      success: true,
      transactionHash: hash,
    });
  } catch (error: any) {
    console.error("Error in /api/agents/deliver-job:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

