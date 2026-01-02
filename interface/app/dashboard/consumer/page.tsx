"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useDisconnect, usePublicClient } from "wagmi";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { parseEther, decodeEventLog } from "viem";
import CoverageMap from "@/components/map/CoverageMap";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserTypeSwitcher from "@/components/UserTypeSwitcher";
import UserAvatar from "@/components/UserAvatar";
import ProfileEditModal from "@/components/ProfileEditModal";
import CreateRequestModal from "@/components/CreateRequestModal";
import { toast } from "sonner";

interface Request {
  id: number;
  requestId: number;
  title: string;
  description: string;
  locationLat: number;
  locationLng: number;
  budget: string;
  deadline: string;
  status: string;
  consumerAddress: string;
}

interface Bid {
  id: number;
  bidId: number;
  requestId: number;
  providerAddress: string;
  amount: string;
  timeline: number;
  status: string;
}

interface ProviderCoverageArea {
  id: number;
  providerAddress: string;
  locationLat: number;
  locationLng: number;
  radius: number;
  averageRating?: number;
  ratingCount?: number;
}

interface ProviderProfile {
  id?: number;
  providerAddress: string;
  droneImageUrl?: string | null;
  droneModel?: string | null;
  specialization?: string | null;
  offersGroundImaging?: boolean;
  groundImagingTypes?: string | null;
  bio?: string | null;
}

export default function ConsumerDashboard() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const dynamicContext = useDynamicContext();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [providerCoverageAreas, setProviderCoverageAreas] = useState<ProviderCoverageArea[]>([]);
  const [areaOfInterest, setAreaOfInterest] = useState<{
    locationLat: number;
    locationLng: number;
    radius: number;
  } | null>(null);
  const [editingAreaOfInterest, setEditingAreaOfInterest] = useState<{
    locationLat: number;
    locationLng: number;
    radius: number;
  } | null>(null);
  const [isSavingAreaOfInterest, setIsSavingAreaOfInterest] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateRequestModalOpen, setIsCreateRequestModalOpen] = useState(false);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [currentRequestData, setCurrentRequestData] = useState<{
    title: string;
    description: string;
    budget: string;
    deadline: string;
    location: [number, number] | null;
  } | null>(null);

  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const publicClient = usePublicClient();
  const { isLoading: isConfirming, isSuccess, isError: isReceiptError, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });

  const fetchRequests = useCallback(async () => {
    if (!address) return;
    try {
      const response = await fetch(`/api/requests?consumerAddress=${address}`);
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  }, [address]);

  const fetchProviderCoverageAreas = useCallback(async () => {
    try {
      const response = await fetch("/api/coverage-areas");
      const data = await response.json();
      setProviderCoverageAreas(data.coverageAreas || []);
    } catch (error) {
      console.error("Error fetching provider coverage areas:", error);
    }
  }, []);

  const fetchProviderProfile = useCallback(async () => {
    if (!address) return;
    try {
      const response = await fetch(`/api/provider-profiles?providerAddress=${address}`);
      const data = await response.json();
      if (data.profile) {
        setProviderProfile(data.profile);
      } else {
        setProviderProfile(null);
      }
    } catch (error) {
      console.error("Error fetching provider profile:", error);
    }
  }, [address]);

  const fetchAreaOfInterest = useCallback(async () => {
    if (!address) return;
    try {
      const response = await fetch(`/api/areas-of-interest?consumerAddress=${address}`);
      const data = await response.json();
      if (data.areaOfInterest) {
        setAreaOfInterest({
          locationLat: data.areaOfInterest.locationLat,
          locationLng: data.areaOfInterest.locationLng,
          radius: data.areaOfInterest.radius,
        });
      } else {
        setAreaOfInterest(null);
      }
    } catch (error) {
      console.error("Error fetching area of interest:", error);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchRequests();
      fetchAreaOfInterest();
      fetchProviderProfile();
    }
    fetchProviderCoverageAreas();
  }, [address, fetchRequests, fetchAreaOfInterest, fetchProviderProfile, fetchProviderCoverageAreas]);

  useEffect(() => {
    if (isSuccess && hash && publicClient && currentRequestData) {
      // Save request to database after successful on-chain creation
      const saveRequest = async () => {
        if (!address) return;
        
        // Use selected location or default
        const location = currentRequestData.location || [40.7128, -74.0060];
        
        try {
          // Get the transaction receipt to extract the request ID from the event
          const receipt = await publicClient.getTransactionReceipt({ hash });
          
          // Parse the RequestCreated event from the receipt
          let requestId = 0;
          if (receipt.logs && receipt.logs.length > 0 && CONTRACT_ADDRESS) {
            try {
              // Find the RequestCreated event log from our contract
              for (const log of receipt.logs) {
                // Only process logs from our contract
                if (log.address.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
                  continue;
                }
                
                try {
                  const decoded = decodeEventLog({
                    abi: CONTRACT_ABI,
                    eventName: "RequestCreated",
                    data: log.data,
                    topics: log.topics,
                  });
                  
                  if (decoded && decoded.args && decoded.args.requestId) {
                    requestId = Number(decoded.args.requestId);
                    break;
                  }
                } catch (e) {
                  // Not the RequestCreated event, continue
                  continue;
                }
              }
            } catch (error) {
              console.error("Error parsing event:", error);
            }
          }
          
          // Fallback to timestamp if event parsing failed
          if (requestId === 0) {
            console.warn("Could not parse request ID from event, using timestamp fallback");
            requestId = Date.now();
          }
          
          await fetch("/api/requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestId,
              consumerAddress: address,
              title: currentRequestData.title,
              description: currentRequestData.description,
              locationLat: location[0],
              locationLng: location[1],
              budget: parseEther(currentRequestData.budget).toString(),
              deadline: currentRequestData.deadline,
              status: "open",
            }),
          });
          
          fetchRequests();
          setIsCreateRequestModalOpen(false);
          setCurrentRequestData(null);
          resetWrite(); // Reset the write state
        } catch (error) {
          console.error("Error saving request:", error);
          toast.error("Error saving request to database. Please check the console for details.");
        }
      };
      
      saveRequest();
    }
  }, [isSuccess, hash, address, currentRequestData, fetchRequests, publicClient, resetWrite]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      console.error("Contract write error:", writeError);
      let errorMessage = "Failed to create request on-chain. ";
      
      if (writeError.message) {
        if (writeError.message.includes("user rejected")) {
          errorMessage += "Transaction was rejected.";
        } else if (writeError.message.includes("insufficient funds")) {
          errorMessage += "Insufficient funds for transaction.";
        } else if (writeError.message.includes("execution reverted")) {
          errorMessage += "Transaction reverted. Please check your inputs (e.g., deadline must be in the future).";
        } else {
          errorMessage += writeError.message;
        }
      }
      
      toast.error(errorMessage);
      resetWrite();
    }
  }, [writeError, resetWrite]);

  // Handle receipt errors
  useEffect(() => {
    if (isReceiptError && receiptError) {
      console.error("Transaction receipt error:", receiptError);
      toast.error("Transaction failed. Please check the console for details.");
    }
  }, [isReceiptError, receiptError]);

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in meters
   */
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = EARTH_RADIUS_METERS;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter providers to only show those near the area of interest
  // If no area of interest, show all providers
  const nearbyProviders = React.useMemo(() => {
    if (!areaOfInterest) {
      // No area of interest - show all providers
      return providerCoverageAreas;
    }
    
    // Filter providers that overlap with area of interest
    // Two circles overlap if distance between centers < sum of radii
    return providerCoverageAreas.filter((providerArea) => {
      const distance = calculateDistance(
        areaOfInterest.locationLat,
        areaOfInterest.locationLng,
        providerArea.locationLat,
        providerArea.locationLng
      );

      // Circles overlap if distance < sum of radii
      return distance < areaOfInterest.radius + providerArea.radius;
    });
  }, [providerCoverageAreas, areaOfInterest]);
  
  // Get a random provider for centering when no area of interest is set
  // Use first provider instead of random to avoid recalculating on every render
  const randomProviderForCenter = React.useMemo(() => {
    if (areaOfInterest || providerCoverageAreas.length === 0) {
      return null;
    }
    // Use first provider instead of random to ensure stable reference
    return providerCoverageAreas[0];
  }, [providerCoverageAreas, areaOfInterest]);
  
  // Get the center location - use area of interest or random provider location
  const mapCenter = React.useMemo(() => {
    if (areaOfInterest) {
      return [areaOfInterest.locationLat, areaOfInterest.locationLng] as [number, number];
    }
    
    if (randomProviderForCenter) {
      return [randomProviderForCenter.locationLat, randomProviderForCenter.locationLng] as [number, number];
    }
    
    return [40.7128, -74.0060] as [number, number];
  }, [areaOfInterest, randomProviderForCenter]);


  const handleSaveAreaOfInterest = async () => {
    if (!address || !editingAreaOfInterest) {
      return;
    }

    setIsSavingAreaOfInterest(true);
    try {
      const response = await fetch("/api/areas-of-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consumerAddress: address,
          locationLat: editingAreaOfInterest.locationLat,
          locationLng: editingAreaOfInterest.locationLng,
          radius: editingAreaOfInterest.radius,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save area of interest");
      }

      setAreaOfInterest(editingAreaOfInterest);
      setEditingAreaOfInterest(null);
      toast.success("Area of interest saved successfully!");
    } catch (error) {
      console.error("Error saving area of interest:", error);
      toast.error("Error saving area of interest. Please try again.");
    } finally {
      setIsSavingAreaOfInterest(false);
    }
  };

  const handleDeleteAreaOfInterest = async () => {
    if (!address) {
      return;
    }

    // Use toast with confirmation action
    toast('Are you sure you want to remove your area of interest?', {
      action: {
        label: 'Remove',
        onClick: async () => {
          try {
            const response = await fetch(`/api/areas-of-interest?consumerAddress=${address}`, {
              method: "DELETE",
            });

            if (!response.ok) {
              throw new Error("Failed to delete area of interest");
            }

            setAreaOfInterest(null);
            toast.success("Area of interest removed successfully!");
          } catch (error) {
            console.error("Error deleting area of interest:", error);
            toast.error("Error deleting area of interest. Please try again.");
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const handleCreateRequest = async (formData: {
    title: string;
    description: string;
    budget: string;
    deadline: string;
    location: [number, number] | null;
  }) => {
    if (!address) return;

    // Validate contract address
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "") {
      toast.error("Contract address is not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS environment variable.");
      return;
    }

    if (!formData.title || !formData.description || !formData.budget || !formData.deadline) {
      toast.error("Please fill out all required fields");
      return;
    }

    // Validate budget
    const budgetValue = parseFloat(formData.budget);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      toast.error("Budget must be a positive number");
      return;
    }

    // Validate deadline is in the future
    const deadlineDate = new Date(formData.deadline);
    const now = new Date();
    if (deadlineDate <= now) {
      toast.error("Deadline must be in the future");
      return;
    }

    try {
      const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);
      const budgetWei = parseEther(formData.budget);

      // Validate deadline is at least 1 minute in the future (contract requirement)
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (deadlineTimestamp <= currentTimestamp) {
        toast.error("Deadline must be at least 1 minute in the future");
        return;
      }

      // Store form data for use in the success handler
      setCurrentRequestData(formData);

      // Create request on-chain
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "createRequest",
        args: [formData.title, formData.description, budgetWei, BigInt(deadlineTimestamp)],
      });
    } catch (error) {
      console.error("Error creating request:", error);
      toast.error("Error creating request. Please check the console for details.");
    }
  };

  const handleAcceptBid = async (requestId: number, bidId: number, amount: string) => {
    if (!address) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "acceptBid",
        args: [BigInt(requestId), BigInt(bidId)],
        value: BigInt(amount),
      });
    } catch (error) {
      console.error("Error accepting bid:", error);
    }
  };

  const onLogout = async () => {
    await handleLogout(disconnect, dynamicContext);
  };

  if (!isConnected || !address) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please connect your wallet</h1>
          <Link href="/login" className="text-indigo-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Consumer Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <UserTypeSwitcher />
            <button
              onClick={() => setIsCreateRequestModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create Request
            </button>
            <UserAvatar
              profileImageUrl={providerProfile?.droneImageUrl}
              onProfileClick={() => setIsProfileModalOpen(true)}
              onLogout={onLogout}
            />
          </div>
        </div>

        {/* Area of Interest Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Your Area of Interest</h2>
              <p className="text-sm text-gray-600 mt-1">
                Set your area of interest to help providers understand where you're looking for services.
              </p>
            </div>
            {areaOfInterest && !editingAreaOfInterest && (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setEditingAreaOfInterest({
                      locationLat: areaOfInterest.locationLat,
                      locationLng: areaOfInterest.locationLng,
                      radius: areaOfInterest.radius,
                    })
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteAreaOfInterest}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            )}
            {!areaOfInterest && !editingAreaOfInterest && (
              <button
                onClick={() =>
                  setEditingAreaOfInterest({
                    locationLat: 40.7128,
                    locationLng: -74.0060,
                    radius: 5000,
                  })
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Set Area of Interest
              </button>
            )}
          </div>

          {/* Display current area of interest */}
          {areaOfInterest && !editingAreaOfInterest && (
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
              <p className="text-sm">
                <span className="font-medium">Location:</span>{" "}
                {areaOfInterest.locationLat.toFixed(4)}, {areaOfInterest.locationLng.toFixed(4)}
              </p>
              <p className="text-sm mt-1">
                <span className="font-medium">Radius:</span> {(areaOfInterest.radius / 1000).toFixed(1)} km
              </p>
            </div>
          )}

          {/* Add/Edit Area of Interest Form */}
          {editingAreaOfInterest && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-4">
                {areaOfInterest ? "Edit Area of Interest" : "Set Your Area of Interest"}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Interest Radius (km):
                  </label>
                  <input
                    type="number"
                    value={(editingAreaOfInterest.radius / 1000).toFixed(1)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value > 0) {
                        setEditingAreaOfInterest({
                          ...editingAreaOfInterest,
                          radius: value * 1000,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="1"
                    max="50"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Interest Location:
                  </label>
                  <p className="text-sm text-gray-600 py-2">
                    {editingAreaOfInterest.locationLat.toFixed(4)}, {editingAreaOfInterest.locationLng.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-500">Click on the map below to change location</p>
                </div>
              </div>
              <div className="h-64 mt-4 mb-4">
                <CoverageMap
                  center={[editingAreaOfInterest.locationLat, editingAreaOfInterest.locationLng]}
                  onLocationSelect={(lat, lng) =>
                    setEditingAreaOfInterest({
                      ...editingAreaOfInterest,
                      locationLat: lat,
                      locationLng: lng,
                    })
                  }
                  selectedLocation={[editingAreaOfInterest.locationLat, editingAreaOfInterest.locationLng]}
                  coverageRadius={editingAreaOfInterest.radius}
                  providers={[]}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveAreaOfInterest}
                  disabled={isSavingAreaOfInterest}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSavingAreaOfInterest ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingAreaOfInterest(null)}
                  disabled={isSavingAreaOfInterest}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Map View</h2>
            <p className="text-sm text-gray-600 mb-2">
              {areaOfInterest
                ? `Showing providers with coverage near your area of interest (${nearbyProviders.length} providers found).`
                : nearbyProviders.length > 0
                ? `Showing all available providers (${nearbyProviders.length} providers). Set your area of interest to filter providers near you.`
                : providerCoverageAreas.length > 0
                ? `No providers match your filters. Showing all ${providerCoverageAreas.length} providers.`
                : "No providers available. Set your area of interest to see providers when they become available."}
            </p>
            <div className="h-96">
              <CoverageMap
                center={mapCenter}
                requests={requests}
                selectedLocation={null}
                coverageRadius={areaOfInterest?.radius}
                providers={
                  nearbyProviders.length > 0
                    ? nearbyProviders.map((area) => ({
                        address: area.providerAddress,
                        rating: area.averageRating || 0,
                        lat: area.locationLat,
                        lng: area.locationLng,
                        radius: area.radius,
                        ratingCount: area.ratingCount,
                      }))
                    : providerCoverageAreas.length > 0
                    ? providerCoverageAreas.map((area) => ({
                        address: area.providerAddress,
                        rating: area.averageRating || 0,
                        lat: area.locationLat,
                        lng: area.locationLng,
                        radius: area.radius,
                        ratingCount: area.ratingCount,
                      }))
                    : []
                }
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Your Requests</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {requests.length === 0 ? (
                <p className="text-gray-500">No requests yet. Create one to get started!</p>
              ) : (
                requests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onAcceptBid={handleAcceptBid}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Profile Edit Modal */}
        {address && (
          <ProfileEditModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            providerAddress={address}
            existingProfile={providerProfile}
            onSave={fetchProviderProfile}
          />
        )}

        {/* Create Request Modal */}
        <CreateRequestModal
          isOpen={isCreateRequestModalOpen}
          onClose={() => setIsCreateRequestModalOpen(false)}
          onSubmit={handleCreateRequest}
          isPending={isPending}
          isConfirming={isConfirming}
        />
        </div>
      </div>
    </ErrorBoundary>
  );
}

function RequestCard({
  request,
  onAcceptBid,
}: {
  request: Request;
  onAcceptBid: (requestId: number, bidId: number, amount: string) => void;
}) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [showBids, setShowBids] = useState(false);
  const [providerProfiles, setProviderProfiles] = useState<Map<string, ProviderProfile>>(new Map());

  useEffect(() => {
    if (showBids) {
      fetchBids();
    }
  }, [showBids, request.requestId]);

  useEffect(() => {
    if (bids.length > 0) {
      fetchProviderProfiles();
    }
  }, [bids]);

  const fetchBids = async () => {
    try {
      const response = await fetch(`/api/bids?requestId=${request.requestId}`);
      const data = await response.json();
      setBids(data.bids || []);
    } catch (error) {
      console.error("Error fetching bids:", error);
    }
  };

  const fetchProviderProfiles = async () => {
    const profiles = new Map<string, ProviderProfile>();
    await Promise.all(
      bids.map(async (bid) => {
        try {
          const response = await fetch(
            `/api/provider-profiles?providerAddress=${bid.providerAddress}`
          );
          const data = await response.json();
          if (data.profile) {
            profiles.set(bid.providerAddress, data.profile);
          }
        } catch (error) {
          console.error(`Error fetching profile for ${bid.providerAddress}:`, error);
        }
      })
    );
    setProviderProfiles(profiles);
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold">{request.title}</h3>
      <p className="text-sm text-gray-600 mb-2">{request.description}</p>
      <p className="text-sm text-gray-500">
        Budget: {request.budget} wei | Status: {request.status}
      </p>
      <button
        onClick={() => setShowBids(!showBids)}
        className="mt-2 text-sm text-indigo-600 hover:underline"
      >
        {showBids ? "Hide" : "Show"} Bids ({bids.length})
      </button>
      {showBids && (
        <div className="mt-2 space-y-2">
          {bids.length === 0 ? (
            <p className="text-sm text-gray-500">No bids yet</p>
          ) : (
            bids.map((bid) => {
              const profile = providerProfiles.get(bid.providerAddress);
              return (
                <div key={bid.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                  <div className="flex items-start gap-3">
                    {profile?.droneImageUrl && (
                      <img
                        src={profile.droneImageUrl}
                        alt="Drone"
                        className="w-20 h-20 object-cover rounded border"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        Provider: {bid.providerAddress.slice(0, 6)}...{bid.providerAddress.slice(-4)}
                      </p>
                      {profile?.droneModel && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Drone: {profile.droneModel}
                        </p>
                      )}
                      {profile?.specialization && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Specializes in: {profile.specialization}
                        </p>
                      )}
                      {profile?.offersGroundImaging && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">
                          ✓ Offers ground imaging
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="border-t pt-2 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Amount:</span> {(parseFloat(bid.amount) / 1e18).toFixed(3)} ETH
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Timeline:</span> {bid.timeline} days
                    </p>
                    {profile?.bio && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                  {bid.status === "pending" && (
                    <button
                      onClick={() => onAcceptBid(request.requestId, bid.bidId, bid.amount)}
                      className="mt-2 w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Accept Bid
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

