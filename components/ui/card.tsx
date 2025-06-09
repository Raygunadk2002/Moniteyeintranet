import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps & React.HTMLAttributes<HTMLDivElement>>(
  function Card({ children, className = "", style, ...props }, ref) {
    return (
      <div 
        ref={ref}
        className={`bg-white rounded-lg shadow border ${className}`}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export function CardContent({ children, className = "" }: CardContentProps) {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
} 