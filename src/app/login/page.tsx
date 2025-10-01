"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setIsCodeSent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Save email in localStorage
      localStorage.setItem('userEmail', email);

      // Force a refresh of the router to ensure middleware runs
      router.refresh();
      
      // Redirect to dashboard or home page after successful verification
      router.push("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isCodeSent ? "Enter 6-digit Code" : "Sign in to your account"}
          </h2>
        </div>
        {!isCodeSent ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus={!isCodeSent}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send verification code"}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
            <div>
              <label className="sr-only">Verification Code</label>
              <div className="flex gap-2 justify-center">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    pattern="[0-9]"
                    required
                    value={code[index] || ""}
                    onKeyDown={(e) => {
                      const inputs = e.currentTarget.parentElement
                        ?.children as HTMLCollection;

                      if (/^[0-9]$/.test(e.key)) {
                        e.preventDefault();
                        const newCode = code.split("");
                        newCode[index] = e.key; // overwrite current box
                        setCode(newCode.join(""));

                        // move focus to next input
                        if (index < 5) {
                          (inputs[index + 1] as HTMLInputElement).focus();
                        }
                      }

                      if (e.key === "Backspace") {
                        e.preventDefault();
                        const newCode = code.split("");
                        newCode[index] = "";
                        setCode(newCode.join(""));
                        if (index > 0)
                          (inputs[index - 1] as HTMLInputElement).focus();
                      }

                      if (e.key === "ArrowLeft" && index > 0) {
                        (inputs[index - 1] as HTMLInputElement).focus();
                      }

                      if (e.key === "ArrowRight" && index < 5) {
                        (inputs[index + 1] as HTMLInputElement).focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData
                        .getData("text")
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      if (!text) return;
                      setCode(text);

                      const lastIndex = Math.min(text.length - 1, 5);
                      const inputs = e.currentTarget.parentElement
                        ?.children as HTMLCollection;
                      (inputs[lastIndex] as HTMLInputElement).focus();
                    }}
                    className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div className="text-sm text-center">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault(); 
                  setIsCodeSent(false);
                  setCode(""); 
                  setError("");
                  setEmail("");
                  setLoading(false);
                }}
                className="font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer underline"
              >
                Use a different email
              </a>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
