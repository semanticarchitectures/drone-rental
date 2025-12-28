import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { anvil } from "viem/chains";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { db } from "@/db";
import { requests } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      privateKey,
      title,
      description,
      locationLat,
      locationLng,
      budget,
      deadline,
    } = body;

    if (!privateKey || !title || !description || !locationLat || !locationLng || !budget || !deadline) {
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

    const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
    const budgetWei = parseEther(budget);

    // Create request on-chain
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "createRequest",
      args: [title, description, budgetWei, BigInt(deadlineTimestamp)],
    });

    // Wait for transaction
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Extract request ID from events
    let requestId = 0;
    if (receipt.logs) {
      // Parse RequestCreated event
      // For demo, we'll use a timestamp-based ID
      requestId = Date.now();
    }

    // Save to database
    await db.insert(requests).values({
      requestId,
      consumerAddress: account.address,
      title,
      description,
      locationLat: parseFloat(locationLat),
      locationLng: parseFloat(locationLng),
      budget: budgetWei.toString(),
      deadline: new Date(deadline),
      status: "open",
    });

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      requestId,
    });
  } catch (error: any) {
    console.error("Error in /api/agents/create-request:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

