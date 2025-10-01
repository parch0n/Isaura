"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get email from localStorage that we saved during login
    const email = localStorage.getItem("userEmail");
    setUserEmail(email);
  }, []);

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
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Welcome!</h1>
          {userEmail && (
            <p className="text-gray-600 mb-6">
              You are logged in as:{" "}
              <span className="font-medium">{userEmail}</span>
            </p>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
