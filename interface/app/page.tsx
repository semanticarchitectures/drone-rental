"use client";

import { useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { primaryWallet, user } = useDynamicContext();
  const isAuthenticated = !!primaryWallet || !!user;
  const { address } = useAccount();
  const router = useRouter();

  // Redirect authenticated users to login page (which will then redirect to dashboard)
  useEffect(() => {
    const checkAndRedirect = async () => {
      const walletAddr = address || primaryWallet?.address;
      if (isAuthenticated && walletAddr) {
        // Check if user exists in database
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
            // User authenticated but no user type, go to login to select
            router.push("/login");
          }
        } catch (error) {
          // If error, still redirect to login
          router.push("/login");
        }
      }
    };

    checkAndRedirect();
  }, [isAuthenticated, address, primaryWallet, router]);
  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="relative max-w-6xl mx-auto text-center z-10">
          <div className="animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-8">
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                ✨ Blockchain-Powered Drone Marketplace
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
              Professional Drone
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Services On-Demand
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect with certified drone operators worldwide. Submit requests, receive competitive bids, 
              and secure payments through smart contract escrow—all with complete transparency.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/login"
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <span className="relative z-10">Get Started Free</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              
              <a
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold rounded-xl hover:shadow-lg transition-all duration-300 border-2 border-gray-200 dark:border-gray-700"
              >
                Learn More
              </a>
            </div>
            
            <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Blockchain Secured</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Instant Payouts</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Global Network</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                100%
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Secure Escrow</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Platform Access</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                0%
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Hidden Fees</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                ∞
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Opportunities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Built for <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Professionals</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Industry-leading platform combining blockchain security with seamless user experience
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-animation">
            <div className="card-professional hover-lift group">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Smart Contract Escrow
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Funds locked in blockchain escrow until delivery. Automatic release upon approval, with built-in dispute resolution for complete protection.
              </p>
            </div>

            <div className="card-professional hover-lift group">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Competitive Marketplace
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Post requests and receive multiple bids. Compare pricing, timelines, and provider ratings to choose the perfect match for your needs.
              </p>
            </div>

            <div className="card-professional hover-lift group">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Location Intelligence
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Advanced mapping shows provider coverage areas and consumer demand zones. Find operators exactly where you need them.
              </p>
            </div>

            <div className="card-professional hover-lift group">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Verified Ratings
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Transparent rating system based on completed jobs. Build your reputation or hire with confidence using verified track records.
              </p>
            </div>

            <div className="card-professional hover-lift group">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Fair Dispute System
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Independent arbitration for any disputes. Smart contracts ensure fair outcomes and protect both consumers and providers.
              </p>
            </div>

            <div className="card-professional hover-lift group">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Blockchain Powered
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Built on Ethereum-compatible networks. Transparent, immutable transactions without intermediaries or hidden fees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="relative max-w-4xl mx-auto text-center z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Drone Services?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join thousands of consumers and providers leveraging blockchain technology for secure, transparent drone service transactions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-10 py-5 bg-white text-indigo-600 text-lg font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:scale-105"
            >
              Start Now - It's Free
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          <p className="mt-6 text-indigo-200 text-sm">
            No credit card required • Connect with Web3 wallet • Get started in 60 seconds
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">Drone Service Brokerage</h3>
            <p className="text-sm">Powered by blockchain technology</p>
          </div>
          <div className="border-t border-gray-800 pt-6">
            <p className="text-sm">
              © {new Date().getFullYear()} Drone Service Brokerage. Built on Ethereum.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
