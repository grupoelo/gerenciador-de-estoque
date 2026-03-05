
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 border border-white/50 dark:border-slate-700/50 transition-all duration-300 ${className}`} {...props}>
      {children}
    </div>
  );
};
