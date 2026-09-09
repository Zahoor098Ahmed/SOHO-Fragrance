import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { useStore, User } from "../store/store";

export default function Login() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "";
  const message = searchParams.get("message") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (state.user) {
      if (redirectPath) {
        navigate(redirectPath);
      } else if (state.user.role === "superadmin") {
        navigate("/superadmin");
      } else if (state.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/account");
      }
    }
  }, [state.user, navigate, redirectPath]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError("");
    setInfoMsg("");
    setIsLoading(true);

    const emailKey = email.toLowerCase().trim();

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailKey, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.twoFactorRequired) {
          setIs2FAStep(true);
          setInfoMsg(data.message || "2-Factor Authentication code sent to your email.");
          setIsLoading(false);
          return;
        }

        const loggedUser: User = {
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          token: data.token
        };
        dispatch({ type: "SET_USER", user: loggedUser });
        setIsLoading(false);
        return;
      } else {
        setError(data.error || "Invalid email or password. Please verify your credentials.");
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      console.error("Login fetch error:", err);
      setError("Unable to connect to the authentication service. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setError("");

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiBase}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process recovery.");
      }
      setSuccessMsg(data.message || "Recovery code sent to your email.");
    } catch (err: any) {
      setError(err.message);
    }
  };



  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError("");
    setIsLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiBase}/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), code: twoFactorCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "2-Factor Verification failed.");
      }

      const loggedUser: User = {
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        token: data.token
      };
      dispatch({ type: "SET_USER", user: loggedUser });
    } catch (err: any) {
      setError(err.message || "2FA verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory pt-24 pb-16 px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white border border-cream p-8 rounded-sm shadow-sm">
        
        {is2FAStep ? (
          <>
            {/* 2FA Header */}
            <div className="text-center mb-8">
              <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-2">Security Verification</p>
              <h1 className="font-display text-3xl text-dark-text font-light">2-Factor Authentication</h1>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs px-4 py-3 rounded-sm mb-6 border border-red-100">
                {error}
              </div>
            )}

            {infoMsg && (
              <div className="bg-green-50 text-green-700 text-xs px-4 py-3 rounded-sm mb-6 border border-green-100">
                {infoMsg}
              </div>
            )}

            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-2">6-Digit 2FA Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full px-4 py-3 bg-ivory border border-cream text-sm text-dark-text tracking-widest text-center focus:outline-none focus:border-champagne rounded-sm font-mono-custom font-bold text-lg"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-burgundy hover:bg-dark-burgundy text-cream text-xs tracking-[0.2em] uppercase font-semibold transition-colors rounded-sm mt-6 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setIs2FAStep(false); setTwoFactorCode(""); setError(""); }}
                className="text-xs text-champagne hover:underline font-semibold"
              >
                ← Back to Login
              </button>
            </div>
          </>
        ) : !forgotPassword ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-2">Welcome to Maison SOHO</p>
              <h1 className="font-display text-3xl text-dark-text font-light">Sign In</h1>
              {message && (
                <div className="mt-3 text-xs text-green-700 bg-green-50 border border-green-100 py-1.5 px-4 rounded-sm inline-block w-full text-center font-medium">
                  {message}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs px-4 py-3 rounded-sm mb-6 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@soho.com"
                  className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne outline-none transition-colors rounded-sm"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold">Password</label>
                  <button
                    type="button"
                    onClick={() => { setForgotPassword(true); setSuccessMsg(""); setError(""); }}
                    className="text-[10px] text-champagne hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne outline-none transition-colors rounded-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-burgundy hover:bg-dark-burgundy text-cream text-xs tracking-[0.2em] uppercase font-semibold transition-colors rounded-sm mt-6 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Access Account"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <span className="text-xs text-muted-text">Don't have an account? </span>
              <Link to="/register" className="text-xs text-champagne hover:underline font-semibold">
                Sign Up
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Forgot Password Header */}
            <div className="text-center mb-8">
              <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-2">Password Recovery</p>
              <h1 className="font-display text-3xl text-dark-text font-light">Forgot Password</h1>
            </div>

            {successMsg && (
              <div className="bg-green-50 text-green-700 text-xs px-4 py-3 rounded-sm mb-6 border border-green-100">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-1">Registered Email Address</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e.g. user@soho.com"
                  className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne outline-none transition-colors rounded-sm"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-burgundy hover:bg-dark-burgundy text-cream text-xs tracking-[0.2em] uppercase font-semibold transition-colors rounded-sm mt-6 cursor-pointer"
              >
                Recover Password
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setForgotPassword(false)}
                className="text-xs text-champagne hover:underline font-semibold"
              >
                ← Back to Login
              </button>
            </div>
          </>
        )}


      </div>
    </div>
  );
}
