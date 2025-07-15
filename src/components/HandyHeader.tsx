// HandyHeader.tsx

import React from 'react';
// import { cn } from '@/lib/utils'; // この行が削除またはコメントアウトされていること

interface HandyHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  logoSrc?: string;
  logoAlt?: string;
}

const HandyHeader: React.FC<HandyHeaderProps> = ({ title, subtitle, className, logoSrc, logoAlt }) => {
  return (
    // ここが修正されていること
    <div className={`bg-primary text-primary-foreground p-4 shadow-sm flex items-center ${className || ''}`}>
      {logoSrc && (
        <img
          src={logoSrc}
          alt={logoAlt || 'Logo'}
          className="h-8 mr-3"
        />
      )}
      <div className="flex-1 text-center">
        <h1 className="handy-text-large">{title}</h1>
        {subtitle && (
          <p className="text-primary-foreground/80 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default HandyHeader;