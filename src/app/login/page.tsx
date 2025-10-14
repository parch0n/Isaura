"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const firstCodeRef = useRef<HTMLInputElement>(null);
  const [isDark, setIsDark] = useState(false);

  // Align dark mode with saved preference or system
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved === 'dark' || (!saved && prefersDark) ? 'dark' : 'light';
    const dark = initial === 'dark';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const maskEmail = (e: string) => {
    const [user, domain] = e.split('@');
    if (!user || !domain) return e;
    const maskedUser = user.length <= 2 ? user[0] + "*" : user[0] + "*".repeat(Math.max(1, user.length - 2)) + user[user.length - 1];
    return `${maskedUser}@${domain}`;
  };

  const sendCode = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setIsCodeSent(true);
      // Focus first code box on success
      setTimeout(() => firstCodeRef.current?.focus(), 0);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendCode();
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      localStorage.setItem('userEmail', email);
      router.refresh();
      router.push("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-start justify-center ${isDark ? 'bg-gradient-to-b from-slate-900 to-black' : 'bg-gradient-to-b from-slate-50 to-slate-100'} pt-12 pb-8 px-4 sm:px-6 lg:px-8`}>
  <div className="w-full max-w-[498px]">
        <div className={`rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm border ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="mx-auto h-10 w-10 rounded-xl flex items-center justify-center bg-indigo-600 text-white shadow-sm">
                {/* Sparkle icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                  <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z" />
                  <path d="M19 13l.5 1.5L21 15l-1.5.5L19 17l-.5-1.5L17 15l1.5-.5L19 13z" />
                </svg>
              </div>
              <h1 className={`${isDark ? 'text-slate-100' : 'text-slate-900'} mt-3 text-2xl font-semibold`}>Welcome</h1>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>{isCodeSent ? 'Enter the 6‑digit code we emailed you' : 'Sign in with your email to continue'}</p>
            </div>

            {!isCodeSent ? (
              <form className="space-y-4" onSubmit={handleSendCode}>
                <div>
                  <label htmlFor="email" className={`${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm font-medium`}>Email address</label>
                  <div className="mt-1 relative">
                    <span className={`pointer-events-none absolute inset-y-0 left-3 inline-flex items-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 19.5 19.5h-15A2.25 2.25 0 0 1 2.25 17.25V6.75Zm2.4-.75 7.35 5.25L19.65 6h-15Z"/></svg>
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className={`w-full pl-9 pr-3 py-2 rounded-md text-sm ring-1 ring-transparent focus:ring-2 focus:border-indigo-500 shadow-sm placeholder-slate-400 ${isDark ? 'bg-slate-800 border border-slate-700 focus:ring-indigo-400 text-slate-100' : 'bg-white border border-slate-200 focus:ring-indigo-500 text-slate-900'}`}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={sending}
                      autoFocus={!isCodeSent}
                    />
                  </div>
                </div>

                {error && (
                  <div role="alert" className={`${isDark ? 'text-rose-300 bg-rose-950/40 border-rose-900' : 'text-rose-700 bg-rose-50 border-rose-200'} text-sm rounded-md p-3 border`}>{error}</div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className={`w-full px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-400 focus:ring-offset-slate-900' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'}`}
                >
                  {sending ? "Sending..." : "Send verification code"}
                </button>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleVerifyCode}>
                <div className={`rounded-md px-3 py-2 border ${isDark ? 'bg-slate-900/60 border-slate-700 text-slate-200' : 'bg-white/70 border-slate-200 text-slate-800'}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">We sent a code to <span className="font-medium">{maskEmail(email)}</span></div>
                    <button type="button" onClick={sendCode} disabled={sending} className={`text-xs underline cursor-pointer disabled:opacity-50 ${isDark ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-700 hover:text-indigo-800'}`}>
                      {sending ? 'Resending...' : 'Resend'}
                    </button>
                  </div>
                </div>

                <label className="sr-only">Verification Code</label>
                <div className="flex gap-2 justify-center">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      ref={index === 0 ? firstCodeRef : undefined}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      pattern="[0-9]"
                      required
                      value={code[index] || ""}
                      onKeyDown={(e) => {
                        const inputs = e.currentTarget.parentElement?.children as HTMLCollection;
                        if (/^[0-9]$/.test(e.key)) {
                          e.preventDefault();
                          const newCode = code.split("");
                          newCode[index] = e.key;
                          setCode(newCode.join(""));
                          if (index < 5) (inputs[index + 1] as HTMLInputElement).focus();
                        }
                        if (e.key === "Backspace") {
                          e.preventDefault();
                          const newCode = code.split("");
                          newCode[index] = "";
                          setCode(newCode.join(""));
                          if (index > 0) (inputs[index - 1] as HTMLInputElement).focus();
                        }
                        if (e.key === "ArrowLeft" && index > 0) (inputs[index - 1] as HTMLInputElement).focus();
                        if (e.key === "ArrowRight" && index < 5) (inputs[index + 1] as HTMLInputElement).focus();
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                        if (!text) return;
                        setCode(text);
                        const lastIndex = Math.min(text.length - 1, 5);
                        const inputs = e.currentTarget.parentElement?.children as HTMLCollection;
                        (inputs[lastIndex] as HTMLInputElement).focus();
                      }}
                      onChange={(e) => {
                        // Fallback for environments that don't trigger keydown (e.g., mobile)
                        const inputs = e.currentTarget.parentElement?.children as HTMLCollection;
                        const val = e.currentTarget.value.replace(/\D/g, "").slice(-1);
                        const newCode = code.split("");
                        newCode[index] = val || "";
                        setCode(newCode.join(""));
                        if (val && index < 5) (inputs[index + 1] as HTMLInputElement).focus();
                      }}
                      className={`${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-indigo-400' : 'bg-white border-slate-300 text-slate-900 focus:ring-indigo-500'} w-12 h-12 text-center text-2xl font-semibold border-2 rounded-lg focus:outline-none focus:ring-2`}
                    />
                  ))}
                </div>

                {error && (
                  <div role="alert" className={`${isDark ? 'text-rose-300 bg-rose-950/40 border-rose-900' : 'text-rose-700 bg-rose-50 border-rose-200'} text-sm rounded-md p-3 border`}>{error}</div>
                )}

                <div className="flex items-center justify-between text-sm">
                    <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsCodeSent(false);
                      setCode("");
                      setError("");
                      setEmail("");
                      setSending(false);
                      setVerifying(false);
                    }}
                    className={`${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-800'} underline`}
                  >
                    Use a different email
                  </a>
                  <div className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Didn’t get it? Check your spam folder</div>
                </div>

                <button
                  type="submit"
                  disabled={verifying || code.length !== 6}
                  className={`w-full px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-400 focus:ring-offset-slate-900' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'}`}
                >
                  {verifying ? "Verifying..." : "Verify code"}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className={`mt-6 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          Powered by <a href="https://www.adex.network/blog/introducing-adex-aura/" target="_blank" rel="noopener noreferrer" className={`${isDark ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-700 hover:text-indigo-800'} underline underline-offset-2`}>AdEx Aura</a>
        </p>
      </div>
    </div>
  );
}
