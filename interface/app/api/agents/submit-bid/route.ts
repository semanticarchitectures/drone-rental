import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { anvil } from "viem/chains";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { db } from "@/db";
import { bids } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { privateKey, requestId, amount, timeline } = body;

    if (!privateKey || !requestId || !amount || !timeline) {
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

    const amountWei = parseEther(amount);
    const timelineDays = BigInt(parseInt(timeline));

    // Submit bid on-chain
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "submitBid",
      args: [BigInt(requestId), amountWei, timelineDays],
    });

    // Wait for transaction
    await publicClient.waitForTransactionReceipt({ hash });

    // Save to database
    const bidId = Date.now(); // Should come from contract event

    await db.insert(bids).values({
      bidId,
      requestId: parseInt(requestId),
      providerAddress: account.address,
      amount: amountWei.toString(),
      timeline: parseInt(timeline),
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      bidId,
    });
  } catch (error: any) {
    console.error("Error in /api/agents/submit-bid:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

