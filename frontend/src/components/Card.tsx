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
      className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 text-slate-900 ${className}`}
    >
      {header && (
        <div className="border-b border-slate-100 pb-4 mb-4 text-slate-900">{header}</div>
      )}
      <div className="text-slate-700">{children}</div>
      {footer && (
        <div className="border-t border-slate-100 pt-4 mt-4 text-slate-700">{footer}</div>
      )}
    </div>
  );
};
