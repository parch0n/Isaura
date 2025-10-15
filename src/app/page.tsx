"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { usePrivyAuth } from "@/lib/usePrivyAuth";
import type { Strategy } from "@/types/aura";

export default function Home() {
  const { user, logout: privyLogout, getAuthHeaders, ready, authenticated, synced } = usePrivyAuth();
  const [wallets, setWallets] = useState<string[]>([]);
  const [newWallet, setNewWallet] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "wallets" | "portfolio" | "strategies"
  >("wallets");
  const [defaultedTab, setDefaultedTab] = useState(false);
  const hasFetchedWallets = useRef(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [themeReady, setThemeReady] = useState(false);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [btcChange, setBtcChange] = useState<number | null>(null);
  const [ethChange, setEthChange] = useState<number | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");
  const [portfolioTokens, setPortfolioTokens] = useState<
    Array<{
      symbol: string;
      total: number;
      totalUSD: number;
      networks: string[];
      logoURI?: string;
    }>
  >([]);
  const [portfolioByWallet, setPortfolioByWallet] = useState<
    Record<
      string,
      Array<{
        symbol: string;
        total: number;
        totalUSD: number;
        networks: string[];
        logoURI?: string;
      }>
    >
  >({});

  // Strategies state
  const [strategiesLoading, setStrategiesLoading] = useState(false);
  const [strategiesError, setStrategiesError] = useState("");
  const [strategiesByWallet, setStrategiesByWallet] = useState<
    Record<string, Strategy[]>
  >({});
  const [combinedStrategies, setCombinedStrategies] = useState<Strategy[]>([]);

  const [selectedWallet, setSelectedWallet] = useState<string>("__combined__");
  const [selectedWalletStrategies, setSelectedWalletStrategies] =
    useState<string>("__combined__");
  const [sortKey, setSortKey] = useState<"symbol" | "totalUSD">("totalUSD");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [strategiesMenuOpen, setStrategiesMenuOpen] = useState(false);
  const walletMenuRef = useRef<HTMLDivElement>(null);
  const strategiesMenuRef = useRef<HTMLDivElement>(null);

  const displayWalletLabel = (w: string) => {
    // Return full address without shortening
    return w;
  };

  const shortenAddress = (address: string): string => {
    // Shorten wallet address (e.g., "0x1234...5678")
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const maskEmail = (email: string): string => {
    // Mask email for privacy (e.g., "abc***xyz@example.com")
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;
    
    // If local part is too short (6 or less), show first char + ***
    if (localPart.length <= 6) {
      const firstChar = localPart.substring(0, 1);
      return `${firstChar}***@${domain}`;
    }
    
    const firstThree = localPart.substring(0, 3);
    const lastThree = localPart.substring(localPart.length - 3);
    return `${firstThree}***${lastThree}@${domain}`;
  };

  const capitalize = (s?: string) => {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const toggleSort = (key: "symbol" | "totalUSD") => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "symbol" ? "asc" : "desc");
    }
  };

  const formatLargeNumber = (value: number): string => {
    const absValue = Math.abs(value);
    
    if (absValue >= 1_000_000_000) {
      // Billions
      const billions = value / 1_000_000_000;
      return `$${new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(billions)}B`;
    } else if (absValue >= 1_000_000) {
      // Millions
      const millions = value / 1_000_000;
      return `$${new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(millions)}M`;
    } else {
      // Less than a million, use regular formatting
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(value);
    }
  };

  const formatTokenCount = (value: number, totalUSD?: number): string => {
    const absValue = Math.abs(value);
    
    if (absValue >= 1_000_000_000) {
      // Billions
      const billions = value / 1_000_000_000;
      return `${new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(billions)}B`;
    } else if (absValue >= 1_000_000) {
      // Millions
      const millions = value / 1_000_000;
      return `${new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(millions)}M`;
    } else {
      // Calculate price per token
      const pricePerToken = totalUSD !== undefined && value !== 0 ? totalUSD / value : 0;
      // For tokens cheaper than $5000 per token, use max 3 decimals
      // Otherwise use up to 6 decimals
      const isCheapToken = pricePerToken < 5000;
      const maxDecimals = isCheapToken ? 3 : 6;
      
      return new Intl.NumberFormat(undefined, {
        maximumFractionDigits: maxDecimals,
      }).format(value);
    }
  };

  const TokenIcon = ({ symbol }: { symbol: string }) => {
    const sym = (symbol || "").toUpperCase();
    const label = sym.slice(0, 3) || "?";
    const bg = theme === "dark" ? "bg-slate-700" : "bg-slate-200";
    const fg = theme === "dark" ? "text-slate-100" : "text-slate-800";
    return (
      <div
        className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-semibold ${bg} ${fg}`}
      >
        {label}
      </div>
    );
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return theme === "dark"
          ? "text-green-400 bg-green-900/20 border-green-800"
          : "text-green-700 bg-green-50 border-green-200";
      case "moderate":
        return theme === "dark"
          ? "text-yellow-400 bg-yellow-900/20 border-yellow-800"
          : "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "high":
        return theme === "dark"
          ? "text-red-400 bg-red-900/20 border-red-800"
          : "text-red-700 bg-red-50 border-red-200";
      case "opportunistic":
        return theme === "dark"
          ? "text-purple-400 bg-purple-900/20 border-purple-800"
          : "text-purple-700 bg-purple-50 border-purple-200";
      default:
        return theme === "dark"
          ? "text-slate-400 bg-slate-900/20 border-slate-700"
          : "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  // Focus input when newWallet is cleared or wallets change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [newWallet, wallets]);

  // Keep selected wallet valid when wallets list changes
  useEffect(() => {
    if (
      selectedWallet !== "__combined__" &&
      !wallets.includes(selectedWallet)
    ) {
      setSelectedWallet("__combined__");
    }
  }, [wallets, selectedWallet]);

  useEffect(() => {
    if (
      selectedWalletStrategies !== "__combined__" &&
      !wallets.includes(selectedWalletStrategies)
    ) {
      setSelectedWalletStrategies("__combined__");
    }
  }, [wallets, selectedWalletStrategies]);

  useEffect(() => {
    if (activeTab !== "portfolio") return;
    let cancelled = false;
    const load = async () => {
      setPortfolioLoading(true);
      setPortfolioError("");
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/user/portfolio", { 
          cache: "no-store",
          headers 
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load portfolio");
        if (!cancelled) {
          setPortfolioTokens(Array.isArray(data.tokens) ? data.tokens : []);
          setPortfolioByWallet(
            data.byWallet && typeof data.byWallet === "object"
              ? data.byWallet
              : {},
          );
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to load portfolio";
        if (!cancelled) setPortfolioError(message);
      } finally {
        if (!cancelled) setPortfolioLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab, getAuthHeaders]);

  // Fetch strategies when strategies tab is active
  useEffect(() => {
    if (activeTab !== "strategies") return;
    let cancelled = false;
    const load = async () => {
      setStrategiesLoading(true);
      setStrategiesError("");
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/user/strategies", { 
          cache: "no-store",
          headers 
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || "Failed to load strategies");
        if (!cancelled) {
          setStrategiesByWallet(
            data.byWallet && typeof data.byWallet === "object"
              ? data.byWallet
              : {},
          );
          setCombinedStrategies(
            Array.isArray(data.combined) ? data.combined : [],
          );
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to load strategies";
        if (!cancelled) setStrategiesError(message);
      } finally {
        if (!cancelled) setStrategiesLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab, getAuthHeaders]);

  const fetchWallets = useCallback(async () => {
    if (hasFetchedWallets.current) return; // Prevent multiple fetches on initial load
    hasFetchedWallets.current = true;
    
    try {
      setWalletsLoading(true);
      const headers = await getAuthHeaders();
      const res = await fetch("/api/user/wallets", { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch wallets");
      }

      const list = Array.isArray(data.wallets) ? data.wallets : [];
      setWallets(list);
      // Decide default tab once after initial fetch
      setActiveTab(list.length > 0 ? "portfolio" : "wallets");
      setDefaultedTab(true);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch wallets",
      );
      hasFetchedWallets.current = false; // Reset on error so it can retry
    } finally {
      setWalletsLoading(false);
    }
  }, [getAuthHeaders]);

  const refetchWallets = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/user/wallets", { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch wallets");
      }

      const list = Array.isArray(data.wallets) ? data.wallets : [];
      setWallets(list);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch wallets",
      );
    }
  }, [getAuthHeaders]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/login');
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (!defaultedTab && authenticated && ready && synced) {
      fetchWallets();
    }
  }, [fetchWallets, defaultedTab, authenticated, ready, synced]);

  // Refetch wallets when wallets tab becomes active
  useEffect(() => {
    if (activeTab === "wallets" && defaultedTab && authenticated && ready && synced) {
      refetchWallets();
    }
  }, [activeTab, defaultedTab, authenticated, ready, synced, refetchWallets]);

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/user/wallets/add", {
        method: "POST",
        headers,
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
      const headers = await getAuthHeaders();
      const res = await fetch("/api/user/wallets/remove", {
        method: "POST",
        headers,
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
      setError(
        error instanceof Error ? error.message : "Failed to remove wallet",
      );
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
    setLoggingOut(true);
    try {
      await privyLogout();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      router.push("/login");
    }
  };

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial =
      saved === "dark" || (!saved && prefersDark) ? "dark" : "light";
    setTheme(initial);
    if (initial === "dark") document.documentElement.classList.add("dark");
    setThemeReady(true);
  }, []);

  // Fetch BTC/ETH price and dominance from CoinGecko
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadMarket = async () => {
      try {
        const priceRes = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
          { signal: controller.signal },
        );
        if (!priceRes.ok) throw new Error("Failed to load prices");
        const priceJson = await priceRes.json();
        if (!mounted) return;
        const btc = priceJson?.bitcoin?.usd ?? null;
        const eth = priceJson?.ethereum?.usd ?? null;
        const btcChg = priceJson?.bitcoin?.usd_24h_change ?? null;
        const ethChg = priceJson?.ethereum?.usd_24h_change ?? null;
        setBtcPrice(typeof btc === "number" ? btc : null);
        setEthPrice(typeof eth === "number" ? eth : null);
        setBtcChange(typeof btcChg === "number" ? btcChg : null);
        setEthChange(typeof ethChg === "number" ? ethChg : null);
      } catch {
        if (!mounted) return;
        // Silent fail for market data
      }
    };

    loadMarket();
    const id = setInterval(loadMarket, 60_000); // refresh every 60s
    return () => {
      mounted = false;
      controller.abort();
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !themeReady) return;
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, themeReady]);

  // Close wallet dropdown on outside click or Escape
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!walletMenuRef.current) return;
      if (!walletMenuRef.current.contains(e.target as Node)) {
        setWalletMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setWalletMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Close strategies dropdown on outside click or Escape
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!strategiesMenuRef.current) return;
      if (!strategiesMenuRef.current.contains(e.target as Node)) {
        setStrategiesMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setStrategiesMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Show loading while checking authentication
  if (!ready) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gradient-to-b from-slate-900 to-black" : "bg-gradient-to-b from-slate-50 to-slate-100"}`}>
        <div className="text-center">
          <div className={`mx-auto h-12 w-12 rounded-xl flex items-center justify-center shadow-sm animate-pulse ${theme === "dark" ? "bg-indigo-600 text-white" : "bg-indigo-600 text-white"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
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

  // Show logging out overlay
  if (loggingOut) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-gradient-to-b from-slate-900 to-black" : "bg-gradient-to-b from-slate-50 to-slate-100"}`}>
        <div className="text-center">
          <div className={`mx-auto h-12 w-12 rounded-xl flex items-center justify-center shadow-sm animate-pulse ${theme === "dark" ? "bg-indigo-600 text-white" : "bg-indigo-600 text-white"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M7.5 3.75A2.25 2.25 0 0 0 5.25 6v12A2.25 2.25 0 0 0 7.5 20.25h6a.75.75 0 0 0 0-1.5h-6a.75.75 0 0 1-.75-.75V6a.75.75 0 0 1 .75-.75h6a.75.75 0 0 0 0-1.5h-6z" />
              <path d="M21 12l-4-4v3h-7v2h7v3l4-4z" />
            </svg>
          </div>
          <p className={`text-sm mt-3 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Signing out...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${theme === "dark" ? "min-h-screen bg-gradient-to-b from-slate-900 to-black" : "min-h-screen bg-gradient-to-b from-slate-50 to-slate-100"} py-16 px-4 sm:px-6 lg:px-8 relative flex flex-col`}
    >
      <div className="flex-1">
        {/* Fixed market bar at the very top of the page */}
        <div
          className={`fixed inset-x-0 top-2 z-[100] ${theme === "dark" ? "bg-slate-900/80 backdrop-blur" : "bg-slate-50/80 backdrop-blur"}`}
        >
          <div className="max-w-[772px] mx-auto">
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://assets.coingecko.com/coins/images/1/standard/bitcoin.png"
                  alt="BTC"
                  className="h-4 w-4 opacity-80"
                />
                <span className={`text-slate-600 dark:text-slate-300`}>
                  {btcPrice !== null
                    ? new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: "USD",
                      }).format(btcPrice)
                    : "—"}
                </span>
                {btcChange !== null && (
                  <span
                    className={`${btcChange >= 0 ? "text-green-400" : "text-red-400"} ml-1`}
                  >
                    {btcChange >= 0 ? "+" : ""}
                    {btcChange.toFixed(1)}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://assets.coingecko.com/coins/images/279/standard/ethereum.png"
                  alt="ETH"
                  className="h-4 w-4 opacity-80"
                />
                <span className={`text-slate-600 dark:text-slate-300`}>
                  {ethPrice !== null
                    ? new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: "USD",
                      }).format(ethPrice)
                    : "—"}
                </span>
                {ethChange !== null && (
                  <span
                    className={`${ethChange >= 0 ? "text-green-400" : "text-red-400"} ml-1`}
                  >
                    {ethChange >= 0 ? "+" : ""}
                    {ethChange.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

  <div className="relative max-w-[772px] mx-auto mt-8">
          {/* Page-level header with email on the left and actions on the right */}
          {/* badges moved inside card container (component corners) */}

          {/* Page-level header with email on the left and actions on the right */}

          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="min-w-0">
              {user?.email?.address || user?.wallet?.address ? (
                <span
                  className={`text-xs h-9 px-3 flex items-center rounded-md border max-w-[40vw] truncate cursor-default ${
                    theme === "dark"
                      ? "text-slate-300 border-slate-700 bg-slate-900/60"
                      : "text-slate-600 border-slate-200 bg-white/70"
                  }`}
                  style={{ minHeight: "2.25rem", cursor: "default" }}
                  title={user?.email?.address ? "Email (masked for privacy)" : user?.wallet?.address}
                >
                  {user?.email?.address ? maskEmail(user.email.address) : shortenAddress(user?.wallet?.address || '')}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-md border transition-colors cursor-pointer ${theme === "dark" ? "text-slate-200 border-slate-700 hover:bg-slate-800 bg-slate-900/60" : "text-slate-600 border-slate-200 hover:bg-slate-100 bg-white/70"}`}
                aria-label="Toggle theme"
                title={
                  theme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
                }
              >
                {theme === "dark" ? (
                  // Sun icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />
                    <path
                      d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  // Moon icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleSignOut}
                className={`p-2 rounded-md border transition-colors cursor-pointer inline-flex items-center gap-2 ${theme === "dark" ? "text-slate-200 border-slate-700 hover:bg-slate-800 bg-slate-900/60" : "text-slate-600 border-slate-200 hover:bg-slate-100 bg-white/70"}`}
                aria-label="Sign out"
                title="Sign out"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M7.5 3.75A2.25 2.25 0 0 0 5.25 6v12A2.25 2.25 0 0 0 7.5 20.25h6a.75.75 0 0 0 0-1.5h-6a.75.75 0 0 1-.75-.75V6a.75.75 0 0 1 .75-.75h6a.75.75 0 0 0 0-1.5h-6z" />
                  <path d="M21 12l-4-4v3h-7v2h7v3l4-4z" />
                </svg>
                <span className="sr-only">Sign out</span>
              </button>
            </div>
          </div>
          <div
            className={`relative rounded-2xl shadow-xl overflow-visible backdrop-blur-sm ${theme === "dark" ? "border border-slate-700 bg-slate-900/80" : "border border-slate-200 bg-white/80"}`}
          >
            {/* Tab Menu as part of card */}
            <div
              className={`-mb-px flex items-stretch gap-0 border-b rounded-t-2xl overflow-hidden ${theme === "dark" ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}
            >
              <button
                className={`flex-1 px-6 py-3 transition-colors focus:outline-none border-b-2 cursor-pointer ${activeTab === "portfolio" ? (theme === "dark" ? "bg-slate-900 border-indigo-400 text-indigo-300 font-semibold shadow-sm" : "bg-white border-indigo-600 text-indigo-700 font-semibold shadow-sm") : theme === "dark" ? "bg-slate-800 border-transparent text-slate-300 hover:text-indigo-300" : "bg-slate-100 border-transparent text-slate-600 hover:text-indigo-700"}`}
                onClick={() => setActiveTab("portfolio")}
              >
                Portfolio
              </button>
              <button
                className={`flex-1 px-6 py-3 transition-colors focus:outline-none border-b-2 cursor-pointer ${activeTab === "strategies" ? (theme === "dark" ? "bg-slate-900 border-indigo-400 text-indigo-300 font-semibold shadow-sm" : "bg-white border-indigo-600 text-indigo-700 font-semibold shadow-sm") : theme === "dark" ? "bg-slate-800 border-transparent text-slate-300 hover:text-indigo-300" : "bg-slate-100 border-transparent text-slate-600 hover:text-indigo-700"}`}
                onClick={() => setActiveTab("strategies")}
              >
                Strategies
              </button>
              <button
                className={`flex-1 px-6 py-3 transition-colors focus:outline-none border-b-2 cursor-pointer ${activeTab === "wallets" ? (theme === "dark" ? "bg-slate-900 border-indigo-400 text-indigo-300 font-semibold shadow-sm" : "bg-white border-indigo-600 text-indigo-700 font-semibold shadow-sm") : theme === "dark" ? "bg-slate-800 border-transparent text-slate-300 hover:text-indigo-300" : "bg-slate-100 border-transparent text-slate-600 hover:text-indigo-700"}`}
                onClick={() => setActiveTab("wallets")}
              >
                Wallets
              </button>
            </div>
            {/* Card Content */}
            <div
              className={`p-8 rounded-b-2xl ${theme === "dark" ? "bg-slate-900" : "bg-white"}`}
            >
              {/* Show loading state while fetching wallets */}
              {walletsLoading ? (
                <div
                  className={`rounded-lg p-12 flex flex-col items-center justify-center gap-3 ${theme === "dark" ? "text-slate-300 bg-slate-800 border border-slate-700" : "text-slate-600 bg-slate-50 border border-slate-200"}`}
                >
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-sm animate-pulse ${theme === "dark" ? "bg-indigo-600 text-white" : "bg-indigo-600 text-white"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                      <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z" />
                      <path d="M19 13l.5 1.5L21 15l-1.5.5L19 17l-.5-1.5L17 15l1.5-.5L19 13z" />
                    </svg>
                  </div>
                  <p className="text-sm">Loading your wallets...</p>
                </div>
              ) : (
                <>
              {/* Removed welcome header and email paragraph; email is shown in header */}
              {activeTab === "wallets" && (
                <>
                  {/* EVM Wallets Section */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2
                        className={`text-lg font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}
                      >
                        Your Wallets
                      </h2>
                      <span
                        className={`text-xs rounded-full px-2 py-1 cursor-default ${theme === "dark" ? "text-slate-300 bg-slate-800 border border-slate-700" : "text-slate-500 bg-slate-100 border border-slate-200"}`}
                        style={{ cursor: "default" }}
                      >
                        {wallets.length}/10
                      </span>
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
                          className={`w-full px-3 py-2 rounded-md text-sm ring-1 ring-transparent focus:ring-2 focus:border-indigo-500 shadow-sm placeholder-slate-400 ${theme === "dark" ? "bg-slate-800 border border-slate-700 focus:ring-indigo-400 text-slate-100" : "bg-white border border-slate-200 focus:ring-indigo-500 text-slate-900"}`}
                          pattern="^0x[a-fA-F0-9]{40}$"
                          required
                          disabled={loading || wallets.length >= 10}
                          autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading || wallets.length >= 10}
                            className={`px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 ${theme === "dark" ? "bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-400 focus:ring-offset-slate-900" : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"}`}
                          >
                            {loading ? (
                              <span className="inline-block animate-spin h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full"></span>
                            ) : null}
                            Add
                          </button>
                      </div>
                    </form>
                    <div className="space-y-2">
                      {error && (
                        <div
                          role="alert"
                          className={`mt-1 text-sm rounded-md p-3 border ${theme === "dark" ? "text-rose-300 bg-rose-950/40 border-rose-900" : "text-rose-700 bg-rose-50 border-rose-200"}`}
                        >
                          {error}
                        </div>
                      )}
                      {wallets.length >= 10 && (
                        <p
                          className={`mt-1 text-xs ${theme === "dark" ? "text-rose-400" : "text-rose-600"}`}
                        >
                          Maximum number of wallets (10) reached
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Wallets list */}
                  <div className="space-y-2">
                    {wallets.length === 0 ? (
                      <div
                        className={`text-sm rounded-lg p-4 border border-dashed ${theme === "dark" ? "text-slate-400 bg-slate-800 border-slate-700" : "text-slate-500 bg-slate-50 border-slate-200"}`}
                      >
                        No wallets added yet. Add your first one above.
                      </div>
                    ) : (
                      wallets.map((wallet) => (
                        <div
                          key={wallet}
                          className={`flex items-center justify-between transition-colors p-3 rounded-lg cursor-default ${theme === "dark" ? "bg-slate-800 border border-slate-700 hover:border-indigo-500 hover:bg-indigo-950/20" : "bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"}`}
                          style={{ cursor: "default" }}
                        >
                          <code
                            className={`font-mono text-sm break-all ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}
                          >
                            {wallet}
                          </code>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopy(wallet)}
                              disabled={loading}
                              className={`p-1 rounded-md focus:outline-none cursor-pointer disabled:cursor-not-allowed ${copied === wallet ? (theme === "dark" ? "text-emerald-400" : "text-emerald-600") : theme === "dark" ? "text-slate-400 hover:text-indigo-300 hover:bg-slate-700" : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-100"}`}
                              title={
                                copied === wallet ? "Copied!" : "Copy address"
                              }
                              aria-label="Copy address"
                            >
                              {copied === wallet ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="h-5 w-5"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9 12.75 10.5 14.25 15 9.75 16.5 11.25 10.5 17.25 7.5 14.25 9 12.75z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.75"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-5 w-5"
                                >
                                  <rect
                                    x="9"
                                    y="9"
                                    width="10"
                                    height="12"
                                    rx="2"
                                    ry="2"
                                  ></rect>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleRemoveWallet(wallet)}
                              disabled={loading}
                              className={`p-1 rounded-md focus:outline-none cursor-pointer disabled:cursor-not-allowed ${theme === "dark" ? "text-slate-400 hover:text-rose-400 hover:bg-slate-700" : "text-slate-500 hover:text-rose-600 hover:bg-rose-100"}`}
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
              {activeTab === "portfolio" && (
                <div className="mb-6">
                  {wallets.length === 0 ? (
                    <div
                      className={`rounded-lg p-6 border ${theme === "dark" ? "text-slate-300 bg-slate-900/60 border-slate-700" : "text-slate-700 bg-white/70 border-slate-200"}`}
                    >
                      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p
                            className={`text-sm ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}
                          >
                            You don’t have any wallets yet.
                          </p>
                          <p
                            className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                          >
                            Add wallet addresses from the Wallets tab to see
                            your portfolio.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab("wallets");
                            setTimeout(() => inputRef.current?.focus(), 0);
                          }}
                          className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer border ${theme === "dark" ? "text-indigo-300 border-slate-700 bg-slate-900/60 hover:bg-slate-800" : "text-indigo-700 border-slate-200 bg-white/70 hover:bg-slate-100"}`}
                        >
                          Go to Wallets
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Wallet selector */}
                      <div className="mb-3 flex items-center gap-2">
                        <label
                          className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                        >
                          View:
                        </label>
                        <div
                          ref={walletMenuRef}
                          className="relative inline-block z-20 flex-1"
                        >
                          <button
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={walletMenuOpen}
                            onClick={() => setWalletMenuOpen((o) => !o)}
                            className={`w-full text-base px-4 py-3 pr-10 rounded-md border box-border text-left cursor-pointer leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${theme === "dark" ? "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-800 hover:bg-slate-100"}`}
                            title={
                              selectedWallet === "__combined__"
                                ? "Combined (All Wallets)"
                                : selectedWallet
                            }
                          >
                            <span className="block whitespace-nowrap">
                              {selectedWallet === "__combined__"
                                ? "Portfolio (All Wallets)"
                                : displayWalletLabel(selectedWallet)}
                            </span>
                            <span
                              className={`absolute inset-y-0 right-2 inline-flex items-center ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-4 w-4 transition-transform ${walletMenuOpen ? "rotate-180" : ""}`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.354a.75.75 0 111.02 1.1l-4.22 3.815a.75.75 0 01-1.02 0L5.25 8.33a.75.75 0 01-.02-1.06z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          </button>
                          {walletMenuOpen && (
                            <div
                              className={`absolute mt-1 left-0 w-full rounded-md border shadow-lg z-50 box-border ${theme === "dark" ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-800"}`}
                              role="listbox"
                            >
                              <button
                                role="option"
                                aria-selected={
                                  selectedWallet === "__combined__"
                                }
                                onClick={() => {
                                  setSelectedWallet("__combined__");
                                  setWalletMenuOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 cursor-pointer ${selectedWallet === "__combined__" ? (theme === "dark" ? "bg-slate-800" : "bg-slate-100") : theme === "dark" ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                              >
                                Portfolio (All Wallets)
                              </button>
                              <div
                                className={`mx-4 my-3 border-t-2 ${theme === "dark" ? "border-slate-700" : "border-slate-300"}`}
                              ></div>
                              {wallets.map((w) => (
                                <button
                                  key={w}
                                  role="option"
                                  aria-selected={selectedWallet === w}
                                  onClick={() => {
                                    setSelectedWallet(w);
                                    setWalletMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 cursor-pointer ${selectedWallet === w ? (theme === "dark" ? "bg-slate-800" : "bg-slate-100") : theme === "dark" ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                                  title={w}
                                >
                                  {displayWalletLabel(w)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {portfolioLoading ? (
                        <div
                          className={`rounded-lg p-6 flex items-center justify-center gap-3 ${theme === "dark" ? "text-slate-300 bg-slate-800 border border-slate-700" : "text-slate-600 bg-slate-50 border border-slate-200"}`}
                        >
                          <svg
                            className="h-5 w-5 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            ></path>
                          </svg>
                          Loading portfolio...
                        </div>
                      ) : portfolioError ? (
                        <div
                          role="alert"
                          className={`rounded-md p-3 border ${theme === "dark" ? "text-rose-300 bg-rose-950/40 border-rose-900" : "text-rose-700 bg-rose-50 border-rose-200"}`}
                        >
                          {portfolioError}
                        </div>
                      ) : portfolioTokens.length === 0 ? (
                        <div
                          className={`rounded-lg p-6 border border-dashed ${theme === "dark" ? "text-slate-400 bg-slate-800 border-slate-700" : "text-slate-500 bg-slate-50 border-slate-200"}`}
                        >
                          No balances found for the added wallets.
                        </div>
                      ) : (
                        <>
                          {(() => {
                            const rows =
                              selectedWallet === "__combined__"
                                ? portfolioTokens
                                : portfolioByWallet[selectedWallet] || [];
                            const totalUSD = rows.reduce(
                              (acc, t) => acc + (t.totalUSD || 0),
                              0,
                            );
                            const tokenCount = rows.length;
                            const uniqueNetworks = new Set<string>();
                            rows.forEach((t) =>
                              (t.networks || []).forEach((n) =>
                                uniqueNetworks.add(n),
                              ),
                            );
                            const networksCount = uniqueNetworks.size;
                            return (
                              <div
                                className={`mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2`}
                              >
                                <div
                                  className={`rounded-md px-3 py-2 border ${theme === "dark" ? "bg-slate-900/60 border-slate-700 text-slate-200" : "bg-white/70 border-slate-200 text-slate-800"}`}
                                >
                                  <div
                                    className={`text-[11px] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                                  >
                                    Total Value
                                  </div>
                                  <div className="text-base font-semibold">
                                    {formatLargeNumber(totalUSD)}
                                  </div>
                                </div>
                                <div
                                  className={`rounded-md px-3 py-2 border ${theme === "dark" ? "bg-slate-900/60 border-slate-700 text-slate-200" : "bg-white/70 border-slate-200 text-slate-800"}`}
                                >
                                  <div
                                    className={`text-[11px] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                                  >
                                    Tokens
                                  </div>
                                  <div className="text-base font-semibold">
                                    {tokenCount}
                                  </div>
                                </div>
                                <div
                                  className={`rounded-md px-3 py-2 border ${theme === "dark" ? "bg-slate-900/60 border-slate-700 text-slate-200" : "bg-white/70 border-slate-200 text-slate-800"}`}
                                >
                                  <div
                                    className={`text-[11px] ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                                  >
                                    Networks
                                  </div>
                                  <div className="text-base font-semibold">
                                    {networksCount}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                          {(() => {
                            const rows =
                              selectedWallet === "__combined__"
                                ? portfolioTokens
                                : portfolioByWallet[selectedWallet] || [];
                            // Apply sorting
                            const dir = sortDir === "asc" ? 1 : -1;
                            const rowsSorted = [...rows].sort((a, b) => {
                              if (sortKey === "symbol")
                                return dir * a.symbol.localeCompare(b.symbol);
                              return (
                                dir * ((a.totalUSD || 0) - (b.totalUSD || 0))
                              );
                            });
                            if (rows.length === 0) {
                              return (
                                <div
                                  className={`rounded-lg p-6 border border-dashed ${theme === "dark" ? "text-slate-400 bg-slate-800 border-slate-700" : "text-slate-500 bg-slate-50 border-slate-200"}`}
                                >
                                  No balances found for this selection.
                                </div>
                              );
                            }
                            return (
                              <>
                                <div
                                  className={`overflow-hidden rounded-lg border ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}
                                >
                                  <table
                                    className={`w-full text-sm ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}
                                  >
                                    <thead
                                      className={`${theme === "dark" ? "bg-slate-800" : "bg-slate-50"}`}
                                    >
                                      <tr>
                                        <th className="text-left px-4 py-3 font-semibold select-none">
                                          <button
                                            type="button"
                                            onClick={() => toggleSort("symbol")}
                                            className={`inline-flex items-center gap-1 cursor-pointer ${theme === "dark" ? "hover:text-indigo-300" : "hover:text-indigo-700"}`}
                                          >
                                            Token
                                            {sortKey === "symbol" && (
                                              <svg
                                                className="h-3.5 w-3.5"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                                xmlns="http://www.w3.org/2000/svg"
                                              >
                                                {sortDir === "asc" ? (
                                                  <path d="M7 14l5-5 5 5H7z" />
                                                ) : (
                                                  <path d="M7 10l5 5 5-5H7z" />
                                                )}
                                              </svg>
                                            )}
                                          </button>
                                        </th>
                                        <th className="text-right px-4 py-3 font-semibold">
                                          Total
                                        </th>
                                        <th className="text-right px-4 py-3 font-semibold select-none">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              toggleSort("totalUSD")
                                            }
                                            className={`inline-flex items-center gap-1 cursor-pointer ${theme === "dark" ? "hover:text-indigo-300" : "hover:text-indigo-700"}`}
                                          >
                                            Value (USD)
                                            {sortKey === "totalUSD" && (
                                              <svg
                                                className="h-3.5 w-3.5"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                                xmlns="http://www.w3.org/2000/svg"
                                              >
                                                {sortDir === "asc" ? (
                                                  <path d="M7 14l5-5 5 5H7z" />
                                                ) : (
                                                  <path d="M7 10l5 5 5-5H7z" />
                                                )}
                                              </svg>
                                            )}
                                          </button>
                                        </th>
                                        <th className="text-left px-4 py-3 font-semibold">
                                          Networks
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {rowsSorted.map((t) => (
                                        <tr
                                          key={t.symbol}
                                          className={`${theme === "dark" ? "border-slate-700" : "border-slate-200"} border-t hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors`}
                                        >
                                          <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                              {t.logoURI ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                  src={t.logoURI}
                                                  alt={t.symbol}
                                                  className="h-6 w-6 rounded-md object-cover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                                  onError={(ev) => {
                                                    (
                                                      ev.currentTarget as HTMLImageElement
                                                    ).style.display = "none";
                                                    (
                                                      ev.currentTarget
                                                        .nextSibling as HTMLElement
                                                    )?.classList.remove(
                                                      "hidden",
                                                    );
                                                  }}
                                                />
                                              ) : null}
                                              <div
                                                className={
                                                  t.logoURI ? "hidden" : ""
                                                }
                                              >
                                                <TokenIcon symbol={t.symbol} />
                                              </div>
                                              <span
                                                className={`${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}
                                              >
                                                {t.symbol}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 text-right tabular-nums">
                                            {formatTokenCount(t.total, t.totalUSD)}
                                          </td>
                                          <td className="px-4 py-3 text-right tabular-nums font-medium">
                                            {formatLargeNumber(t.totalUSD)}
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                              {t.networks.map((n) => (
                                                <span
                                                  key={n}
                                                  className={`text-[10px] px-2 py-0.5 rounded-full border cursor-default ${theme === "dark" ? "text-slate-200 border-slate-700 bg-slate-800" : "text-slate-700 border-slate-200 bg-slate-100"}`}
                                                  style={{ cursor: "default" }}
                                                >
                                                  {capitalize(n)}
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
                                  const total = rows.reduce(
                                    (acc, r) => acc + (r.totalUSD || 0),
                                    0,
                                  );
                                  if (!total || total <= 0) return null;
                                  // Limit to top 8 and group the rest as Others
                                  const top = [...rows]
                                    .sort(
                                      (a, b) =>
                                        (b.totalUSD || 0) - (a.totalUSD || 0),
                                    )
                                    .slice(0, 8);
                                  const rest = rows.slice(8);
                                  const othersUSD = rest.reduce(
                                    (acc, r) => acc + (r.totalUSD || 0),
                                    0,
                                  );
                                  type Seg = {
                                    label: string;
                                    value: number;
                                    color: string;
                                  };
                                  const palette = [
                                    "#6366F1",
                                    "#10B981",
                                    "#F59E0B",
                                    "#EF4444",
                                    "#8B5CF6",
                                    "#06B6D4",
                                    "#84CC16",
                                    "#F97316",
                                    "#14B8A6",
                                    "#E11D48",
                                  ];
                                  const baseSegs: Seg[] = top.map((r, i) => ({
                                    label: r.symbol,
                                    value: r.totalUSD || 0,
                                    color: palette[i % palette.length],
                                  }));
                                  const threshold = 0.01; // 1% of total
                                  let smallSum = 0;
                                  const kept: Seg[] = [];
                                  for (const s of baseSegs) {
                                    const pct = total > 0 ? s.value / total : 0;
                                    if (pct < threshold) smallSum += s.value;
                                    else kept.push(s);
                                  }
                                  const othersCombined = othersUSD + smallSum;
                                  const segsDisplay: Seg[] = [...kept];
                                  if (othersCombined / total >= threshold) {
                                    segsDisplay.push({
                                      label: "Others",
                                      value: othersCombined,
                                      color:
                                        palette[
                                          segsDisplay.length % palette.length
                                        ],
                                    });
                                  }
                                  // Build conic-gradient string
                                  let start = 0;
                                  const parts: string[] = [];
                                  segsDisplay.forEach((s) => {
                                    const angle = (s.value / total) * 360;
                                    parts.push(
                                      `${s.color} ${start}deg ${start + angle}deg`,
                                    );
                                    start += angle;
                                  });
                                  const gradient = `conic-gradient(${parts.join(",")})`;

                                  return (
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                                      <div
                                        className={`mx-auto relative h-40 w-40 rounded-full`}
                                        style={{ backgroundImage: gradient }}
                                      >
                                        <div
                                          className={`absolute inset-4 rounded-full ${theme === "dark" ? "bg-slate-900" : "bg-white"} border ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}
                                        ></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div
                                            className={`text-center ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}
                                          >
                                            <div className="text-[11px] opacity-70">
                                              Portfolio Allocation
                                            </div>
                                            <div className="text-sm font-semibold">
                                              {formatLargeNumber(total)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="sm:col-span-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          {segsDisplay.map((s) => {
                                            const pct = s.value / total;
                                            return (
                                              <div
                                                key={s.label}
                                                className={`flex items-center justify-between rounded-md px-3 py-2 border ${theme === "dark" ? "bg-slate-900/60 border-slate-700" : "bg-white/70 border-slate-200"}`}
                                              >
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <span
                                                    className="h-3 w-3 rounded-sm"
                                                    style={{
                                                      backgroundColor: s.color,
                                                    }}
                                                  ></span>
                                                  <span
                                                    className={`text-sm truncate ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}
                                                  >
                                                    {s.label}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                  <span
                                                    className={`text-sm tabular-nums ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}
                                                  >
                                                    {new Intl.NumberFormat(
                                                      undefined,
                                                      {
                                                        style: "percent",
                                                        maximumFractionDigits: 1,
                                                      },
                                                    ).format(pct)}
                                                  </span>
                                                  <span
                                                    className={`text-xs tabular-nums ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                                                  >
                                                    {formatLargeNumber(s.value)}
                                                  </span>
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
              {activeTab === "strategies" && (
                <div className="mb-6">
                  {strategiesLoading ? (
                    <div
                      className={`rounded-lg p-6 flex items-center justify-center gap-3 ${theme === "dark" ? "text-slate-300 bg-slate-800 border border-slate-700" : "text-slate-600 bg-slate-50 border border-slate-200"}`}
                    >
                      <svg
                        className="h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                      Loading strategies...
                    </div>
                  ) : strategiesError ? (
                    <div
                      role="alert"
                      className={`rounded-lg p-6 border ${theme === "dark" ? "text-red-300 bg-red-900/20 border-red-800" : "text-red-700 bg-red-50 border-red-200"}`}
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {strategiesError}
                      </div>
                    </div>
                  ) : wallets.length === 0 ? (
                    <div
                      className={`rounded-lg p-6 border ${theme === "dark" ? "text-slate-300 bg-slate-900/60 border-slate-700" : "text-slate-700 bg-white/70 border-slate-200"}`}
                    >
                      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p
                            className={`text-sm ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}
                          >
                            You don’t have any wallets yet.
                          </p>
                          <p
                            className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                          >
                            Add wallet addresses from the Wallets tab to see
                            your strategies.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab("wallets");
                            setTimeout(() => inputRef.current?.focus(), 0);
                          }}
                          className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer border ${theme === "dark" ? "text-indigo-300 border-slate-700 bg-slate-900/60 hover:bg-slate-800" : "text-indigo-700 border-slate-200 bg-white/70 hover:bg-slate-100"}`}
                        >
                          Go to Wallets
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Wallet selector for strategies */}
                      <div className="mb-4 flex items-center gap-2">
                        <label
                          className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                        >
                          View:
                        </label>
                        <div
                          ref={strategiesMenuRef}
                          className="relative inline-block z-20 flex-1"
                        >
                          <button
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={strategiesMenuOpen}
                            onClick={() => setStrategiesMenuOpen((o) => !o)}
                            className={`w-full text-base px-4 py-3 pr-10 rounded-md border box-border text-left cursor-pointer leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${theme === "dark" ? "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800" : "bg-white border-slate-200 text-slate-800 hover:bg-slate-100"}`}
                            title={
                              selectedWalletStrategies === "__combined__"
                                ? "Portfolio (All Wallets)"
                                : selectedWalletStrategies
                            }
                          >
                            <span className="block whitespace-nowrap">
                              {selectedWalletStrategies === "__combined__"
                                ? "Portfolio (All Wallets)"
                                : displayWalletLabel(selectedWalletStrategies)}
                            </span>
                            <span
                              className={`absolute inset-y-0 right-2 inline-flex items-center ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-4 w-4 transition-transform ${strategiesMenuOpen ? "rotate-180" : ""}`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.354a.75.75 0 111.02 1.1l-4.22 3.815a.75.75 0 01-1.02 0L5.25 8.33a.75.75 0 01-.02-1.06z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          </button>
                          {strategiesMenuOpen && (
                            <div
                              className={`absolute mt-1 left-0 w-full rounded-md border shadow-lg z-50 box-border ${theme === "dark" ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-800"}`}
                              role="listbox"
                            >
                              <button
                                role="option"
                                aria-selected={
                                  selectedWalletStrategies === "__combined__"
                                }
                                onClick={() => {
                                  setSelectedWalletStrategies("__combined__");
                                  setStrategiesMenuOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 cursor-pointer ${selectedWalletStrategies === "__combined__" ? (theme === "dark" ? "bg-slate-800" : "bg-slate-100") : theme === "dark" ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                              >
                                Portfolio (All Wallets)
                              </button>
                              <div
                                className={`mx-4 my-3 border-t-2 ${theme === "dark" ? "border-slate-700" : "border-slate-300"}`}
                              ></div>
                              {wallets.map((w) => (
                                <button
                                  key={w}
                                  role="option"
                                  aria-selected={selectedWalletStrategies === w}
                                  onClick={() => {
                                    setSelectedWalletStrategies(w);
                                    setStrategiesMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 cursor-pointer ${selectedWalletStrategies === w ? (theme === "dark" ? "bg-slate-800" : "bg-slate-100") : theme === "dark" ? "hover:bg-slate-800" : "hover:bg-slate-50"}`}
                                  title={w}
                                >
                                  {displayWalletLabel(w)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Strategies display */}
                      {(() => {
                        const strategies =
                          selectedWalletStrategies === "__combined__"
                            ? combinedStrategies.map((s) => ({
                                ...s,
                                walletAddress: "Combined Portfolio",
                              }))
                            : (
                                strategiesByWallet[selectedWalletStrategies] ||
                                []
                              ).map((s) => ({
                                ...s,
                                walletAddress: selectedWalletStrategies,
                              }));

                        if (strategies.length === 0) {
                          return (
                            <div
                              className={`rounded-lg p-6 border border-dashed ${theme === "dark" ? "text-slate-400 bg-slate-800 border-slate-700" : "text-slate-500 bg-slate-50 border-slate-200"}`}
                            >
                              <div className="text-center">
                                <svg
                                  className="mx-auto h-12 w-12 text-slate-400"
                                  stroke="currentColor"
                                  fill="none"
                                  viewBox="0 0 48 48"
                                >
                                  <path
                                    d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0124 24c4.21 0 7.813 2.602 9.288 6.286"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <p className="mt-2 text-sm">
                                  No strategies found for the selected wallet.
                                </p>
                                <p className="mt-1 text-xs opacity-70">
                                  Strategies will appear here once your
                                  portfolio is analyzed.
                                </p>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4">
                            {strategies.map((strategy, index) => (
                              <div
                                key={index}
                                className={`rounded-lg border p-6 ${theme === "dark" ? "bg-slate-900/60 border-slate-700" : "bg-white/70 border-slate-200"}`}
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h3
                                      className={`text-lg font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}
                                    >
                                      {strategy.name || "Unnamed Strategy"}
                                    </h3>

                                  </div>
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-default ${getRiskColor(strategy.risk || "unknown")}`}
                                    style={{ cursor: "default" }}
                                  >
                                    {strategy.risk
                                      ? strategy.risk.charAt(0).toUpperCase() +
                                        strategy.risk.slice(1) +
                                        " Risk"
                                      : "Unknown Risk"}
                                  </span>
                                </div>

                                <div className="space-y-4">
                                  {strategy.actions.map(
                                    (action, actionIndex) => (
                                      <div
                                        key={actionIndex}
                                        className={`rounded-md p-4 border ${theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-slate-50/50 border-slate-200"}`}
                                      >
                                        <div className="flex items-center gap-2 mb-3">
                                          <TokenIcon symbol={action.tokens} />
                                          <span
                                            className={`font-medium ${theme === "dark" ? "text-slate-200" : "text-slate-800"}`}
                                          >
                                            {action.tokens}
                                          </span>
                                          {action.apy &&
                                            action.apy !== "N/A" &&
                                            action.apy !== "Variable (N/A)" && (
                                              <span
                                                className={`ml-auto text-sm px-2 py-1 rounded ${theme === "dark" ? "bg-green-900/20 text-green-400" : "bg-green-50 text-green-700"}`}
                                              >
                                                {action.apy} APY
                                              </span>
                                            )}
                                        </div>

                                        <p
                                          className={`text-sm mb-3 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}
                                        >
                                          {action.description}
                                        </p>

                                        {/* Networks */}
                                        {action.networks &&
                                          action.networks.length > 0 && (
                                            <div className="flex items-center gap-2 mb-2">
                                              <span
                                                className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                                              >
                                                Networks:
                                              </span>
                                              <div className="flex gap-1">
                                                {action.networks.map(
                                                  (network) => (
                                                    <span
                                                      key={network}
                                                      className={`text-xs px-2 py-1 rounded-full cursor-default ${theme === "dark" ? "bg-slate-700 text-slate-300 border border-slate-600" : "bg-slate-100 text-slate-700 border border-slate-300"}`}
                                                      style={{
                                                        cursor: "default",
                                                      }}
                                                    >
                                                      {capitalize(network)}
                                                    </span>
                                                  ),
                                                )}
                                              </div>
                                            </div>
                                          )}

                                        {/* Operations */}
                                        {action.operations &&
                                          action.operations.length > 0 && (
                                            <div className="flex items-center gap-2 mb-3">
                                              <span
                                                className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                                              >
                                                Operations:
                                              </span>
                                              <div className="flex gap-1">
                                                {action.operations.map(
                                                  (operation) => (
                                                    <span
                                                      key={operation}
                                                      className={`text-xs px-2 py-1 rounded-full cursor-default ${theme === "dark" ? "bg-slate-700 text-slate-300 border border-slate-600" : "bg-slate-100 text-slate-700 border border-slate-300"}`}
                                                      style={{
                                                        cursor: "default",
                                                      }}
                                                    >
                                                      {operation}
                                                    </span>
                                                  ),
                                                )}
                                              </div>
                                            </div>
                                          )}

                                        {/* Platforms */}
                                        {action.platforms &&
                                          action.platforms.length > 0 && (
                                            <div>
                                              <span
                                                className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                                              >
                                                Recommended platforms:
                                              </span>
                                              <div className="flex flex-wrap gap-2 mt-1">
                                                {action.platforms.map(
                                                  (platform) => (
                                                    <a
                                                      key={platform.name}
                                                      href={platform.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border cursor-pointer hover:opacity-80 transition-opacity ${theme === "dark" ? "bg-indigo-900/20 text-indigo-300 border-indigo-800 hover:bg-indigo-900/30" : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"}`}
                                                    >
                                                      {platform.name}
                                                      <svg
                                                        className="h-3 w-3"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                      >
                                                        <path
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                          strokeWidth={2}
                                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                        />
                                                      </svg>
                                                    </a>
                                                  ),
                                                )}
                                              </div>
                                            </div>
                                          )}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}
              </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Sticky Footer at bottom */}
      <footer className="mt-auto">
  <div className="max-w-[772px] mx-auto">
          <p
            className={`text-xs text-center ${theme === "dark" ? "text-slate-500" : "text-slate-500"}`}
          >
            Powered by{" "}
            <a
              href="https://www.adex.network/blog/introducing-adex-aura/"
              target="_blank"
              rel="noopener noreferrer"
              className={`${theme === "dark" ? "text-indigo-300 hover:text-indigo-200" : "text-indigo-700 hover:text-indigo-800"} underline underline-offset-2`}
            >
              AdEx Aura
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
