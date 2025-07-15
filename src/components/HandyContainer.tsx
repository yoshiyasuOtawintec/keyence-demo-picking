import React from 'react';
// import { cn } from '@/lib/utils'; // この行が削除またはコメントアウトされていること

interface HandyContainerProps {
  children: React.ReactNode;
  className?: string;
}

const HandyContainer: React.FC<HandyContainerProps> = ({ children, className }) => {
  return (
    // ここが修正されていること
    <div className={`handy-container ${className || ''}`}>
      {children}
    </div>
  );
};

export default HandyContainer;