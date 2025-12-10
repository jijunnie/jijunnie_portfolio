import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  BarChart3,
  Zap,
  ArrowUp,
  ArrowDown,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import LiveIndicator from '../components/LiveIndicator';
import { dailyRankings, trendingProducts } from '../data/mockData';
import { formatCurrency, formatNumber, getTimeAgo } from '../utils/helpers';

export default function Rankings() {
  const [activeTab, setActiveTab] = useState('gainers');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate periodic updates
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000); // Update timestamp every minute
    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { id: 'gainers', label: 'Top Gainers', icon: TrendingUp, color: 'text-emerald-400' },
    { id: 'profit', label: 'Highest Profit', icon: DollarSign, color: 'text-amber-400' },
    { id: 'volume', label: 'Top Volume', icon: BarChart3, color: 'text-cyan-400' },
    { id: 'emerging', label: 'Emerging', icon: Sparkles, color: 'text-purple-400' },
  ];

  const getProductDetails = (id) => {
    return trendingProducts.find(p => p.id === id);
  };

  const renderRankBadge = (rank) => {
    const styles = {
      1: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30',
      2: 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800',
      3: 'bg-gradient-to-r from-amber-600 to-amber-800 text-white',
    };
    
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
        styles[rank] || 'bg-white/10 text-gray-400'
      }`}>
        {rank === 1 && <Trophy className="w-5 h-5" />}
        {rank !== 1 && rank}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-900/20 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">Daily Rankings</h1>
                <LiveIndicator />
              </div>
              <div className="flex items-center gap-4 text-gray-400">
                <span>{new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
                <span className="flex items-center gap-1 text-sm">
                  <Clock className="w-4 h-4" />
                  Updated {getTimeAgo(lastUpdated)}
                </span>
              </div>
            </div>
            <button className="btn-secondary flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/10 border border-white/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? tab.color : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Gainers */}
        {activeTab === 'gainers' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              Products with Highest Growth (24h)
            </h2>
            {dailyRankings.topGainers.map((item, index) => {
              const product = getProductDetails(item.id);
              return (
                <div 
                  key={item.id}
                  className="glass-card-hover p-4 cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex items-center gap-4">
                    {renderRankBadge(item.rank)}
                    
                    <div className="w-16 h-16 rounded-xl bg-white/10 overflow-hidden flex-shrink-0">
                      {product?.image && (
                        <img 
                          src={product.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{item.name}</h3>
                      <p className="text-sm text-gray-400">Previous Rank: #{item.previousRank}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <ArrowUp className="w-5 h-5" />
                        <span className="text-xl font-bold">+{item.change}%</span>
                      </div>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-1 text-sm text-gray-400">
                      <span className="px-2 py-1 bg-white/5 rounded">
                        #{item.previousRank} → #{item.rank}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Highest Profit */}
        {activeTab === 'profit' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-amber-400" />
              Products with Highest Profit Margins
            </h2>
            {dailyRankings.topByProfit.map((item, index) => {
              const product = getProductDetails(item.id);
              return (
                <div 
                  key={item.id}
                  className="glass-card-hover p-4 cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex items-center gap-4">
                    {renderRankBadge(index + 1)}
                    
                    <div className="w-16 h-16 rounded-xl bg-white/10 overflow-hidden flex-shrink-0">
                      {product?.image && (
                        <img 
                          src={product.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{item.name}</h3>
                      <p className="text-sm text-gray-400">Margin: {item.margin}%</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-400">{formatCurrency(item.profit)}</p>
                      <p className="text-sm text-gray-400">per unit</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Top Volume */}
        {activeTab === 'volume' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
              Products with Highest Sales Volume
            </h2>
            {dailyRankings.topByVolume.map((item, index) => {
              const product = getProductDetails(item.id);
              return (
                <div 
                  key={item.id}
                  className="glass-card-hover p-4 cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex items-center gap-4">
                    {renderRankBadge(index + 1)}
                    
                    <div className="w-16 h-16 rounded-xl bg-white/10 overflow-hidden flex-shrink-0">
                      {product?.image && (
                        <img 
                          src={product.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{item.name}</h3>
                      <div className="flex items-center gap-2">
                        {item.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <span className="w-4 h-4 text-gray-400">→</span>
                        )}
                        <span className={`text-sm ${item.trend === 'up' ? 'text-emerald-400' : 'text-gray-400'}`}>
                          {item.trend === 'up' ? 'Trending Up' : 'Stable'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cyan-400">{formatNumber(item.volume)}</p>
                      <p className="text-sm text-gray-400">monthly sales</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Emerging Products */}
        {activeTab === 'emerging' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Emerging Products to Watch
            </h2>
            <p className="text-gray-400 mb-6">
              AI-predicted products with high potential based on search trends, social signals, and market analysis.
            </p>
            {dailyRankings.emergingProducts.map((item, index) => (
              <div 
                key={index}
                className="glass-card-hover p-4"
              >
                <div className="flex items-center gap-4">
                  {renderRankBadge(index + 1)}
                  
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-8 h-8 text-purple-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{item.name}</h3>
                    <p className="text-sm text-gray-400">{item.category}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-sm text-gray-400">Potential Score</span>
                      <span className="text-xl font-bold text-purple-400">{item.potentialScore}</span>
                    </div>
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden mt-2">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${item.potentialScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="glass-card p-6 mt-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <div className="flex items-start gap-4">
                <Sparkles className="w-8 h-8 text-purple-400 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-white mb-2">How Emerging Products Are Selected</h4>
                  <p className="text-gray-400 text-sm">
                    Our AI analyzes Google Trends, social media mentions, competitor activity, and 
                    supplier listings to identify products before they become mainstream. These products 
                    show early signs of viral potential and are ideal for early movers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
