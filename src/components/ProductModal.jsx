import React from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Package, 
  Clock, 
  MapPin,
  DollarSign,
  BarChart3,
  Globe,
  Star
} from 'lucide-react';
import { formatCurrency, formatNumber, getScoreColor, getScoreBgColor, getCompetitionColor } from '../utils/helpers';
import { AreaChartComponent } from './MarketChart';

export default function ProductModal({ product, onClose }) {
  if (!product) return null;

  // Simulate historical data for the product
  const historicalData = [
    { day: 'Mon', sales: Math.round(product.salesVolume / 7 * 0.8) },
    { day: 'Tue', sales: Math.round(product.salesVolume / 7 * 0.9) },
    { day: 'Wed', sales: Math.round(product.salesVolume / 7 * 1.0) },
    { day: 'Thu', sales: Math.round(product.salesVolume / 7 * 1.1) },
    { day: 'Fri', sales: Math.round(product.salesVolume / 7 * 1.3) },
    { day: 'Sat', sales: Math.round(product.salesVolume / 7 * 1.4) },
    { day: 'Sun', sales: Math.round(product.salesVolume / 7 * 1.2) },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl glass-card p-0 overflow-hidden">
          {/* Header */}
          <div className="relative p-6 border-b border-white/10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-xl bg-white/10 overflow-hidden flex-shrink-0">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{product.name}</h2>
                    <p className="text-gray-400">{product.category}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-xl font-bold ${getScoreBgColor(product.score)} ${getScoreColor(product.score)}`}>
                    {product.score}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {product.tags?.map((tag, i) => (
                    <span key={i} className="badge-info">
                      {tag}
                    </span>
                  ))}
                  <span className={getCompetitionColor(product.competition)}>
                    {product.competition} Competition
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Pricing Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <DollarSign className="w-4 h-4" />
                  Source Price
                </div>
                <p className="text-xl font-bold text-gray-300">{formatCurrency(product.sourcePrice)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <DollarSign className="w-4 h-4" />
                  Selling Price
                </div>
                <p className="text-xl font-bold text-white">{formatCurrency(product.sellingPrice)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Profit
                </div>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(product.profit)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <BarChart3 className="w-4 h-4" />
                  Margin
                </div>
                <p className="text-xl font-bold text-emerald-400">{product.profitMargin}%</p>
              </div>
            </div>

            {/* Market Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* US Market */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🇺🇸</span>
                  <h4 className="font-semibold text-white">US Market</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Demand Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${product.usMarket.demand}%` }}
                        />
                      </div>
                      <span className="text-white font-medium">{product.usMarket.demand}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Growth Rate</span>
                    <span className="text-emerald-400 font-medium">+{product.usMarket.growth}%</span>
                  </div>
                </div>
              </div>

              {/* China Market */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🇨🇳</span>
                  <h4 className="font-semibold text-white">China Market</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Demand Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${product.chinaMarket.demand}%` }}
                        />
                      </div>
                      <span className="text-white font-medium">{product.chinaMarket.demand}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Growth Rate</span>
                    <span className="text-cyan-400 font-medium">+{product.chinaMarket.growth}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Trend Chart */}
            <AreaChartComponent 
              data={historicalData}
              dataKeys={['sales']}
              xKey="day"
              title="Weekly Sales Trend"
              height={200}
            />

            {/* Supplier Info */}
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="font-semibold text-white mb-4">Supplier Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Platform</p>
                    <p className="text-sm font-medium text-white">{product.supplier}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Shipping Time</p>
                    <p className="text-sm font-medium text-white">{product.shippingTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Sales Volume</p>
                    <p className="text-sm font-medium text-white">{formatNumber(product.salesVolume)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-xs text-gray-500">Trend</p>
                    <p className="text-sm font-medium text-emerald-400">+{product.trendPercentage}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
              <button className="btn-primary flex items-center gap-2">
                <Star className="w-4 h-4" />
                Add to Watchlist
              </button>
              <button className="btn-secondary flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                View on {product.supplier}
              </button>
              <button className="btn-secondary flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Find Competitors
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
