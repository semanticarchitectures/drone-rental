# Drone Service Brokerage Platform

## Overview

This project is a **Next.js application** that models a drone service brokerage—similar to a freelancer marketplace, but specialized for on-demand drone video collection. **Clients** submit proposals specifying what aerial footage they want and how much they will pay. **Service Providers** (drone operators) bid on those proposals with their own quotes, terms, and reputation. The platform uses **blockchain smart contracts** (deployed with Foundry) for payment escrow and dispute resolution, integrating **Wagmi** and **Viem** for seamless on-chain UX, and **SQLite** for backend data storage. 

The workflow: 
- Clients describe their job (e.g., “capture 5 minutes of 360° video at coordinates X,Y between 10 and 50 feet”).
- Providers submit bids with a price, timeline, and associated reputation.
- The client selects a bid; funds are escrowed in a smart contract.
- The provider delivers footage within the agreed timeframe.
- Client approves or disputes the job; disputes escalate to an arbitrator for final on-chain settlement.

---

## Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) (React-based)
- **Blockchain (Escrow/Arbitration):** 
    - **Smart contracts in Solidity** using [Foundry](https://book.getfoundry.sh/)
    - [Viem](https://viem.sh/) + [Wagmi](https://wagmi.sh/) for wallet connection and on-chain interactions
- **Backend:** Node API routes in Next.js; server actions; [SQLite](https://www.sqlite.org/) as the database
- **Web3 Integration:** Wagmi hooks, Viem for contract/event calls
- **Testing:** Foundry for solidity contracts, Vitest/Jest for JavaScript/TypeScript

---

## Features

- **Proposal Submission:** 
  - Clients create detailed jobs with requirements (location, specs, timeframe, budget).
- **Freelancer Marketplace Flow:** 
  - Providers view jobs and submit competitive bids; clients compare and select based on price, terms, and reputation.
- **Reputation System:** 
  - Historical ratings for providers, shown on bids.
- **Smart Contract-Powered Escrow:** 
  - Accepted bids lock client funds using a minimal Solidity escrow contract.
- **Secure Video Delivery and Approval:** 
  - Provider uploads or links the deliverable.
  - Client reviews and approves, releasing payment.
  - Disputes can trigger escrow arbitration.
- **On-Chain Arbitration:** 
  - Arbitrator can resolve contested jobs directly on-chain.
- **Modern Web3 UX:** 
  - Connect wallet, initiate on-chain actions with Wagmi and Viem.

---

## Architecture

Here's a high-level flow:

```
[Next.js Frontend]
    |
    |---> SQLite DB (API routes for proposals, bids, users)
    |
    |---> Wagmi/Viem: Wallet connection and contract calls
    |
[Solidity Smart Contracts (Foundry)]
    - Escrow: Create, approve, dispute, arbitrate
    (Minimal on-chain state: job status, escrow funds, arbitrator verdict)
```

---

## Quickstart

### Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)
- SQLite (included with most systems)
- Metamask or other EVM-compatible wallet (for local testnet)

### Quick Start (Recommended)

Run the automated deployment script:

```bash
./scripts/deploy-and-run.sh
```

This will:
- Start Anvil (local blockchain)
- Deploy contracts
- Setup environment variables
- Start Next.js server

### Manual Setup

See [SETUP.md](./SETUP.md) for detailed manual setup instructions.

### Required Environment Variables

Create `interface/.env.local`:

```env
# REQUIRED: Get from https://app.dynamic.xyz
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_environment_id

# Auto-filled by deploy script
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...

# Default Anvil RPC
NEXT_PUBLIC_RPC_URL=http://localhost:8545
```

**Note:** No private keys needed! The deployment uses Anvil's default accounts.

---

## Usage

1. Navigate to `http://localhost:3000`
2. **Connect your wallet** (MetaMask, etc.).
3. As a **Client**: 
   - Post a new video proposal with coordinates, specs, and payment.
   - Review and compare provider bids as they arrive.
4. As a **Provider**: 
   - Browse open jobs and submit your bid.
   - Monitor status, and upload delivery links when selected.
5. **Accept a bid**: 
   - Client accepts, and app locks funds in escrow contract. Both parties can track job progress.
6. **Job Delivery & Approval**: 
   - Provider delivers within the timeframe.
   - Client approves (payment is released) or disputes (escalation possible).

---

## Example: Job Submission (Client)

```
Title: "360° Video at 40.7128N, 74.0060W"
Spec: "Capture 5 minutes of 360-degree aerial video between 10 and 50 feet"
Location: "40.7128N, 74.0060W"
Budget: 2 ETH
Deadline: 2024-08-15T18:00:00Z
```

---

## Example: Escrow Smart Contract (Key Functions)

- `createEscrow(jobId, provider, value)`
- `approveDelivery(jobId)` (client releases funds)
- `disputeDelivery(jobId)` (either party disputes)
- `arbitrate(jobId, ruling)` (arbitrator decides, funds routed accordingly)

**See `/contracts/DroneJobEscrow.sol` for more details.**

---

## Development

- **Smart Contracts:** in `/contracts`, use Forge/Foundry for testing and deployment.
- **Next.js:** API endpoints in `/app/api`, components/ui in `/app`, DB in `/db` or `/prisma`.
- **Web3:** Configure Wagmi and Viem in `/lib` or the top-level providers.
- **Database:** Schema files and migrations in `/db`.
- **Testing:** 
  - Contracts: `forge test`
  - Frontend/Backend: `pnpm test`

---

## Contributing

Contributions are welcome! Please open issues or PRs for features, UX, smart contract improvements, or documentation.

---

## License

MIT License

---

## Contact

For support, open an issue or email support@droneservicebroker.com.




