import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SectionLabel, CardReveal } from '../../components/beta';
import { SEO } from '../../components/SEO';

const GALLERY_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1517036662991-88f58b09b30b?auto=format&fit=crop&q=80',
    caption: 'Lagos after dark',
    location: 'Lagos, Nigeria',
    category: 'Cities'
  },
  {
    url: 'https://images.unsplash.com/photo-1547444342-990e72bd1600?auto=format&fit=crop&q=80',
    caption: 'Kigali on a Tuesday',
    location: 'Kigali, Rwanda',
    category: 'People'
  },
  {
    url: 'https://images.unsplash.com/photo-1498623116066-23bd5266fea5?auto=format&fit=crop&q=80',
    caption: 'Nairobi market',
    location: 'Nairobi, Kenya',
    category: 'People'
  },
  {
    url: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&q=80',
    caption: 'Accra creators',
    location: 'Accra, Ghana',
    category: 'Culture'
  },
  {
    url: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&q=80',
    caption: 'The Dakar waterfront',
    location: 'Dakar, Senegal',
    category: 'Cities'
  },
  {
    url: 'https://images.unsplash.com/photo-1627885408544-24ed0d0f4d3c?auto=format&fit=crop&q=80',
    caption: 'Making something',
    location: 'Across the continent',
    category: 'Culture'
  }
];

// Branded placeholder shown when an image fails to load (spec §3.6).
const BrandedFallback = ({ caption, location }: { caption: string; location: string }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-card text-center px-6">
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy font-serif font-black text-accent text-xl mb-4">B</span>
    <span className="font-serif text-lg text-white">{caption}</span>
    <span className="mt-1 text-sm italic text-accent">{location}</span>
  </div>
);

export const BetaGallery = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [errored, setErrored] = useState<Record<number, boolean>>({});

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(GALLERY_IMAGES.map(i => i.category)))],
    []
  );

  const visible = GALLERY_IMAGES.map((img, index) => ({ ...img, index }))
    .filter(img => activeCategory === 'All' || img.category === activeCategory);

  return (
    <div className="selection:bg-accent selection:text-primary">
      <SEO
        title="Gallery | BOA-Story"
        description="A visual journal of African cities, creators, and everyday opportunity."
      />

      <div className="max-w-7xl mx-auto px-6 py-24">
        <header className="mb-12 text-center md:text-left">
          <SectionLabel text="Visual Journal" />
          <h1 className="font-serif text-ink text-[40px] md:text-[56px] leading-tight mb-4">
            Gallery
          </h1>
          <p className="text-xl text-ink-blue max-w-2xl">
            The places, people, and moments that make up the story we're trying to tell. Real images, real Africa.
          </p>
        </header>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                activeCategory === cat
                  ? 'bg-accent text-navy border-accent'
                  : 'border-navy/20 text-navy/65 hover:border-accent hover:text-accent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((img) => (
            <CardReveal key={img.index} delay={(img.index % 3) * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                className="group relative bg-navy-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 h-80"
              >
                {errored[img.index] ? (
                  <BrandedFallback caption={img.caption} location={img.location} />
                ) : (
                  <>
                    <img
                      src={img.url}
                      alt={img.caption}
                      onError={() => setErrored(prev => ({ ...prev, [img.index]: true }))}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Caption overlay slides up on hover (spec §3.6) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,31,61,0.85)] via-navy/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <span className="text-[10px] font-bold tracking-widest text-accent uppercase mb-2 block">
                        {img.category}
                      </span>
                      <h3 className="font-serif text-xl text-white">
                        {img.caption}
                      </h3>
                      <span className="text-sm italic text-accent">{img.location}</span>
                    </div>
                  </>
                )}
              </motion.div>
            </CardReveal>
          ))}
        </div>
      </div>

    </div>
  );
};
