import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Users, 
  ArrowRight,
  Globe,
  Zap,
  Target,
  BarChart3,
  ShoppingCart
} from 'lucide-react';
import StatCard from '../components/StatCard';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import LiveIndicator from '../components/LiveIndicator';
import { AreaChartComponent, PieChartComponent } from '../components/MarketChart';
import { trendingProducts, analyticsData, dailyRankings, marketTrends } from '../data/mockData';
import { formatCurrency, formatNumber } from '../utils/helpers';

export default function Dashboard() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const topProducts = trendingProducts.slice(0, 4);

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-slate-950 to-cyan-900/20" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float animation-delay-200" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white">Dashboard</h1>
                <LiveIndicator />
              </div>
              <p className="text-gray-400">
                Real-time market intelligence • {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/products" className="btn-primary flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Find Products
              </Link>
              <Link to="/rankings" className="btn-secondary flex items-center gap-2">
                <Target className="w-4 h-4" />
                Daily Rankings
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              title="Total Market Value (US)"
              value={`$${marketTrends.us.totalMarketSize}`}
              change={marketTrends.us.growth}
              icon={DollarSign}
              iconColor="text-emerald-400"
            />
            <StatCard 
              title="Total Market Value (CN)"
              value={`$${marketTrends.china.totalMarketSize}`}
              change={marketTrends.china.growth}
              icon={Globe}
              iconColor="text-cyan-400"
            />
            <StatCard 
              title="Trending Products"
              value={formatNumber(trendingProducts.length * 124)}
              change={15}
              icon={TrendingUp}
              iconColor="text-purple-400"
            />
            <StatCard 
              title="Avg. Profit Margin"
              value="78%"
              change={5.2}
              icon={BarChart3}
              iconColor="text-amber-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quick Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2">
            <AreaChartComponent 
              data={analyticsData.revenueChart}
              dataKeys={['revenue', 'profit']}
              xKey="name"
              title="Weekly Performance Overview"
              height={300}
            />
          </div>
          
          {/* Category Distribution */}
          <div>
            <PieChartComponent 
              data={analyticsData.categoryPerformance}
              title="Top Categories"
              height={300}
            />
          </div>
        </div>

        {/* Top Products Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Top Products Today</h2>
              <p className="text-gray-400 text-sm">Highest scoring products based on our algorithm</p>
            </div>
            <Link to="/products" className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-sm font-medium">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topProducts.map(product => (
              <ProductCard 
                key={product.id}
                product={product}
                onSelect={setSelectedProduct}
              />
            ))}
          </div>
        </div>

        {/* Market Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* US Market Card */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🇺🇸</span>
              <div>
                <h3 className="text-lg font-bold text-white">United States Market</h3>
                <p className="text-gray-400 text-sm">Real-time e-commerce trends</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-gray-400">Market Size</span>
                <span className="text-xl font-bold text-white">${marketTrends.us.totalMarketSize}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-gray-400">YoY Growth</span>
                <span className="text-emerald-400 font-semibold">+{marketTrends.us.growth}%</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Top Categories</p>
                <div className="flex flex-wrap gap-2">
                  {marketTrends.us.topCategories.map((cat, i) => (
                    <span key={i} className="badge-info">{cat}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Top States</p>
                {marketTrends.us.hotStates.slice(0, 3).map((state, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white">{state.name}</span>
                    <span className="text-gray-400">{formatNumber(state.orders)} orders</span>
                  </div>
                ))}
              </div>
            </div>
            
            <Link to="/markets" className="mt-4 text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-sm font-medium">
              View Full Analysis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* China Market Card */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🇨🇳</span>
              <div>
                <h3 className="text-lg font-bold text-white">China Market</h3>
                <p className="text-gray-400 text-sm">Supplier & manufacturing hub</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-gray-400">Market Size</span>
                <span className="text-xl font-bold text-white">${marketTrends.china.totalMarketSize}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-gray-400">YoY Growth</span>
                <span className="text-cyan-400 font-semibold">+{marketTrends.china.growth}%</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Top Categories</p>
                <div className="flex flex-wrap gap-2">
                  {marketTrends.china.topCategories.map((cat, i) => (
                    <span key={i} className="badge-info">{cat}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Top Provinces (Suppliers)</p>
                {marketTrends.china.hotProvinces.slice(0, 3).map((province, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white">{province.name}</span>
                    <span className="text-gray-400">{formatNumber(province.orders)} orders</span>
                  </div>
                ))}
              </div>
            </div>
            
            <Link to="/markets" className="mt-4 text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-sm font-medium">
              View Full Analysis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Daily Rankings Preview */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Today's Top Gainers</h3>
              <p className="text-gray-400 text-sm">Products with the highest growth in the last 24 hours</p>
            </div>
            <Link to="/rankings" className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-sm font-medium">
              View All Rankings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="table-header pb-4">Rank</th>
                  <th className="table-header pb-4">Product</th>
                  <th className="table-header pb-4">Previous</th>
                  <th className="table-header pb-4 text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {dailyRankings.topGainers.map((item, i) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="table-cell">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        i === 0 ? 'bg-amber-500/20 text-amber-400' :
                        i === 1 ? 'bg-gray-500/20 text-gray-300' :
                        i === 2 ? 'bg-amber-700/20 text-amber-600' :
                        'bg-white/5 text-gray-400'
                      }`}>
                        {item.rank}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-white font-medium">{item.name}</span>
                    </td>
                    <td className="table-cell text-gray-400">
                      #{item.previousRank}
                    </td>
                    <td className="table-cell text-right">
                      <span className="badge-success">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +{item.change}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
