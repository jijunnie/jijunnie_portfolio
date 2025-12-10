import React, { useState } from 'react';
import { 
  Globe, 
  TrendingUp, 
  BarChart3, 
  MapPin,
  ArrowRight,
  Zap,
  Users,
  ShoppingCart,
  Package
} from 'lucide-react';
import StatCard from '../components/StatCard';
import LiveIndicator from '../components/LiveIndicator';
import { TrendLineChart, BarChartComponent, MultiLineChart } from '../components/MarketChart';
import { marketTrends, categories, nicheAnalysis } from '../data/mockData';
import { formatNumber, getRecommendationColor } from '../utils/helpers';

export default function Markets() {
  const [activeMarket, setActiveMarket] = useState('us');
  const currentMarket = activeMarket === 'us' ? marketTrends.us : marketTrends.china;

  const combinedSeasonalData = marketTrends.us.seasonalTrends.map((item, index) => ({
    month: item.month,
    US: item.value,
    China: marketTrends.china.seasonalTrends[index].value
  }));

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-gradient-to-b from-cyan-900/20 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">Market Analysis</h1>
                <LiveIndicator />
              </div>
              <p className="text-gray-400">
                Real-time market intelligence for US and China e-commerce
              </p>
            </div>
          </div>

          {/* Market Toggle */}
          <div className="inline-flex items-center bg-white/5 rounded-xl p-1 mb-8">
            <button
              onClick={() => setActiveMarket('us')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeMarket === 'us' 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-xl">🇺🇸</span>
              United States
            </button>
            <button
              onClick={() => setActiveMarket('china')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeMarket === 'china' 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-xl">🇨🇳</span>
              China
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Market Size"
              value={`$${currentMarket.totalMarketSize}`}
              change={currentMarket.growth}
              icon={Globe}
              iconColor={activeMarket === 'us' ? 'text-emerald-400' : 'text-cyan-400'}
            />
            <StatCard 
              title="YoY Growth"
              value={`${currentMarket.growth}%`}
              change={5.2}
              icon={TrendingUp}
              iconColor="text-purple-400"
            />
            <StatCard 
              title="Active Sellers"
              value={activeMarket === 'us' ? '2.4M' : '8.7M'}
              change={12}
              icon={Users}
              iconColor="text-amber-400"
            />
            <StatCard 
              title="Daily Transactions"
              value={activeMarket === 'us' ? '45M' : '180M'}
              change={8}
              icon={ShoppingCart}
              iconColor="text-pink-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Seasonal Trends Comparison */}
        <div className="mb-8">
          <MultiLineChart 
            data={combinedSeasonalData}
            lines={[
              { dataKey: 'US', name: 'United States', color: '#10b981' },
              { dataKey: 'China', name: 'China', color: '#06b6d4' }
            ]}
            xKey="month"
            title="Seasonal Trends Comparison (US vs China)"
            height={350}
          />
        </div>

        {/* Regional Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Hot Regions */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className={`w-5 h-5 ${activeMarket === 'us' ? 'text-emerald-400' : 'text-cyan-400'}`} />
              <h3 className="text-lg font-bold text-white">
                Top {activeMarket === 'us' ? 'States' : 'Provinces'} by Orders
              </h3>
            </div>
            <div className="space-y-4">
              {(activeMarket === 'us' ? currentMarket.hotStates : currentMarket.hotProvinces).map((region, index) => {
                const maxOrders = activeMarket === 'us' 
                  ? currentMarket.hotStates[0].orders 
                  : currentMarket.hotProvinces[0].orders;
                const percentage = (region.orders / maxOrders) * 100;
                
                return (
                  <div key={region.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-amber-500/20 text-amber-400' :
                          index === 1 ? 'bg-gray-500/20 text-gray-300' :
                          index === 2 ? 'bg-amber-700/20 text-amber-600' :
                          'bg-white/10 text-gray-400'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-white font-medium">{region.name}</span>
                      </div>
                      <span className="text-gray-400">{formatNumber(region.orders)}</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${activeMarket === 'us' ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Categories */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <Package className={`w-5 h-5 ${activeMarket === 'us' ? 'text-emerald-400' : 'text-cyan-400'}`} />
              <h3 className="text-lg font-bold text-white">Category Performance</h3>
            </div>
            <div className="space-y-4">
              {categories.slice(0, 5).map((category, index) => (
                <div key={category.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      index === 0 ? 'bg-emerald-500/20 text-emerald-400' :
                      index === 1 ? 'bg-cyan-500/20 text-cyan-400' :
                      index === 2 ? 'bg-purple-500/20 text-purple-400' :
                      'bg-white/10 text-gray-400'
                    }`}>
                      <BarChart3 className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-white font-medium">{category.name}</p>
                      <p className="text-gray-500 text-sm">{formatNumber(category.count)} products</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-semibold">+{category.growth}%</span>
                    <p className="text-gray-500 text-xs">growth</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Niche Analysis */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Niche Opportunity Analysis</h3>
            </div>
            <span className="text-sm text-gray-400">AI-powered recommendations</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="table-header pb-4">Niche</th>
                  <th className="table-header pb-4">Saturation</th>
                  <th className="table-header pb-4">Profit Potential</th>
                  <th className="table-header pb-4">Competition</th>
                  <th className="table-header pb-4">Recommendation</th>
                  <th className="table-header pb-4">Insights</th>
                </tr>
              </thead>
              <tbody>
                {nicheAnalysis.map((niche, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{niche.niche}</span>
                        {niche.trending && (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              niche.saturation < 40 ? 'bg-emerald-500' :
                              niche.saturation < 60 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${niche.saturation}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-sm">{niche.saturation}%</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${niche.profitPotential}%` }}
                          />
                        </div>
                        <span className="text-emerald-400 text-sm">{niche.profitPotential}%</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge-${
                        niche.competition === 'Low' ? 'success' :
                        niche.competition === 'Medium' ? 'warning' :
                        'danger'
                      }`}>
                        {niche.competition}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRecommendationColor(niche.recommendation)}`}>
                        {niche.recommendation}
                      </span>
                    </td>
                    <td className="table-cell">
                      <p className="text-gray-400 text-sm max-w-xs truncate" title={niche.insights}>
                        {niche.insights}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
