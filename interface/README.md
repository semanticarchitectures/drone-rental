# Drone Rental Platform - Frontend

A blockchain-powered drone service marketplace built with Next.js, TypeScript, and Web3 technologies.

## Features

- **Web3 Authentication**: Secure wallet-based authentication using Dynamic Labs
- **Smart Contract Integration**: On-chain request creation, bidding, and escrow management
- **Location-Based Matching**: Coverage area mapping for providers and consumers
- **Rating System**: Transparent provider ratings based on completed jobs
- **Real-time Updates**: Live dashboard updates for requests, bids, and job status

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`: Your Dynamic Labs environment ID
- `NEXT_PUBLIC_CONTRACT_ADDRESS`: Deployed smart contract address
- `NEXT_PUBLIC_RPC_URL`: Blockchain RPC endpoint (default: http://localhost:8545)
- `NEXT_PUBLIC_CHAIN_ID`: Chain ID (default: 31337 for Anvil)

Optional (for agent routes):
- `AGENT_API_KEY`: API key for agent authentication
- `AGENT_PRIVATE_KEY`: Private key for agent wallet operations

### 3. Database Setup

The database will be automatically created and migrated on first run. The SQLite database file `drone-rental.db` will be created in the `interface` directory.

To manually run migrations:
```bash
npm run db:migrate
```

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Architecture

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Drizzle ORM
- **Blockchain**: Wagmi/Viem for Ethereum interactions
- **Authentication**: Dynamic Labs for Web3 wallet management
- **UI**: Tailwind CSS with custom components
- **State Management**: React Query for server state
- **Validation**: Zod for input validation

### Project Structure

```
interface/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard pages
│   ├── (auth)/           # Authentication pages
│   └── layout.tsx        # Root layout
├── components/           # React components
├── db/                   # Database schema and connection
├── lib/                  # Utilities and configurations
│   ├── api/              # API utilities (errors, etc.)
│   ├── middleware/      # Middleware (auth, rate limiting)
│   ├── validation/      # Zod schemas
│   └── utils/            # Shared utilities
└── scripts/              # Utility scripts
```

### Security Features

- Input validation with Zod schemas
- Wallet ownership verification middleware
- Rate limiting for API routes
- Environment variable validation
- Error boundaries for graceful error handling
- Standardized error responses

### API Routes

All API routes are located in `app/api/`:

- `/api/users` - User management
- `/api/requests` - Request CRUD operations
- `/api/bids` - Bid management
- `/api/coverage-areas` - Provider coverage areas
- `/api/areas-of-interest` - Consumer areas of interest
- `/api/provider-profiles` - Provider profile management
- `/api/ratings` - Rating system
- `/api/agents/*` - Agent routes (for testing, requires API key)

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

## Development

### Code Quality

- **Linting**: ESLint with Next.js config
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Standardized error responses and error boundaries

### Testing

Agent simulation scripts are available in `scripts/agent.ts` for testing the full workflow.

## Production Deployment

### Environment Variables

Ensure all required environment variables are set in your production environment. The app will validate these on startup.

### Database

For production, consider migrating from SQLite to PostgreSQL or another production-ready database. Update the database connection in `db/index.ts`.

### Rate Limiting

The current rate limiting uses in-memory storage. For production, implement Redis-based rate limiting or use a service like Cloudflare.

### Security Considerations

- Never commit `.env.local` or `.env` files
- Use strong API keys for agent routes
- Implement proper CORS policies
- Use HTTPS in production
- Consider implementing full SIWE (Sign-In With Ethereum) for enhanced security

## License

[Add your license here]
