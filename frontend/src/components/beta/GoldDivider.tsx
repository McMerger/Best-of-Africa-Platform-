import React from 'react';

export const GoldDivider = () => {
  return (
    <div 
      className="w-full h-[1px]"
      style={{
        background: "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.3) 30%, rgba(201,168,76,0.3) 70%, transparent 100%)"
      }}
    />
  );
};
