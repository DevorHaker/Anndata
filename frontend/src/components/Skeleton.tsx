import React from "react";

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "h-4 w-full",
}) => {
  return (
    <div className={`bg-slate-800/80 animate-pulse rounded-lg ${className}`} />
  );
};
