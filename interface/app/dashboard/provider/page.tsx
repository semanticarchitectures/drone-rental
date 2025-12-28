"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useDisconnect } from "wagmi";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { parseEther } from "viem";
import CoverageMap from "@/components/map/CoverageMap";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserTypeSwitcher from "@/components/UserTypeSwitcher";
import UserAvatar from "@/components/UserAvatar";
import ProfileEditModal from "@/components/ProfileEditModal";
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

interface ConsumerAreaOfInterest {
  id: number;
  consumerAddress: string;
  locationLat: number;
  locationLng: number;
  radius: number;
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
  updatedAt?: Date;
  createdAt?: Date;
}

export default function ProviderDashboard() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const dynamicContext = useDynamicContext();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidData, setBidData] = useState({
    amount: "",
    timeline: "",
  });
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [coverageAreas, setCoverageAreas] = useState<Array<{
    id: number;
    locationLat: number;
    locationLng: number;
    radius: number;
  }>>([]);
  const [editingArea, setEditingArea] = useState<{
    id: number | null;
    locationLat: number;
    locationLng: number;
    radius: number;
  } | null>(null);
  const [isSavingCoverage, setIsSavingCoverage] = useState(false);
  const [consumerAreasOfInterest, setConsumerAreasOfInterest] = useState<ConsumerAreaOfInterest[]>([]);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    fetchRequests();
    if (address) {
      fetchMyBids();
      fetchCoverageAreas();
      fetchProfile();
    }
    fetchConsumerAreasOfInterest();
  }, [address]);

  useEffect(() => {
    if (isSuccess) {
      fetchRequests();
      fetchMyBids();
      setShowBidForm(false);
      setBidData({ amount: "", timeline: "" });
    }
  }, [isSuccess]);

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/requests?status=open");
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const fetchMyBids = async () => {
    if (!address) return;
    try {
      const response = await fetch(`/api/bids?providerAddress=${address}`);
      const data = await response.json();
      setMyBids(data.bids || []);
    } catch (error) {
      console.error("Error fetching bids:", error);
    }
  };

  const fetchCoverageAreas = async () => {
    if (!address) return;
    try {
      const response = await fetch(`/api/coverage-areas?providerAddress=${address}`);
      const data = await response.json();
      setCoverageAreas(data.coverageAreas || []);
    } catch (error) {
      console.error("Error fetching coverage areas:", error);
    }
  };

  const fetchConsumerAreasOfInterest = async () => {
    try {
      const response = await fetch("/api/areas-of-interest");
      const data = await response.json();
      setConsumerAreasOfInterest(data.areasOfInterest || []);
    } catch (error) {
      console.error("Error fetching consumer areas of interest:", error);
    }
  };

  const fetchProfile = async () => {
    if (!address) return;
    try {
      const response = await fetch(`/api/provider-profiles?providerAddress=${address}`);
      const data = await response.json();
      if (data.profile) {
        setProfile(data.profile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleAddCoverageArea = () => {
    if (coverageAreas.length >= 3) {
      toast.error("Maximum 3 coverage areas allowed");
      return;
    }
    setEditingArea({
      id: null,
      locationLat: 40.7128,
      locationLng: -74.0060,
      radius: 5000,
    });
  };

  const handleEditCoverageArea = (area: typeof coverageAreas[0]) => {
    setEditingArea({
      id: area.id,
      locationLat: area.locationLat,
      locationLng: area.locationLng,
      radius: area.radius,
    });
  };

  const handleDeleteCoverageArea = async (id: number) => {
    // Use toast with confirmation action
    toast('Are you sure you want to delete this coverage area?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const response = await fetch(`/api/coverage-areas?id=${id}`, {
              method: "DELETE",
            });

            if (!response.ok) {
              throw new Error("Failed to delete coverage area");
            }

            await fetchCoverageAreas();
            toast.success("Coverage area deleted successfully!");
          } catch (error) {
            console.error("Error deleting coverage area:", error);
            toast.error("Error deleting coverage area. Please try again.");
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const handleSaveCoverageArea = async () => {
    if (!address || !editingArea) {
      return;
    }

    setIsSavingCoverage(true);
    try {
      const url = "/api/coverage-areas";
      const method = editingArea.id ? "PUT" : "POST";
      const body = editingArea.id
        ? {
            id: editingArea.id,
            locationLat: editingArea.locationLat,
            locationLng: editingArea.locationLng,
            radius: editingArea.radius,
          }
        : {
            providerAddress: address,
            locationLat: editingArea.locationLat,
            locationLng: editingArea.locationLng,
            radius: editingArea.radius,
          };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save coverage area");
      }

      setEditingArea(null);
      await fetchCoverageAreas();
      toast.success("Coverage area saved successfully!");
    } catch (error) {
      console.error("Error saving coverage area:", error);
      toast.error(error instanceof Error ? error.message : "Error saving coverage area. Please try again.");
    } finally {
      setIsSavingCoverage(false);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !selectedRequest) return;

    try {
      const amountWei = parseEther(bidData.amount);
      const timelineDays = parseInt(bidData.timeline);

      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "submitBid",
        args: [BigInt(selectedRequest.requestId), amountWei, BigInt(timelineDays)],
      });
    } catch (error) {
      console.error("Error submitting bid:", error);
    }
  };

  const handleDeliverJob = async (requestId: number) => {
    if (!address) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "deliverJob",
        args: [BigInt(requestId)],
      });
    } catch (error) {
      console.error("Error delivering job:", error);
    }
  };

  const handleLogout = async () => {
    try {
      // Try to use Dynamic Labs logout if available
      if (dynamicContext && typeof (dynamicContext as any).logout === "function") {
        await (dynamicContext as any).logout();
      }
      
      // Disconnect wagmi wallet
      disconnect();
      
      // Clear Dynamic Labs session storage
      // Dynamic Labs stores session data in localStorage
      if (typeof window !== "undefined") {
        // Clear all Dynamic Labs related storage
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.toLowerCase().includes("dynamic") || key.toLowerCase().includes("wallet"))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Also clear sessionStorage
        const sessionKeysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.toLowerCase().includes("dynamic") || key.toLowerCase().includes("wallet"))) {
            sessionKeysToRemove.push(key);
          }
        }
        sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      }
      
      // Force a full page reload to clear all state
      window.location.href = "/";
    } catch (error) {
      console.error("Error during logout:", error);
      // Still try to disconnect and redirect even if there's an error
      disconnect();
      window.location.href = "/";
    }
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

  const mapCenter: [number, number] =
    editingArea
      ? [editingArea.locationLat, editingArea.locationLng]
      : coverageAreas.length > 0
      ? [coverageAreas[0].locationLat, coverageAreas[0].locationLng]
      : requests.length > 0
      ? [requests[0].locationLat, requests[0].locationLng]
      : [40.7128, -74.0060];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Provider Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <UserTypeSwitcher />
            <UserAvatar
              profileImageUrl={profile?.droneImageUrl}
              onProfileClick={() => setIsProfileModalOpen(true)}
              onLogout={handleLogout}
            />
          </div>
        </div>

        {/* Provider Profile Section */}
        <div id="profile-section" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Your Profile</h2>
              <p className="text-sm text-gray-600 mt-1">
                Share information about yourself and your drone services to help consumers find you.
              </p>
            </div>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {profile ? "Edit Profile" : "Create Profile"}
            </button>
          </div>

          {profile ? (
            <div className="space-y-4">
              {profile.droneImageUrl && (
                <div>
                  <label className="block text-sm font-medium mb-2">Drone Image</label>
                  <img
                    src={profile.droneImageUrl}
                    alt="Drone"
                    className="w-full max-w-md h-64 object-cover rounded-lg border"
                  />
                </div>
              )}
              {profile.droneModel && (
                <div>
                  <label className="block text-sm font-medium mb-1">Drone Model</label>
                  <p className="text-gray-700 dark:text-gray-300">{profile.droneModel}</p>
                </div>
              )}
              {profile.specialization && (
                <div>
                  <label className="block text-sm font-medium mb-1">Specialization</label>
                  <p className="text-gray-700 dark:text-gray-300">{profile.specialization}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Ground Imaging</label>
                <p className="text-gray-700 dark:text-gray-300">
                  {profile.offersGroundImaging ? "Yes" : "No"}
                </p>
                {profile.offersGroundImaging && profile.groundImagingTypes && (
                  <p className="text-sm text-gray-600 mt-1">
                    Types: {typeof profile.groundImagingTypes === "string"
                      ? JSON.parse(profile.groundImagingTypes).join(", ")
                      : profile.groundImagingTypes.join(", ")}
                  </p>
                )}
              </div>
              {profile.bio && (
                <div>
                  <label className="block text-sm font-medium mb-1">About</label>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No profile yet. Click "Create Profile" to get started.
            </p>
          )}
        </div>

        {/* Profile Edit Modal */}
        <ProfileEditModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          providerAddress={address || ""}
          existingProfile={profile}
          onSave={fetchProfile}
        />

        {/* Coverage Area Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Manage Your Coverage Areas</h2>
              <p className="text-sm text-gray-600 mt-1">
                You can set up to 3 coverage areas. Click on the map to set locations and adjust radius for each area.
              </p>
            </div>
            <button
              onClick={handleAddCoverageArea}
              disabled={coverageAreas.length >= 3 || editingArea !== null}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Area ({coverageAreas.length}/3)
            </button>
          </div>

          {/* Existing Coverage Areas List */}
          {coverageAreas.length > 0 && (
            <div className="mb-4 space-y-2">
              {coverageAreas.map((area, index) => (
                <div
                  key={area.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex-1">
                    <span className="font-medium">Area {index + 1}:</span>{" "}
                    <span className="text-sm text-gray-600">
                      {area.locationLat.toFixed(4)}, {area.locationLng.toFixed(4)} - Radius: {(area.radius / 1000).toFixed(1)} km
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCoverageArea(area)}
                      disabled={editingArea !== null}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCoverageArea(area.id)}
                      disabled={editingArea !== null}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Coverage Area Form */}
          {editingArea && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-4">
                {editingArea.id ? "Edit Coverage Area" : "Add New Coverage Area"}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Coverage Radius (km):
                  </label>
                  <input
                    type="number"
                    value={(editingArea.radius / 1000).toFixed(1)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value > 0) {
                        setEditingArea({ ...editingArea, radius: value * 1000 });
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
                    Service Location:
                  </label>
                  <p className="text-sm text-gray-600 py-2">
                    {editingArea.locationLat.toFixed(4)}, {editingArea.locationLng.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-500">Click on the map below to change location</p>
                </div>
              </div>
              <div className="h-64 mt-4 mb-4">
                <CoverageMap
                  center={[editingArea.locationLat, editingArea.locationLng]}
                  onLocationSelect={(lat, lng) =>
                    setEditingArea({ ...editingArea, locationLat: lat, locationLng: lng })
                  }
                  selectedLocation={[editingArea.locationLat, editingArea.locationLng]}
                  coverageRadius={editingArea.radius}
                  providers={coverageAreas
                    .filter((a) => a.id !== editingArea.id)
                    .map((area) => ({
                      address: address || "",
                      rating: 0,
                      lat: area.locationLat,
                      lng: area.locationLng,
                      radius: area.radius,
                    }))}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveCoverageArea}
                  disabled={isSavingCoverage}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSavingCoverage ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingArea(null)}
                  disabled={isSavingCoverage}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Show existing areas on map when not editing */}
          {!editingArea && coverageAreas.length > 0 && (
            <div className="h-64 mt-4">
              <CoverageMap
                center={mapCenter}
                providers={coverageAreas.map((area) => ({
                  address: address || "",
                  rating: 0,
                  lat: area.locationLat,
                  lng: area.locationLng,
                  radius: area.radius,
                }))}
                requests={requests}
                onRequestClick={(request) => {
                  setSelectedRequest(request);
                  setShowBidForm(true);
                }}
              />
            </div>
          )}
        </div>

        {showBidForm && selectedRequest && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Submit Bid for: {selectedRequest.title}
            </h2>
            <form onSubmit={handleSubmitBid} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  value={bidData.amount}
                  onChange={(e) => setBidData({ ...bidData, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  max={parseFloat(selectedRequest.budget) / 1e18}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max: {(parseFloat(selectedRequest.budget) / 1e18).toFixed(3)} ETH
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Timeline (days)</label>
                <input
                  type="number"
                  value={bidData.timeline}
                  onChange={(e) => setBidData({ ...bidData, timeline: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  min="1"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending || isConfirming}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isPending || isConfirming ? "Processing..." : "Submit Bid"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBidForm(false);
                    setSelectedRequest(null);
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Available Requests</h2>
            <div className="h-96 mb-4">
              <p className="text-xs text-gray-500 mb-2">
                Green: Your coverage | Blue: Consumer interest areas | Orange: Requests
              </p>
              <CoverageMap
                center={mapCenter}
                requests={requests}
                onRequestClick={(request) => {
                  setSelectedRequest(request);
                  setShowBidForm(true);
                }}
                providers={coverageAreas.map((area) => ({
                  address: address || "",
                  rating: 0,
                  lat: area.locationLat,
                  lng: area.locationLng,
                  radius: area.radius,
                }))}
                selectedLocation={
                  consumerAreasOfInterest.length > 0
                    ? [
                        consumerAreasOfInterest[0].locationLat,
                        consumerAreasOfInterest[0].locationLng,
                      ]
                    : null
                }
                coverageRadius={
                  consumerAreasOfInterest.length > 0
                    ? consumerAreasOfInterest[0].radius
                    : undefined
                }
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {requests.length === 0 ? (
                <p className="text-gray-500">No open requests available</p>
              ) : (
                requests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowBidForm(true);
                    }}
                  >
                    <h3 className="font-semibold">{request.title}</h3>
                    <p className="text-sm text-gray-600">{request.description}</p>
                    <p className="text-xs text-gray-500">
                      Budget: {(parseFloat(request.budget) / 1e18).toFixed(3)} ETH
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">My Bids & Jobs</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {myBids.length === 0 ? (
                <p className="text-gray-500">No bids yet. Submit a bid to get started!</p>
              ) : (
                myBids.map((bid) => (
                  <BidCard
                    key={bid.id}
                    bid={bid}
                    onDeliver={handleDeliverJob}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BidCard({
  bid,
  onDeliver,
}: {
  bid: Bid;
  onDeliver: (requestId: number) => void;
}) {
  const [request, setRequest] = useState<Request | null>(null);

  useEffect(() => {
    fetchRequest();
  }, [bid.requestId]);

  const fetchRequest = async () => {
    try {
      const response = await fetch("/api/requests");
      const data = await response.json();
      const found = data.requests.find((r: Request) => r.requestId === bid.requestId);
      setRequest(found || null);
    } catch (error) {
      console.error("Error fetching request:", error);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      {request && <h3 className="font-semibold mb-2">{request.title}</h3>}
      <p className="text-sm text-gray-600">
        Amount: {(parseFloat(bid.amount) / 1e18).toFixed(3)} ETH
      </p>
      <p className="text-sm text-gray-600">Timeline: {bid.timeline} days</p>
      <p className="text-sm text-gray-600">Status: {bid.status}</p>
      {bid.status === "accepted" && (
        <button
          onClick={() => onDeliver(bid.requestId)}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Mark as Delivered
        </button>
      )}
    </div>
  );
}

