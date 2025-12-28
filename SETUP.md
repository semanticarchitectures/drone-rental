# Setup Guide

## Quick Start

Run the deployment script to deploy contracts and start the Next.js server:

```bash
./scripts/deploy-and-run.sh
```

This script will:
1. Start Anvil (local blockchain) if not running
2. Deploy the DroneJobEscrow contract
3. Update `interface/.env.local` with the contract address
4. Start the Next.js development server

## Required Environment Variables

### For Next.js (`interface/.env.local`)

Create `interface/.env.local` with the following variables:

```env
# Dynamic.xyz Environment ID (REQUIRED for authentication)
# Get this from https://app.dynamic.xyz
# 1. Sign up/login at https://app.dynamic.xyz
# 2. Create a new project
# 3. Copy your Environment ID from the dashboard
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_environment_id_here

# Contract Address (auto-filled by deploy script)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...

# RPC URL (defaults to local Anvil)
NEXT_PUBLIC_RPC_URL=http://localhost:8545
```

### For Contract Deployment

**No environment variables needed!** The deployment script uses Anvil's default accounts.

Anvil provides 10 pre-funded accounts by default:
- Account 0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (used as deployer/arbitrator)
- All accounts have 10,000 ETH for testing

## Manual Setup Steps

If you prefer to set up manually:

### 1. Start Anvil

```bash
anvil
```

Keep this running in a separate terminal.

### 2. Deploy Contracts

```bash
cd contracts
forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545
```

Copy the contract address from the output.

### 3. Setup Environment Variables

Create `interface/.env.local`:

```env
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_env_id
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # from step 2
NEXT_PUBLIC_RPC_URL=http://localhost:8545
```

### 4. Start Next.js

```bash
cd interface
npm install
npm run dev
```

## Getting Dynamic.xyz Environment ID

1. Go to https://app.dynamic.xyz
2. Sign up or log in
3. Create a new project (or use existing)
4. Navigate to Settings → API Keys
5. Copy your Environment ID
6. Paste it into `interface/.env.local` as `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`

## Troubleshooting

### Anvil not starting
- Make sure port 8545 is not in use
- Check if Anvil is already running: `curl http://localhost:8545`

### Contract deployment fails
- Ensure Anvil is running
- Check that you're in the `contracts` directory
- Verify Foundry is installed: `forge --version`

### Next.js won't start
- Check that `interface/.env.local` exists
- Verify `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` is set (can be empty for testing, but auth won't work)
- Ensure `npm install` has been run in the `interface` directory

### Database errors
- The SQLite database is created automatically on first run
- If migration errors occur, delete `interface/drone-rental.db` and restart

## Testing with Agent Scripts

After the app is running, you can simulate user behavior:

```bash
# Get a private key from Anvil (first account: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
cd interface

# Create a request
node scripts/agent.ts create-request \
  --privateKey ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --title "Test Request" \
  --description "Test Description" \
  --lat 40.7128 \
  --lng -74.0060 \
  --budget 0.1 \
  --deadline "2024-12-31T23:59:59Z"
```

Note: Use Anvil's default private keys (without 0x prefix) for testing.

