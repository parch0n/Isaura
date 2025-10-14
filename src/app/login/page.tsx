"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

export default function Login() {
  const { login, ready, authenticated } = usePrivy();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Load theme from localStorage
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved === "dark" || (!saved && prefersDark) ? "dark" : "light";
    setTheme(initial);
  }, []);

  useEffect(() => {
    if (ready && authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  const handleLogin = () => {
    login();
  };

  if (!ready) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gradient-to-b from-slate-900 to-black" : "bg-gradient-to-b from-slate-50 to-slate-100"}`}>
        <div className="text-center">
          <div className="mx-auto h-10 w-10 rounded-xl flex items-center justify-center bg-indigo-600 text-white shadow-sm animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
              <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z" />
              <path d="M19 13l.5 1.5L21 15l-1.5.5L19 17l-.5-1.5L17 15l1.5-.5L19 13z" />
            </svg>
          </div>
          <p className={`text-sm mt-3 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-start justify-center pt-12 pb-8 px-4 sm:px-6 lg:px-8 ${theme === "dark" ? "bg-gradient-to-b from-slate-900 to-black" : "bg-gradient-to-b from-slate-50 to-slate-100"}`}>
      <div className="w-full max-w-md">
        <div className={`rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm border ${theme === "dark" ? "bg-slate-900/80 border-slate-700" : "bg-white/80 border-slate-200"}`}>
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="mx-auto h-10 w-10 rounded-xl flex items-center justify-center bg-indigo-600 text-white shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                  <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z" />
                  <path d="M19 13l.5 1.5L21 15l-1.5.5L19 17l-.5-1.5L17 15l1.5-.5L19 13z" />
                </svg>
              </div>
              <h1 className={`mt-3 text-2xl font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Welcome</h1>
              <p className={`text-sm mt-2 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Sign in with your email or connect your wallet</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              
              <div className={`text-xs text-center ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 inline-block mr-1 mb-0.5">
                  <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                </svg>
                Your wallet address is never stored. We only track wallets you explicitly add for portfolio monitoring.
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-6 text-center text-xs ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
          <p>Secured with Privy authentication</p>
        </div>
      </div>
    </div>
  );
}
