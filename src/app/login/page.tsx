"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <Image src="/logo.png" alt="Isaura" width={128} height={128} className="h-32 w-auto" />
          </div>
          <h1
            className={`text-5xl font-black mb-8 tracking-tight bg-gradient-to-r ${theme === "dark" ? "from-indigo-400 to-purple-400" : "from-indigo-600 to-purple-600"} bg-clip-text text-transparent font-[family-name:var(--font-urbanist)] select-none cursor-default`}
            tabIndex={-1}
            aria-label="Isaura logo text"
          >
            Isaura
          </h1>
          <p className={`text-base font-normal mb-2 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
            Track your entire crypto portfolio across multiple wallets and networks
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium select-none cursor-default ${theme === "dark" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              Encrypted & Secure
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium select-none cursor-default ${theme === "dark" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
              </svg>
              Multi-Chain Support
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium select-none cursor-default ${theme === "dark" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm2.293 5.293a1 1 0 011.414 1.414l-4.5 4.5a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 11.086l3.293-3.293z" />
              </svg>
              AI-Powered Portfolio Strategies
            </span>
          </div>
        </div>

        {/* Login Card */}
        <div className={`rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm border ${theme === "dark" ? "bg-slate-900/80 border-slate-700" : "bg-white/80 border-slate-200"}`}>
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className={`text-xl font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Welcome</h2>
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
                Your login credentials are never stored, and any wallets you track are encrypted for your privacy and security.
              </div>
            </div>
          </div>
        </div>

        {/* Powered by Privy label */}
        <div className={`mt-6 text-center text-xs font-medium ${theme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
            Powered by{' '}
            <a
              href="https://www.adex.network/blog/introducing-adex-aura/"
              target="_blank"
              rel="noopener noreferrer"
              className={`${theme === "dark" ? "text-indigo-300 hover:text-indigo-200" : "text-indigo-700 hover:text-indigo-800"} underline underline-offset-2`}
            >
              AdEx Aura
            </a>
        </div>
      </div>
    </div>
  );
}
