"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [wallets, setWallets] = useState<string[]>([]);
  const [newWallet, setNewWallet] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallets' | 'portfolio'>('wallets');
  const [defaultedTab, setDefaultedTab] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");
  const [portfolioTokens, setPortfolioTokens] = useState<Array<{ symbol: string; total: number; totalUSD: number; networks: string[]; logoURI?: string }>>([]);
  const [portfolioByWallet, setPortfolioByWallet] = useState<Record<string, Array<{ symbol: string; total: number; totalUSD: number; networks: string[]; logoURI?: string }>>>({});
  const [selectedWallet, setSelectedWallet] = useState<string>('__combined__');
  const [sortKey, setSortKey] = useState<'symbol' | 'totalUSD'>('totalUSD');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (key: 'symbol' | 'totalUSD') => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'symbol' ? 'asc' : 'desc');
    }
  };

  const TokenIcon = ({ symbol }: { symbol: string }) => {
    const sym = (symbol || '').toUpperCase();
    const label = sym.slice(0, 3) || '?';
    const bg = theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200';
    const fg = theme === 'dark' ? 'text-slate-100' : 'text-slate-800';
    return (
      <div className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-semibold ${bg} ${fg}`}>{label}</div>
    );
  };

  // Focus input when newWallet is cleared or wallets change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [newWallet, wallets]);

  // Keep selected wallet valid when wallets list changes
  useEffect(() => {
    if (selectedWallet !== '__combined__' && !wallets.includes(selectedWallet)) {
      setSelectedWallet('__combined__');
    }
  }, [wallets, selectedWallet]);

  

  useEffect(() => {
    if (activeTab !== 'portfolio') return;
    let cancelled = false;
    const load = async () => {
      setPortfolioLoading(true);
      setPortfolioError("");
      try {
        const res = await fetch('/api/user/portfolio', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load portfolio');
        if (!cancelled) {
          setPortfolioTokens(Array.isArray(data.tokens) ? data.tokens : []);
          setPortfolioByWallet(data.byWallet && typeof data.byWallet === 'object' ? data.byWallet : {});
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load portfolio';
        if (!cancelled) setPortfolioError(message);
      } finally {
        if (!cancelled) setPortfolioLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeTab]);

  const fetchWallets = useCallback(async () => {
    try {
      const res = await fetch("/api/user/wallets");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch wallets");
      }

      const list = Array.isArray(data.wallets) ? data.wallets : [];
      setWallets(list);
      // Decide default tab once after initial fetch
      if (!defaultedTab) {
        setActiveTab(list.length > 0 ? 'portfolio' : 'wallets');
        setDefaultedTab(true);
      }
    } catch (error) {
      console.error("Error fetching wallets:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch wallets");
    }
  }, [defaultedTab]);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    setUserEmail(email);
    fetchWallets();
  }, [fetchWallets]);

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

  const handleCopy = async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr);
      setCopied(addr);
      setTimeout(() => setCopied(null), 1200);
    } catch (e) {
      console.error("Copy failed", e);
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

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved === 'dark' || (!saved && prefersDark) ? 'dark' : 'light';
    setTheme(initial);
    if (initial === 'dark') document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className={`${theme === 'dark' ? 'min-h-screen bg-gradient-to-b from-slate-900 to-black' : 'min-h-screen bg-gradient-to-b from-slate-50 to-slate-100'} py-16 px-4 sm:px-6 lg:px-8 flex flex-col`}>
      <div className="flex-1">
        <div className="max-w-2xl mx-auto">
        {/* Page-level header with email on the left and actions on the right */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
              {userEmail ? (
                <span
                  className={`text-xs h-9 px-3 flex items-center rounded-md border max-w-[40vw] truncate ${
                    theme === 'dark'
                      ? 'text-slate-300 border-slate-700 bg-slate-900/60'
                      : 'text-slate-600 border-slate-200 bg-white/70'
                  }`}
                  style={{ minHeight: '2.25rem' }}
                  title={userEmail}
                >
                  {userEmail}
                </span>
              ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
            onClick={toggleTheme}
            className={`p-2 rounded-md border transition-colors cursor-pointer ${theme === 'dark' ? 'text-slate-200 border-slate-700 hover:bg-slate-800 bg-slate-900/60' : 'text-slate-600 border-slate-200 hover:bg-slate-100 bg-white/70'}`}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              // Sun icon
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            ) : (
              // Moon icon
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z"/></svg>
            )}
            </button>
            <button
            onClick={handleSignOut}
            className={`p-2 rounded-md border transition-colors cursor-pointer inline-flex items-center gap-2 ${theme === 'dark' ? 'text-slate-200 border-slate-700 hover:bg-slate-800 bg-slate-900/60' : 'text-slate-600 border-slate-200 hover:bg-slate-100 bg-white/70'}`}
            aria-label="Sign out"
            title="Sign out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M7.5 3.75A2.25 2.25 0 0 0 5.25 6v12A2.25 2.25 0 0 0 7.5 20.25h6a.75.75 0 0 0 0-1.5h-6a.75.75 0 0 1-.75-.75V6a.75.75 0 0 1 .75-.75h6a.75.75 0 0 0 0-1.5h-6z"/>
              <path d="M21 12l-4-4v3h-7v2h7v3l4-4z"/>
            </svg>
            <span className="sr-only">Sign out</span>
            </button>
          </div>
        </div>
        <div className={`relative rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm ${theme === 'dark' ? 'border border-slate-700 bg-slate-900/80' : 'border border-slate-200 bg-white/80'}`}>
          {/* Tab Menu as part of card */}
          <div className={`-mb-px flex items-stretch gap-0 border-b rounded-t-2xl overflow-hidden ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
            <button
              className={`flex-1 px-6 py-3 transition-colors focus:outline-none border-b-2 cursor-pointer ${activeTab === 'portfolio' ? (theme === 'dark' ? 'bg-slate-900 border-indigo-400 text-indigo-300 font-semibold shadow-sm' : 'bg-white border-indigo-600 text-indigo-700 font-semibold shadow-sm') : (theme === 'dark' ? 'bg-slate-800 border-transparent text-slate-300 hover:text-indigo-300' : 'bg-slate-100 border-transparent text-slate-600 hover:text-indigo-700')}`}
              onClick={() => setActiveTab('portfolio')}
            >
              Portfolio
            </button>
            <button
              className={`flex-1 px-6 py-3 transition-colors focus:outline-none border-b-2 cursor-pointer ${activeTab === 'wallets' ? (theme === 'dark' ? 'bg-slate-900 border-indigo-400 text-indigo-300 font-semibold shadow-sm' : 'bg-white border-indigo-600 text-indigo-700 font-semibold shadow-sm') : (theme === 'dark' ? 'bg-slate-800 border-transparent text-slate-300 hover:text-indigo-300' : 'bg-slate-100 border-transparent text-slate-600 hover:text-indigo-700')}`}
              onClick={() => setActiveTab('wallets')}
            >
              Wallets
            </button>
          </div>
          {/* Card Content */}
          <div className={`p-8 rounded-b-2xl ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
            {/* Removed welcome header and email paragraph; email is shown in header */}
            {activeTab === 'wallets' && (
              <>
                {/* EVM Wallets Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>Your Wallets</h2>
                    <span className={`text-xs rounded-full px-2 py-1 ${theme === 'dark' ? 'text-slate-300 bg-slate-800 border border-slate-700' : 'text-slate-500 bg-slate-100 border border-slate-200'}`}>{wallets.length}/10</span>
                  </div>
                  {/* Add new wallet form */}
                  <form onSubmit={handleAddWallet} className="mb-3">
                    <div className="flex gap-2 w-full">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newWallet}
                        onChange={(e) => setNewWallet(e.target.value)}
                        placeholder="Enter Wallet (0x...)"
                        className={`w-full px-3 py-2 rounded-md text-sm ring-1 ring-transparent focus:ring-2 focus:border-indigo-500 shadow-sm placeholder-slate-400 ${theme === 'dark' ? 'bg-slate-800 border border-slate-700 focus:ring-indigo-400 text-slate-100' : 'bg-white border border-slate-200 focus:ring-indigo-500 text-slate-900'}`}
                        pattern="^0x[a-fA-F0-9]{40}$"
                        required
                        disabled={loading || wallets.length >= 10}
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={loading || wallets.length >= 10}
                        className={`px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-400 focus:ring-offset-slate-900' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'}`}
                      >
                        Add
                      </button>
                    </div>
                  </form>
                  <div className="space-y-2">
                    {error && (
                      <div role="alert" className={`mt-1 text-sm rounded-md p-3 border ${theme === 'dark' ? 'text-rose-300 bg-rose-950/40 border-rose-900' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                        {error}
                      </div>
                    )}
                    {wallets.length >= 10 && (
                      <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`}>Maximum number of wallets (10) reached</p>
                    )}
                  </div>
                </div>
                {/* Wallets list */}
                <div className="space-y-2">
                  {wallets.length === 0 ? (
                    <div className={`text-sm rounded-lg p-4 border border-dashed ${theme === 'dark' ? 'text-slate-400 bg-slate-800 border-slate-700' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>No wallets added yet. Add your first one above.</div>
                  ) : (
                    wallets.map((wallet) => (
                      <div
                        key={wallet}
                        className={`flex items-center justify-between transition-colors p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-800 border border-slate-700 hover:border-indigo-500 hover:bg-indigo-950/20' : 'bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'}`}
                      >
                        <code className={`font-mono text-sm break-all ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{wallet}</code>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopy(wallet)}
                            disabled={loading}
                            className={`p-1 rounded-md focus:outline-none cursor-pointer disabled:cursor-not-allowed ${copied === wallet ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : (theme === 'dark' ? 'text-slate-400 hover:text-indigo-300 hover:bg-slate-700' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-100')}`}
                            title={copied === wallet ? 'Copied!' : 'Copy address'}
                            aria-label="Copy address"
                          >
                            {copied === wallet ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M9 12.75 10.5 14.25 15 9.75 16.5 11.25 10.5 17.25 7.5 14.25 9 12.75z" clipRule="evenodd"/></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                <rect x="9" y="9" width="10" height="12" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => handleRemoveWallet(wallet)}
                            disabled={loading}
                            className={`p-1 rounded-md focus:outline-none cursor-pointer disabled:cursor-not-allowed ${theme === 'dark' ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-700' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-100'}`}
                            title="Remove wallet"
                            aria-label="Remove wallet"
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
                      </div>
                    ))
                  )}
                </div>
                {/* Removed big sign out button; using compact header action instead */}
              </>
            )}
            {activeTab === 'portfolio' && (
              <div className="mb-6">
                <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>Portfolio</h2>
                {wallets.length === 0 ? (
                  <div className={`rounded-lg p-6 border ${theme === 'dark' ? 'text-slate-300 bg-slate-900/60 border-slate-700' : 'text-slate-700 bg-white/70 border-slate-200'}`}>
                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>You don’t have any wallets yet.</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Add wallet addresses from the Wallets tab to see your portfolio.</p>
                      </div>
                      <button
                        onClick={() => { setActiveTab('wallets'); setTimeout(() => inputRef.current?.focus(), 0); }}
                        className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer border ${theme === 'dark' ? 'text-indigo-300 border-slate-700 bg-slate-900/60 hover:bg-slate-800' : 'text-indigo-700 border-slate-200 bg-white/70 hover:bg-slate-100'}`}
                      >
                        Go to Wallets
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                  {/* Wallet selector */}
                  <div className="mb-3 flex items-center gap-2">
                    <label className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>View:</label>
                    <select
                      value={selectedWallet}
                      onChange={(e) => setSelectedWallet(e.target.value)}
                      className={`text-sm px-2 py-2 rounded-md border ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}
                    >
                      <option value="__combined__">Combined (All Wallets)</option>
                      {wallets.map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                {portfolioLoading ? (
                  <div className={`rounded-lg p-6 flex items-center justify-center gap-3 ${theme === 'dark' ? 'text-slate-300 bg-slate-800 border border-slate-700' : 'text-slate-600 bg-slate-50 border border-slate-200'}`}>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                    Loading portfolio...
                  </div>
                ) : portfolioError ? (
                  <div role="alert" className={`rounded-md p-3 border ${theme === 'dark' ? 'text-rose-300 bg-rose-950/40 border-rose-900' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>{portfolioError}</div>
                ) : portfolioTokens.length === 0 ? (
                  <div className={`rounded-lg p-6 border border-dashed ${theme === 'dark' ? 'text-slate-400 bg-slate-800 border-slate-700' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>No balances found for the added wallets.</div>
                ) : (
                  <>
                    {(() => {
                      const rows = selectedWallet === '__combined__' ? portfolioTokens : (portfolioByWallet[selectedWallet] || []);
                      const totalUSD = rows.reduce((acc, t) => acc + (t.totalUSD || 0), 0);
                      const tokenCount = rows.length;
                      const uniqueNetworks = new Set<string>();
                      rows.forEach((t) => (t.networks || []).forEach((n) => uniqueNetworks.add(n)));
                      const networksCount = uniqueNetworks.size;
                      return (
                        <div className={`mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2`}>
                          <div className={`rounded-md px-3 py-2 border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-700 text-slate-200' : 'bg-white/70 border-slate-200 text-slate-800'}`}>
                            <div className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Total Value</div>
                            <div className="text-base font-semibold">{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(totalUSD)}</div>
                          </div>
                          <div className={`rounded-md px-3 py-2 border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-700 text-slate-200' : 'bg-white/70 border-slate-200 text-slate-800'}`}>
                            <div className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Tokens</div>
                            <div className="text-base font-semibold">{tokenCount}</div>
                          </div>
                          <div className={`rounded-md px-3 py-2 border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-700 text-slate-200' : 'bg-white/70 border-slate-200 text-slate-800'}`}>
                            <div className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Networks</div>
                            <div className="text-base font-semibold">{networksCount}</div>
                          </div>
                        </div>
                      );
                    })()}
                    {(() => {
                      const rows = selectedWallet === '__combined__' ? portfolioTokens : (portfolioByWallet[selectedWallet] || []);
                      // Apply sorting
                      const dir = sortDir === 'asc' ? 1 : -1;
                      const rowsSorted = [...rows].sort((a, b) => {
                        if (sortKey === 'symbol') return dir * a.symbol.localeCompare(b.symbol);
                        return dir * ((a.totalUSD || 0) - (b.totalUSD || 0));
                      });
                      if (rows.length === 0) {
                        return (
                          <div className={`rounded-lg p-6 border border-dashed ${theme === 'dark' ? 'text-slate-400 bg-slate-800 border-slate-700' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                            No balances found for this selection.
                          </div>
                        );
                      }
                      return (
                        <>
                        <div className={`overflow-hidden rounded-lg border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                      <table className={`w-full text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                      <thead className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`}>
                        <tr>
                            <th className="text-left px-4 py-3 font-semibold select-none">
                              <button type="button" onClick={() => toggleSort('symbol')} className={`inline-flex items-center gap-1 cursor-pointer ${theme === 'dark' ? 'hover:text-indigo-300' : 'hover:text-indigo-700'}`}>
                                Token
                                {sortKey === 'symbol' && (
                                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    {sortDir === 'asc' ? (
                                      <path d="M7 14l5-5 5 5H7z" />
                                    ) : (
                                      <path d="M7 10l5 5 5-5H7z" />
                                    )}
                                  </svg>
                                )}
                              </button>
                            </th>
                          <th className="text-right px-4 py-3 font-semibold">Total</th>
                            <th className="text-right px-4 py-3 font-semibold select-none">
                              <button type="button" onClick={() => toggleSort('totalUSD')} className={`inline-flex items-center gap-1 cursor-pointer ${theme === 'dark' ? 'hover:text-indigo-300' : 'hover:text-indigo-700'}`}>
                                Value (USD)
                                {sortKey === 'totalUSD' && (
                                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    {sortDir === 'asc' ? (
                                      <path d="M7 14l5-5 5 5H7z" />
                                    ) : (
                                      <path d="M7 10l5 5 5-5H7z" />
                                    )}
                                  </svg>
                                )}
                              </button>
                            </th>
                          <th className="text-left px-4 py-3 font-semibold">Networks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rowsSorted.map((t) => (
                          <tr key={t.symbol} className={`${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} border-t hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {t.logoURI ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={t.logoURI} alt={t.symbol} className="h-6 w-6 rounded-md object-cover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" onError={(ev) => { (ev.currentTarget as HTMLImageElement).style.display = 'none'; (ev.currentTarget.nextSibling as HTMLElement)?.classList.remove('hidden'); }} />
                                ) : null}
                                <div className={t.logoURI ? 'hidden' : ''}>
                                  <TokenIcon symbol={t.symbol} />
                                </div>
                                <span className={`${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{t.symbol}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums">{new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(t.total)}</td>
                            <td className="px-4 py-3 text-right tabular-nums font-medium">{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(t.totalUSD)}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {t.networks.map((n) => (
                                  <span key={n} className={`text-[10px] px-2 py-0.5 rounded-full border ${theme === 'dark' ? 'text-slate-200 border-slate-700 bg-slate-800' : 'text-slate-700 border-slate-200 bg-slate-100'}`}>
                                    {n}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                        </div>

                        {(() => {
                          // Build allocation data from current rows
                          const total = rows.reduce((acc, r) => acc + (r.totalUSD || 0), 0);
                          if (!total || total <= 0) return null;
                          // Limit to top 8 and group the rest as Others
                          const top = [...rows].sort((a, b) => (b.totalUSD || 0) - (a.totalUSD || 0)).slice(0, 8);
                          const rest = rows.slice(8);
                          const othersUSD = rest.reduce((acc, r) => acc + (r.totalUSD || 0), 0);
                          type Seg = { label: string; value: number; color: string };
                          const palette = ['#6366F1','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#84CC16','#F97316','#14B8A6','#E11D48'];
                          const baseSegs: Seg[] = top.map((r, i) => ({ label: r.symbol, value: r.totalUSD || 0, color: palette[i % palette.length] }));
                          const threshold = 0.01; // 1% of total
                          let smallSum = 0;
                          const kept: Seg[] = [];
                          for (const s of baseSegs) {
                            const pct = total > 0 ? s.value / total : 0;
                            if (pct < threshold) smallSum += s.value; else kept.push(s);
                          }
                          const othersCombined = othersUSD + smallSum;
                          const segsDisplay: Seg[] = [...kept];
                          if (othersCombined / total >= threshold) {
                            segsDisplay.push({ label: 'Others', value: othersCombined, color: palette[segsDisplay.length % palette.length] });
                          }
                          // Build conic-gradient string
                          let start = 0;
                          const parts: string[] = [];
                          segsDisplay.forEach((s) => {
                            const angle = (s.value / total) * 360;
                            parts.push(`${s.color} ${start}deg ${start + angle}deg`);
                            start += angle;
                          });
                          const gradient = `conic-gradient(${parts.join(',')})`;

                          return (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                              <div className={`mx-auto relative h-40 w-40 rounded-full`} style={{ backgroundImage: gradient }}>
                                <div className={`absolute inset-4 rounded-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'} border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className={`text-center ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                    <div className="text-[11px] opacity-70">Allocation</div>
                                    <div className="text-sm font-semibold">{new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 }).format(1)}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="sm:col-span-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {segsDisplay.map((s) => {
                                    const pct = s.value / total;
                                    return (
                                      <div key={s.label} className={`flex items-center justify-between rounded-md px-3 py-2 border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-700' : 'bg-white/70 border-slate-200'}`}>
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: s.color }}></span>
                                          <span className={`text-sm truncate ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{s.label}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className={`text-sm tabular-nums ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 }).format(pct)}</span>
                                          <span className={`text-xs tabular-nums ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(s.value)}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        </>
                      );
                    })()}
                  </>
                )}
                </>
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      {/* Sticky Footer at bottom */}
      <footer className="mt-auto">
        <div className="max-w-2xl mx-auto">
          <p className={`text-xs text-center ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
            Powered by{' '}
            <a
              href="https://www.adex.network/blog/introducing-adex-aura/"
              target="_blank"
              rel="noopener noreferrer"
              className={`${theme === 'dark' ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-700 hover:text-indigo-800'} underline underline-offset-2`}
            >
              AdEx Aura
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
