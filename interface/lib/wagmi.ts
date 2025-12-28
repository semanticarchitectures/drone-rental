import { createConfig, http } from "wagmi";
import { anvil } from "wagmi/chains";
import { defineChain } from "viem";

// Define Anvil chain explicitly to match Dynamic configuration
const anvilChain = defineChain({
  id: 31337,
  name: "Anvil",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545"],
    },
  },
});

export const config = createConfig({
  chains: [anvilChain],
  connectors: [],
  transports: {
    [anvilChain.id]: http(process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545"),
  },
});

