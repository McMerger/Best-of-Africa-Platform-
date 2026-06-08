import { motion } from 'framer-motion';
import { SectionLabel, CardReveal } from '../../components/beta';
import { SEO } from '../../components/SEO';

const GALLERY_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1517036662991-88f58b09b30b?auto=format&fit=crop&q=80',
    caption: 'Lagos after dark',
    category: 'Cities'
  },
  {
    url: 'https://images.unsplash.com/photo-1547444342-990e72bd1600?auto=format&fit=crop&q=80',
    caption: 'Kigali on a Tuesday',
    category: 'Everyday'
  },
  {
    url: 'https://images.unsplash.com/photo-1498623116066-23bd5266fea5?auto=format&fit=crop&q=80',
    caption: 'Nairobi market',
    category: 'People'
  },
  {
    url: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&q=80',
    caption: 'Accra creators',
    category: 'Culture'
  },
  {
    url: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&q=80',
    caption: 'The Dakar waterfront',
    category: 'Cities'
  },
  {
    url: 'https://images.unsplash.com/photo-1627885408544-24ed0d0f4d3c?auto=format&fit=crop&q=80',
    caption: 'Making something',
    category: 'Everyday'
  }
];

export const BetaGallery = () => {
  return (
    <div className="selection:bg-accent selection:text-primary">
      <SEO 
        title="Gallery | BOA-Story" 
        description="A visual journal of African cities, creators, and everyday opportunity."
      />
      
      <div className="max-w-7xl mx-auto px-6 py-24">
        <header className="mb-16 text-center md:text-left">
          <SectionLabel text="Visual Journal" />
          <h1 className="font-serif text-[40px] md:text-[56px] leading-tight mb-4">
            Gallery
          </h1>
          <p className="text-xl text-primary/75 max-w-2xl">
            The places, people, and moments that make up the story we're trying to tell. Real images, real Africa.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_IMAGES.map((img, index) => (
            <CardReveal key={index} delay={index * 0.1}>
              <motion.div 
                whileHover={{ y: -4 }}
                className="group relative bg-background rounded-xl overflow-hidden border border-primary/8 shadow-sm hover:shadow-xl transition-all duration-300 h-80"
              >
                <img 
                  src={img.url} 
                  alt={img.caption} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-[10px] font-bold tracking-widest text-accent uppercase mb-2 block opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    {img.category}
                  </span>
                  <h3 className="font-serif text-xl text-foreground">
                    {img.caption}
                  </h3>
                </div>
              </motion.div>
            </CardReveal>
          ))}
        </div>
      </div>
      
    </div>
  );
};
