import { Link } from "react-router";

export default function About() {
  return (
    <div className="min-h-screen bg-ivory pt-16">
      {/* Hero */}
      <section className="hero-gradient py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.4em] text-champagne/60 uppercase mb-6">Our Story</p>
          <h1 className="font-display text-5xl lg:text-7xl text-cream font-light leading-tight mb-6">
            Born in Pakistan.<br />
            <span className="italic text-champagne">Crafted for the World.</span>
          </h1>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="section-divider mb-12" />
        <p className="font-display text-2xl text-dark-text font-light leading-relaxed mb-8 italic">
          "We believed Pakistan deserved a luxury fragrance house that could stand alongside the great perfume maisons of the world."
        </p>
        <div className="space-y-6 text-muted-text leading-relaxed">
          <p>
            SOHO Fragrance was founded with a singular vision: to create an ultra-premium perfume brand that speaks the language of international luxury while remaining deeply rooted in Pakistan's rich olfactory heritage.
          </p>
          <p>
            Each of our twelve fragrances is a carefully crafted composition — a journey from first impression to lasting memory. We work with the finest raw materials, from Bulgarian rose to genuine oud, to create Eau de Parfum that commands respect.
          </p>
          <p>
            The name SOHO — representing the spirit of an artistic, sophisticated district — reflects our ambition: to create a cultural landmark in Pakistani luxury. We are not a template. We are a house.
          </p>
        </div>
        <div className="section-divider mt-12" />
      </section>

      {/* Values */}
      <section className="bg-cream py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-4xl text-dark-text text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Excellence", text: "Every fragrance is composed to the highest international standards. We accept nothing less than perfection." },
              { title: "Authenticity", text: "We use genuine, high-quality ingredients. No shortcuts. No compromises. Only the real thing." },
              { title: "Distinction", text: "SOHO fragrances are designed to be unmistakable. To be remembered. To become your signature." },
            ].map((v) => (
              <div key={v.title} className="text-center p-6">
                <div className="section-divider mb-6" />
                <h3 className="font-display text-xl text-dark-text mb-4">{v.title}</h3>
                <p className="text-muted-text text-sm leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-espresso py-20 px-6 text-center">
        <p className="font-display text-3xl text-cream font-light mb-6">
          "SCENT BECOMES MEMORY."
        </p>
        <Link to="/collection" className="inline-block px-8 py-3 bg-champagne text-dark-text text-xs tracking-[0.3em] uppercase font-semibold hover:bg-cream transition-colors">
          Discover the Collection
        </Link>
      </section>
    </div>
  );
}
