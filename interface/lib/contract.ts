export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export const CONTRACT_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "requestId", type: "uint256" },
      { indexed: true, internalType: "address", name: "consumer", type: "address" },
      { indexed: false, internalType: "string", name: "title", type: "string" },
      { indexed: false, internalType: "uint256", name: "budget", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "RequestCreated",
    type: "event",
  },
  {
    inputs: [
      { internalType: "string", name: "_title", type: "string" },
      { internalType: "string", name: "_description", type: "string" },
      { internalType: "uint256", name: "_budget", type: "uint256" },
      { internalType: "uint256", name: "_deadline", type: "uint256" },
    ],
    name: "createRequest",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_requestId", type: "uint256" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
      { internalType: "uint256", name: "_timeline", type: "uint256" },
    ],
    name: "submitBid",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_requestId", type: "uint256" },
      { internalType: "uint256", name: "_bidId", type: "uint256" },
    ],
    name: "acceptBid",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_requestId", type: "uint256" }],
    name: "deliverJob",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_requestId", type: "uint256" }],
    name: "approveDelivery",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_requestId", type: "uint256" },
      { internalType: "string", name: "_reason", type: "string" },
    ],
    name: "disputeDelivery",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_requestId", type: "uint256" }],
    name: "getRequest",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "requestId", type: "uint256" },
          { internalType: "address", name: "consumer", type: "address" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "uint256", name: "budget", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint8", name: "status", type: "uint8" },
          { internalType: "uint256", name: "acceptedBidId", type: "uint256" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
        ],
        internalType: "struct DroneJobEscrow.Request",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_bidId", type: "uint256" }],
    name: "getBid",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "bidId", type: "uint256" },
          { internalType: "uint256", name: "requestId", type: "uint256" },
          { internalType: "address", name: "provider", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "timeline", type: "uint256" },
          { internalType: "uint8", name: "status", type: "uint8" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
        ],
        internalType: "struct DroneJobEscrow.Bid",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_requestId", type: "uint256" }],
    name: "getRequestBids",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

