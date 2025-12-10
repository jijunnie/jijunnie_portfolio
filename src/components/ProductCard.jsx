import React from 'react';
import { TrendingUp, TrendingDown, Minus, ExternalLink, Star, Clock, Package } from 'lucide-react';
import { formatCurrency, formatNumber, getScoreColor, getScoreBgColor, getCompetitionColor } from '../utils/helpers';

export default function ProductCard({ product, onSelect, compact = false }) {
  const getTrendIcon = () => {
    if (product.trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (product.trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  if (compact) {
    return (
      <div 
        onClick={() => onSelect?.(product)}
        className="glass-card-hover p-4 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white truncate">{product.name}</h4>
            <p className="text-sm text-gray-400">{product.category}</p>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${getScoreColor(product.score)}`}>
              {product.score}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              {getTrendIcon()}
              <span className={product.trend === 'up' ? 'text-emerald-400' : product.trend === 'down' ? 'text-red-400' : ''}>
                {product.trendPercentage}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => onSelect?.(product)}
      className="glass-card-hover p-6 cursor-pointer group"
    >
      {/* Header with Image and Score */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-20 h-20 rounded-xl bg-white/10 overflow-hidden flex-shrink-0">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
              {product.name}
            </h3>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreBgColor(product.score)} ${getScoreColor(product.score)}`}>
              {product.score}
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-1">{product.category}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {product.tags?.slice(0, 2).map((tag, i) => (
              <span key={i} className="badge-info text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-xl bg-white/5">
        <div>
          <p className="text-xs text-gray-500 mb-1">Source</p>
          <p className="font-semibold text-gray-300">{formatCurrency(product.sourcePrice)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Sell Price</p>
          <p className="font-semibold text-white">{formatCurrency(product.sellingPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Profit</p>
          <p className="font-semibold text-emerald-400">{formatCurrency(product.profit)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Margin:</span>
          <span className="font-semibold text-emerald-400">{product.profitMargin}%</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Volume:</span>
          <span className="font-semibold text-white">{formatNumber(product.salesVolume)}</span>
        </div>
      </div>

      {/* Trend and Competition */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${product.trend === 'up' ? 'text-emerald-400' : product.trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
            {product.trendPercentage}% trend
          </span>
        </div>
        <span className={`${getCompetitionColor(product.competition)} px-2 py-1 rounded-full text-xs`}>
          {product.competition} Competition
        </span>
      </div>

      {/* Supplier Info */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Package className="w-3 h-3" />
          <span>{product.supplier}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{product.shippingTime}</span>
        </div>
      </div>
    </div>
  );
}
