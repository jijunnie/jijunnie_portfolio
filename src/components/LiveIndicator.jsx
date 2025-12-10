import React from 'react';

export default function LiveIndicator({ label = "Live", className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
        <div className="absolute inset-0 w-2 h-2 bg-emerald-400 rounded-full pulse-ring"></div>
      </div>
      <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
