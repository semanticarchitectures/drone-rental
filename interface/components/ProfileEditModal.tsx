"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

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

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerAddress: string;
  existingProfile?: ProviderProfile | null;
  onSave?: () => void;
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  providerAddress,
  existingProfile,
  onSave,
}: ProfileEditModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    droneImageUrl: "",
    droneModel: "",
    specialization: "",
    offersGroundImaging: false,
    groundImagingTypes: [] as string[],
    bio: "",
  });

  // Load existing profile data when modal opens
  useEffect(() => {
    if (isOpen && existingProfile) {
      setProfileData({
        droneImageUrl: existingProfile.droneImageUrl || "",
        droneModel: existingProfile.droneModel || "",
        specialization: existingProfile.specialization || "",
        offersGroundImaging: existingProfile.offersGroundImaging || false,
        groundImagingTypes: existingProfile.groundImagingTypes
          ? typeof existingProfile.groundImagingTypes === "string"
            ? JSON.parse(existingProfile.groundImagingTypes)
            : existingProfile.groundImagingTypes
          : [],
        bio: existingProfile.bio || "",
      });
    } else if (isOpen) {
      // Reset to empty if no existing profile
      setProfileData({
        droneImageUrl: "",
        droneModel: "",
        specialization: "",
        offersGroundImaging: false,
        groundImagingTypes: [],
        bio: "",
      });
    }
  }, [isOpen, existingProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/provider-profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerAddress,
          droneImageUrl: profileData.droneImageUrl || null,
          droneModel: profileData.droneModel || null,
          specialization: profileData.specialization || null,
          offersGroundImaging: profileData.offersGroundImaging,
          groundImagingTypes: profileData.groundImagingTypes.length > 0
            ? JSON.stringify(profileData.groundImagingTypes)
            : null,
          bio: profileData.bio || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save profile");
      }

      if (onSave) {
        onSave();
      }
      onClose();
      toast.success("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(error instanceof Error ? error.message : "Error saving profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {existingProfile ? "Edit Profile" : "Create Profile"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Drone Image URL
            </label>
            <input
              type="url"
              value={profileData.droneImageUrl}
              onChange={(e) => setProfileData({ ...profileData, droneImageUrl: e.target.value })}
              placeholder="https://example.com/drone-image.jpg"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter a URL to an image of your drone
            </p>
            {profileData.droneImageUrl && (
              <div className="mt-2">
                <img
                  src={profileData.droneImageUrl}
                  alt="Drone preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Drone Model
            </label>
            <input
              type="text"
              value={profileData.droneModel}
              onChange={(e) => setProfileData({ ...profileData, droneModel: e.target.value })}
              placeholder="e.g., DJI Mavic 3, Autel EVO II"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Specialization
            </label>
            <input
              type="text"
              value={profileData.specialization}
              onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
              placeholder="e.g., Aerial photography, Surveying, Inspections"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={profileData.offersGroundImaging}
                onChange={(e) =>
                  setProfileData({ ...profileData, offersGroundImaging: e.target.checked })
                }
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Offer Ground Imaging
              </span>
            </label>
            {profileData.offersGroundImaging && (
              <div className="ml-6 space-y-2">
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Ground Imaging Types (select all that apply):
                </label>
                {["camera", "cell_phone", "action_camera", "professional_camera", "other"].map(
                  (type) => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={profileData.groundImagingTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProfileData({
                              ...profileData,
                              groundImagingTypes: [...profileData.groundImagingTypes, type],
                            });
                          } else {
                            setProfileData({
                              ...profileData,
                              groundImagingTypes: profileData.groundImagingTypes.filter(
                                (t) => t !== type
                              ),
                            });
                          }
                        }}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                        {type.replace(/_/g, " ")}
                      </span>
                    </label>
                  )
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              About You
            </label>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              placeholder="Tell consumers about yourself, your experience, and what makes your services special..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

