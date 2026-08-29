import { useState } from "react";
import { Link } from "react-router";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiBase}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject: "Contact Us Inquiry",
          message
        })
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send message.");
      }
    } catch (err) {
      setError("Failed to send message. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-ivory pt-16">
      <section className="hero-gradient py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-4">Contact Us</p>
          <h1 className="font-display text-4xl lg:text-6xl text-cream font-light leading-tight">
            Connect With SOHO
          </h1>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Info */}
          <div>
            <h2 className="font-display text-3xl text-dark-text mb-6">Get In Touch</h2>
            <p className="text-muted-text mb-8 leading-relaxed">
              We look forward to hearing from you. Whether you have questions regarding our fragrance selections, order status, or wholesale opportunities, our luxury concierge team is at your disposal.
            </p>

            <div className="space-y-6 text-dark-text">
              <div className="flex gap-4">
                <span className="text-champagne font-semibold text-sm uppercase tracking-wider w-20">Address:</span>
                <span className="text-muted-text">Karachi, Pakistan</span>
              </div>
              <div className="flex gap-4">
                <span className="text-champagne font-semibold text-sm uppercase tracking-wider w-20">Email:</span>
                <span className="text-muted-text">info@sohofragrance.pk</span>
              </div>
              <div className="flex gap-4">
                <span className="text-champagne font-semibold text-sm uppercase tracking-wider w-20">Phone:</span>
                <span className="text-muted-text">+92 300 000 0000</span>
              </div>
              <div className="flex gap-4">
                <span className="text-champagne font-semibold text-sm uppercase tracking-wider w-20">Support:</span>
                <span className="text-muted-text">Monday - Saturday, 10:00 AM to 6:00 PM</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-cream p-8 rounded-lg">
            {submitted ? (
              <div className="text-center py-12">
                <h3 className="font-display text-2xl text-dark-text mb-4">Thank You</h3>
                <p className="text-muted-text">We have received your message and will reach out to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-text mb-2" htmlFor="name">Name</label>
                  <input
                    required
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-ivory border border-champagne/20 focus:border-champagne outline-none transition-colors text-sm text-dark-text"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-text mb-2" htmlFor="email">Email</label>
                  <input
                    required
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-ivory border border-champagne/20 focus:border-champagne outline-none transition-colors text-sm text-dark-text"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-text mb-2" htmlFor="message">Message</label>
                  <textarea
                    required
                    id="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-ivory border border-champagne/20 focus:border-champagne outline-none transition-colors text-sm text-dark-text resize-none"
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-burgundy hover:bg-espresso text-cream text-xs uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
