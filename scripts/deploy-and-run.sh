#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Drone Rental Platform Deployment${NC}"

# Check if Anvil is running
if ! curl -s http://localhost:8545 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Anvil not detected. Starting Anvil in background...${NC}"
    anvil > /tmp/anvil.log 2>&1 &
    ANVIL_PID=$!
    echo -e "${GREEN}✅ Anvil started (PID: $ANVIL_PID)${NC}"
    sleep 2
else
    echo -e "${GREEN}✅ Anvil is already running${NC}"
    ANVIL_PID=""
fi

# Deploy contracts
echo -e "${GREEN}📦 Deploying contracts...${NC}"
cd contracts

# Use Anvil's first default account (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
# This account is pre-funded with 10,000 ETH in Anvil
ANVIL_DEFAULT_SENDER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Deploy and capture output
echo -e "${YELLOW}Running forge script...${NC}"
DEPLOY_OUTPUT=$(forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545 --sender $ANVIL_DEFAULT_SENDER --unlocked 2>&1)

# Check if deployment was successful
if echo "$DEPLOY_OUTPUT" | grep -q "Script ran successfully"; then
    echo -e "${GREEN}✅ Deployment script executed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Script may not have completed successfully${NC}"
fi

# Extract contract address from output (multiple methods for robustness)
CONTRACT_ADDRESS=""

# Method 1: Extract from console.log output "DroneJobEscrow deployed at:"
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -i "DroneJobEscrow deployed at:" | grep -oE "0x[0-9a-fA-F]{40}" | head -1)

# Method 2: Extract from broadcast artifacts JSON (most reliable)
if [ -z "$CONTRACT_ADDRESS" ]; then
    # Find the latest broadcast run JSON file
    BROADCAST_DIR="broadcast/Deploy.s.sol/31337"
    if [ -d "$BROADCAST_DIR" ]; then
        LATEST_RUN=$(ls -t "$BROADCAST_DIR"/run-*.json 2>/dev/null | head -1)
        if [ -n "$LATEST_RUN" ]; then
            # Try to extract from transactions array
            CONTRACT_ADDRESS=$(grep -oE '"contractAddress":"0x[0-9a-fA-F]{40}"' "$LATEST_RUN" | head -1 | grep -oE "0x[0-9a-fA-F]{40}")
        fi
    fi
fi

# Method 3: Extract from Return section in output
if [ -z "$CONTRACT_ADDRESS" ]; then
    CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -i "contract DroneJobEscrow" | grep -oE "0x[0-9a-fA-F]{40}" | head -1)
fi

# Method 4: Try to find any deployed contract address in the output
if [ -z "$CONTRACT_ADDRESS" ]; then
    # Look for any address pattern after "deployed at" or similar patterns
    CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -iE "(deployed|contract)" | grep -oE "0x[0-9a-fA-F]{40}" | head -1)
fi

# Validate contract address format
if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}❌ Failed to extract contract address from deployment${NC}"
    echo -e "${YELLOW}Deployment output:${NC}"
    echo "$DEPLOY_OUTPUT" | tail -50
    echo -e "${YELLOW}Checking broadcast artifacts...${NC}"
    if [ -d "$BROADCAST_DIR" ]; then
        ls -la "$BROADCAST_DIR" || true
    fi
    exit 1
fi

# Validate it's a proper Ethereum address (42 chars: 0x + 40 hex)
if [ ${#CONTRACT_ADDRESS} -ne 42 ]; then
    echo -e "${RED}❌ Invalid contract address format: $CONTRACT_ADDRESS${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contract deployed at: $CONTRACT_ADDRESS${NC}"

cd ..

# Setup .env.local if it doesn't exist
if [ ! -f "interface/.env.local" ]; then
    echo -e "${YELLOW}⚠️  Creating .env.local file...${NC}"
    cat > interface/.env.local << EOF
# Dynamic.xyz Environment ID (get from https://app.dynamic.xyz)
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=

# Contract Address (auto-filled)
NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS

# RPC URL for Anvil
NEXT_PUBLIC_RPC_URL=http://localhost:8545
EOF
    echo -e "${GREEN}✅ Created .env.local file${NC}"
    echo -e "${YELLOW}⚠️  Please add your NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID to interface/.env.local${NC}"
else
    # Update contract address in existing .env.local
    # Use a temporary file for cross-platform compatibility
    TEMP_ENV=$(mktemp)
    if grep -q "NEXT_PUBLIC_CONTRACT_ADDRESS" interface/.env.local; then
        # Update existing line
        sed "s|NEXT_PUBLIC_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS|" interface/.env.local > "$TEMP_ENV"
        mv "$TEMP_ENV" interface/.env.local
    else
        # Add new line
        echo "NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> interface/.env.local
    fi
    echo -e "${GREEN}✅ Updated contract address in .env.local${NC}"
    
    # Verify the update
    if grep -q "NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" interface/.env.local; then
        echo -e "${GREEN}✅ Verified: Contract address is set to $CONTRACT_ADDRESS${NC}"
    else
        echo -e "${RED}❌ Warning: Failed to verify contract address in .env.local${NC}"
    fi
fi

# Verify contract address is set
if ! grep -q "NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" interface/.env.local; then
    echo -e "${RED}❌ ERROR: Contract address was not properly set in .env.local${NC}"
    exit 1
fi

# Check if Dynamic environment ID is set
if ! grep -q "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=.*[^=]$" interface/.env.local || grep -q "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=$" interface/.env.local; then
    echo -e "${YELLOW}⚠️  WARNING: NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is not set in interface/.env.local${NC}"
    echo -e "${YELLOW}   Get your environment ID from https://app.dynamic.xyz${NC}"
    echo -e "${YELLOW}   Authentication will not work without it!${NC}"
fi

# Display final configuration
echo -e "${GREEN}📋 Configuration Summary:${NC}"
echo -e "   Contract Address: $CONTRACT_ADDRESS"
echo -e "   RPC URL: $(grep 'NEXT_PUBLIC_RPC_URL=' interface/.env.local | cut -d'=' -f2 || echo 'http://localhost:8545')"
if grep -q "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=.*[^=]$" interface/.env.local; then
    echo -e "   Dynamic Environment ID: ✅ Set"
else
    echo -e "   Dynamic Environment ID: ❌ Not set"
fi

# Check if Next.js is already running (portable check)
if command -v lsof > /dev/null 2>&1 && lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    echo -e "${YELLOW}   The contract address has been updated in .env.local${NC}"
    echo -e "${YELLOW}   If Next.js is running, restart it to pick up the new contract address${NC}"
elif curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Something is already running on port 3000${NC}"
    echo -e "${YELLOW}   The contract address has been updated in .env.local${NC}"
    echo -e "${YELLOW}   If Next.js is running, restart it to pick up the new contract address${NC}"
fi

# Start Next.js
echo -e "${GREEN}🌐 Starting Next.js development server...${NC}"
echo -e "${YELLOW}   Note: Next.js will read .env.local at startup${NC}"
cd interface

# Function to cleanup on exit
cleanup() {
    if [ ! -z "$ANVIL_PID" ]; then
        echo -e "\n${YELLOW}Stopping Anvil (PID: $ANVIL_PID)...${NC}"
        kill $ANVIL_PID 2>/dev/null || true
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

npm run dev

