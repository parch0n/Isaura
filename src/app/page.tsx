"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [wallets, setWallets] = useState<string[]>([]);
  const [newWallet, setNewWallet] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when newWallet is cleared or wallets change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [newWallet, wallets]);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    setUserEmail(email);
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const res = await fetch("/api/user/wallets");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch wallets");
      }

      setWallets(Array.isArray(data.wallets) ? data.wallets : []);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch wallets");
    }
  };

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/user/wallets/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: newWallet }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add wallet");
      }

      setWallets(data.wallets);
      setNewWallet("");
      // Re-focus the input field
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error adding wallet:", error);
      setError(error instanceof Error ? error.message : "Failed to add wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWallet = async (wallet: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/user/wallets/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove wallet");
      }

      setWallets(data.wallets);
      // Re-focus the input field after removing a wallet
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error removing wallet:", error);
      setError(error instanceof Error ? error.message : "Failed to remove wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to logout");
      }

      // Clear local storage
      localStorage.removeItem("userEmail");

      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Welcome!</h1>
          {userEmail && (
            <p className="text-gray-600 mb-6">
              You are logged in as:{" "}
              <span className="font-medium text-gray-900">{userEmail}</span>
            </p>
          )}

          {/* EVM Wallets Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Your Wallets</h2>
            
            {/* Add new wallet form */}
            <form onSubmit={handleAddWallet} className="mb-4">
              <div className="flex gap-2 w-full">
                <input
                  ref={inputRef}
                  type="text"
                  value={newWallet}
                  onChange={(e) => setNewWallet(e.target.value)}
                  placeholder="Enter Wallet (0x...)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500"
                  pattern="^0x[a-fA-F0-9]{40}$"
                  required
                  disabled={loading || wallets.length >= 10}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || wallets.length >= 10}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              {wallets.length >= 10 && (
                <p className="mt-2 text-sm text-red-600">
                  Maximum number of wallets (10) reached
                </p>
              )}
            </form>

            {/* Wallets list */}
            <div className="space-y-2">
              {wallets.length === 0 ? (
                <p className="text-gray-500 text-sm">No wallets added yet</p>
              ) : (
                wallets.map((wallet) => (
                  <div
                    key={wallet}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                  >
                    <code className="text-sm break-all text-gray-900">{wallet}</code>
                    <button
                      onClick={() => handleRemoveWallet(wallet)}
                      disabled={loading}
                      className="ml-2 p-1 text-gray-500 hover:text-red-600 focus:outline-none cursor-pointer disabled:cursor-not-allowed"
                      title="Remove wallet"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Error message */}
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
