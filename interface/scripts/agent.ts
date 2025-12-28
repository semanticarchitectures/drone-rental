/**
 * Agent simulation script
 * 
 * Usage:
 *   node scripts/agent.ts create-request --privateKey <key> --title "Test" --description "Test" --lat 40.7128 --lng -74.0060 --budget 0.1 --deadline "2024-12-31T23:59:59Z"
 *   node scripts/agent.ts submit-bid --privateKey <key> --requestId 1 --amount 0.08 --timeline 7
 *   node scripts/agent.ts accept-bid --privateKey <key> --requestId 1 --bidId 1 --amount 0.08
 *   node scripts/agent.ts deliver-job --privateKey <key> --requestId 1
 *   node scripts/agent.ts approve-delivery --privateKey <key> --requestId 1
 */

const API_BASE = process.env.API_BASE || "http://localhost:3000";

async function callAgentEndpoint(endpoint: string, data: any) {
  const response = await fetch(`${API_BASE}/api/agents/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    console.error("Error:", result);
    process.exit(1);
  }
  console.log("Success:", result);
  return result;
}

const command = process.argv[2];
const args: any = {};

// Parse command line arguments
for (let i = 3; i < process.argv.length; i += 2) {
  const key = process.argv[i]?.replace(/^--/, "");
  const value = process.argv[i + 1];
  if (key && value) {
    args[key] = value;
  }
}

async function main() {
  switch (command) {
    case "create-request":
      await callAgentEndpoint("create-request", {
        privateKey: args.privateKey,
        walletAddress: args.walletAddress,
        title: args.title,
        description: args.description,
        locationLat: args.lat,
        locationLng: args.lng,
        budget: args.budget,
        deadline: args.deadline,
      });
      break;

    case "submit-bid":
      await callAgentEndpoint("submit-bid", {
        privateKey: args.privateKey,
        requestId: args.requestId,
        amount: args.amount,
        timeline: args.timeline,
      });
      break;

    case "accept-bid":
      await callAgentEndpoint("accept-bid", {
        privateKey: args.privateKey,
        requestId: args.requestId,
        bidId: args.bidId,
        amount: args.amount,
      });
      break;

    case "deliver-job":
      await callAgentEndpoint("deliver-job", {
        privateKey: args.privateKey,
        requestId: args.requestId,
      });
      break;

    case "approve-delivery":
      await callAgentEndpoint("approve-delivery", {
        privateKey: args.privateKey,
        requestId: args.requestId,
      });
      break;

    default:
      console.error("Unknown command:", command);
      console.log("Available commands: create-request, submit-bid, accept-bid, deliver-job, approve-delivery");
      process.exit(1);
  }
}

main().catch(console.error);

