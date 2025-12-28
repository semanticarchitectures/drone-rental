# Drone Rental Platform - Frontend

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the `interface` directory:

```env
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...  # Set after deploying contract
NEXT_PUBLIC_RPC_URL=http://localhost:8545
```

### 3. Database Setup

The database will be automatically created and migrated on first run. The SQLite database file `drone-rental.db` will be created in the `interface` directory.

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Agent Simulation

To simulate user behavior using the agent API:

```bash
# Create a request
node scripts/agent.ts create-request \
  --privateKey <private_key> \
  --title "Test Request" \
  --description "Test Description" \
  --lat 40.7128 \
  --lng -74.0060 \
  --budget 0.1 \
  --deadline "2024-12-31T23:59:59Z"

# Submit a bid
node scripts/agent.ts submit-bid \
  --privateKey <private_key> \
  --requestId 1 \
  --amount 0.08 \
  --timeline 7

# Accept a bid
node scripts/agent.ts accept-bid \
  --privateKey <private_key> \
  --requestId 1 \
  --bidId 1 \
  --amount 0.08

# Deliver a job
node scripts/agent.ts deliver-job \
  --privateKey <private_key> \
  --requestId 1

# Approve delivery
node scripts/agent.ts approve-delivery \
  --privateKey <private_key> \
  --requestId 1
```

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - React components
- `/db` - Database schema and connection
- `/lib` - Utility functions and configurations
- `/scripts` - Agent simulation scripts
