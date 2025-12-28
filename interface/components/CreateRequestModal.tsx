"use client";

import { useState, useEffect } from "react";
import CoverageMap from "@/components/map/CoverageMap";

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    title: string;
    description: string;
    budget: string;
    deadline: string;
    location: [number, number] | null;
  }) => void;
  isPending?: boolean;
  isConfirming?: boolean;
}

export default function CreateRequestModal({
  isOpen,
  onClose,
  onSubmit,
  isPending = false,
  isConfirming = false,
}: CreateRequestModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: "",
  });
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: "",
        description: "",
        budget: "",
        deadline: "",
      });
      setSelectedLocation(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      location: selectedLocation,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Create New Request
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
            aria-label="Close"
            disabled={isPending || isConfirming}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                disabled={isPending || isConfirming}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                required
                disabled={isPending || isConfirming}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Budget (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  disabled={isPending || isConfirming}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  disabled={isPending || isConfirming}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Select Location (click on map)
              </label>
              <div className="h-64 mb-4">
                <CoverageMap
                  center={[40.7128, -74.0060]}
                  onLocationSelect={(lat, lng) => setSelectedLocation([lat, lng])}
                  selectedLocation={selectedLocation}
                />
              </div>
              {selectedLocation ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Selected: {selectedLocation[0].toFixed(4)}, {selectedLocation[1].toFixed(4)}
                </p>
              ) : (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ No location selected. Will use default location (NYC). Click on the map to select a specific location.
                </p>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending || isConfirming}
              className="px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isPending ||
                isConfirming ||
                !formData.title ||
                !formData.description ||
                !formData.budget ||
                !formData.deadline
              }
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isPending || isConfirming ? "Processing..." : "Create Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

