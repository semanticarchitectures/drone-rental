"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

interface UserAvatarProps {
  onProfileClick?: () => void;
  onLogout?: () => void;
  profileImageUrl?: string | null;
}

export default function UserAvatar({ onProfileClick, onLogout, profileImageUrl }: UserAvatarProps) {
  const { address } = useAccount();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  const handleAvatarClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      // Default: navigate to provider dashboard to edit profile
      router.push("/dashboard/provider");
    }
    setShowMenu(false);
  };

  const getInitials = () => {
    if (!address) return "?";
    // Use last 4 characters of address as initials
    return address.slice(-4).toUpperCase();
  };

  if (!address) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-10 h-10 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 overflow-hidden border-2 border-white dark:border-gray-800"
        aria-label="User menu"
      >
        {profileImageUrl && !imageError ? (
          <img
            src={profileImageUrl}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-sm">{getInitials()}</span>
        )}
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
          <button
            onClick={handleAvatarClick}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Edit Profile
          </button>
          {onLogout && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              <button
                onClick={() => {
                  onLogout();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </>
          )}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        </div>
      )}
    </div>
  );
}

