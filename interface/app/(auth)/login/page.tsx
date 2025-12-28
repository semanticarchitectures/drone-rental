"use client";

import { useState, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const dynamicContext = useDynamicContext();
  const { setShowAuthFlow, user, primaryWallet } = dynamicContext;
  // Check authentication via primaryWallet or user
  const isAuthenticated = !!primaryWallet || !!user;
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [userType, setUserType] = useState<"consumer" | "provider" | "both" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  // Check if user already exists in database
  useEffect(() => {
    const checkExistingUser = async () => {
      const walletAddr = address || primaryWallet?.address;
      
      if (isAuthenticated && walletAddr) {
        try {
          const response = await fetch(`/api/users?walletAddress=${walletAddr}`);
          const data = await response.json();
          
          if (data.user && data.user.userType) {
            // User exists, redirect to appropriate dashboard
            if (data.user.userType === "consumer" || data.user.userType === "both") {
              router.push("/dashboard/consumer");
            } else if (data.user.userType === "provider") {
              router.push("/dashboard/provider");
            }
          } else {
            // User doesn't exist yet, show user type selection
            setIsCheckingUser(false);
          }
        } catch (error) {
          console.error("Error checking user:", error);
          setIsCheckingUser(false);
        }
      } else {
        setIsCheckingUser(false);
      }
    };

    checkExistingUser();
  }, [isAuthenticated, address, primaryWallet, router]);

  useEffect(() => {
    if (isAuthenticated && address && userType && !isSubmitting) {
      handleUserTypeSubmit();
    }
  }, [isAuthenticated, address, userType]);

  const handleUserTypeSubmit = async () => {
    const walletAddr = address || primaryWallet?.address;
    if (!walletAddr || !userType || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address || primaryWallet?.address,
          userType,
        }),
      });

      if (response.ok) {
        // Redirect based on user type
        if (userType === "consumer") {
          router.push("/dashboard/consumer");
        } else if (userType === "provider") {
          router.push("/dashboard/provider");
        } else {
          router.push("/dashboard/consumer"); // Default to consumer for "both"
        }
      }
    } catch (error) {
      console.error("Error saving user type:", error);
      setIsSubmitting(false);
    }
  };

  const handleConnect = () => {
    // Use setShowAuthFlow to open the Dynamic auth modal
    setShowAuthFlow(true);
  };

  // Show loading while checking user
  if (isCheckingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-subtle px-4">
        <div className="max-w-md w-full card-professional shadow-professional-xl p-10 animate-scale-in">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 animate-spin" style={{ animationDuration: '1.5s' }}>
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-xl"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Authenticating
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Please wait while we verify your credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get address from Dynamic or Wagmi
  const walletAddress = address || primaryWallet?.address;

  if (!isAuthenticated || !walletAddress) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-subtle px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="max-w-md w-full relative z-10 animate-fade-in">
          <div className="card-professional shadow-professional-xl p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Connect Your Wallet
              </h1>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Secure access to the drone service marketplace via Web3 authentication
              </p>
            </div>
            
            <button
              onClick={handleConnect}
              className="group w-full relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg mb-4"
            >
              <span className="flex items-center justify-center">
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Connect with Web3
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                or use the Dynamic widget in the top right corner
              </p>
              
              <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Secured by blockchain technology
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              New to Web3? {" "}
              <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                Learn more about wallet setup
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (userType === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-subtle px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="max-w-2xl w-full relative z-10 animate-fade-in">
          <div className="card-professional shadow-professional-xl p-10">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Choose Your Path
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                Select how you want to use the platform. You can always switch roles later.
              </p>
            </div>
            
            <div className="space-y-4 stagger-animation">
              <button
                onClick={() => setUserType("consumer")}
                className="group w-full text-left p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold">Consumer</h3>
                    </div>
                    <p className="text-indigo-100 leading-relaxed">
                      Request professional drone services, receive competitive bids, and manage projects with secure escrow payments.
                    </p>
                  </div>
                  <svg className="w-6 h-6 ml-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              
              <button
                onClick={() => setUserType("provider")}
                className="group w-full text-left p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold">Provider</h3>
                    </div>
                    <p className="text-emerald-100 leading-relaxed">
                      Offer your drone expertise, bid on jobs, showcase your portfolio, and earn from completed missions.
                    </p>
                  </div>
                  <svg className="w-6 h-6 ml-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              
              <button
                onClick={() => setUserType("both")}
                className="group w-full text-left p-6 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold">Both Roles</h3>
                    </div>
                    <p className="text-purple-100 leading-relaxed">
                      Get full platform access to both request services and offer your expertise as a provider.
                    </p>
                  </div>
                  <svg className="w-6 h-6 ml-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4 inline mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Your selection can be changed anytime from your dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle px-4">
      <div className="max-w-md w-full card-professional shadow-professional-xl p-10 animate-scale-in">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 animate-spin" style={{ animationDuration: '1.5s' }}>
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-xl"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {isSubmitting ? "Setting Up Your Account" : "Redirecting"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isSubmitting ? "Creating your profile..." : "Taking you to your dashboard..."}
          </p>
        </div>
      </div>
    </div>
  );
}

