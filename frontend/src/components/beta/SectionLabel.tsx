import React from 'react';
import { motion } from 'framer-motion';

export const SectionLabel = ({ text }: { text: string }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex items-center gap-4 mb-6"
    >
      <div className="w-8 h-[2px] bg-[#C9A84C]" />
      <span className="text-[#C9A84C] font-sans font-semibold text-[0.6875rem] tracking-[0.16em] uppercase">
        {text}
      </span>
    </motion.div>
  );
};
