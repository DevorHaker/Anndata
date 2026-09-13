import React, { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  header,
  footer,
}) => {
  return (
    <div
      className={`glass-panel rounded-2xl p-6 shadow-xl border border-slate-800/80 ${className}`}
    >
      {header && (
        <div className="border-b border-slate-800 pb-4 mb-4">{header}</div>
      )}
      <div>{children}</div>
      {footer && (
        <div className="border-t border-slate-800 pt-4 mt-4">{footer}</div>
      )}
    </div>
  );
};
