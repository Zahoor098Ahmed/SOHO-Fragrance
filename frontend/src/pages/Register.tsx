import { useState } from "react";
import { Link, useNavigate } from "react-router";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [scentFamily, setScentFamily] = useState("Amber Woody");
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, scentFamily })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start registration.");
      }

      setIsVerificationStep(true);
      setInfoMsg("Verification code sent to your email. Please check your inbox.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiBase}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed.");
      }

      // Do NOT auto-login, require manual login as requested
      navigate("/login?message=Account created successfully! Please log in.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-ivory pt-24 pb-16 px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white border border-cream p-8 rounded-sm shadow-sm">
        
        {!isVerificationStep ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-2">Join Maison SOHO</p>
              <h1 className="font-display text-3xl text-dark-text font-light">Create Account</h1>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs px-4 py-3 rounded-sm mb-6 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ali Akber"
                  className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne outline-none transition-colors rounded-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@domain.com"
                  className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne outline-none transition-colors rounded-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne outline-none transition-colors rounded-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-2">Preferred Scent Family</label>
                <select
                  value={scentFamily}
                  onChange={(e) => setScentFamily(e.target.value)}
                  className="w-full px-4 py-2 text-sm border border-cream focus:border-champagne outline-none bg-white transition-colors rounded-sm"
                >
                  <option value="Amber Woody">Amber Woody</option>
                  <option value="Citrus Floral">Citrus Floral</option>
                  <option value="Fresh Spicy">Fresh Spicy</option>
                  <option value="Leather Oud">Leather Oud</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-burgundy hover:bg-dark-burgundy text-cream text-xs tracking-[0.2em] uppercase font-semibold transition-colors rounded-sm mt-6 cursor-pointer"
              >
                Register Account
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-muted-text">
              Already have an account?{" "}
              <Link to="/login" className="text-burgundy font-semibold hover:underline">
                Sign In
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Verification Header */}
            <div className="text-center mb-8">
              <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-2">Security Verification</p>
              <h1 className="font-display text-3xl text-dark-text font-light">Enter Verification Code</h1>
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

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-[10px] tracking-wider text-muted-text uppercase font-semibold mb-2">6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full px-4 py-3 bg-ivory border border-cream text-sm text-dark-text tracking-widest text-center focus:outline-none focus:border-champagne rounded-sm font-mono-custom font-bold text-lg"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-burgundy hover:bg-dark-burgundy text-cream text-xs tracking-[0.2em] uppercase font-semibold transition-colors rounded-sm mt-6 cursor-pointer"
              >
                Verify & Register
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsVerificationStep(false)}
                className="text-xs text-champagne hover:underline font-semibold"
              >
                ← Back to Form
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
