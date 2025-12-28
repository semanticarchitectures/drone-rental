"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

export default function UserTypeSwitcher() {
  const router = useRouter();
  const { address } = useAccount();
  const { primaryWallet } = useDynamicContext();
  const walletAddress = address || primaryWallet?.address;

  const handleSwitch = async (userType: "consumer" | "provider") => {
    if (!walletAddress) return;

    try {
      // Update user type in database
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          userType,
        }),
      });

      if (response.ok) {
        // Redirect to appropriate dashboard
        if (userType === "consumer") {
          router.push("/dashboard/consumer");
        } else {
          router.push("/dashboard/provider");
        }
      }
    } catch (error) {
      console.error("Error switching user type:", error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleSwitch("consumer")}
        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
      >
        Consumer
      </button>
      <button
        onClick={() => handleSwitch("provider")}
        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
      >
        Provider
      </button>
    </div>
  );
}

