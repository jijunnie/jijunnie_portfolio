import React, { useState } from 'react';
import { 
  Store, 
  Star, 
  Clock, 
  MapPin, 
  Truck,
  CheckCircle,
  Shield,
  MessageSquare,
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';
import { suppliers } from '../data/mockData';
import { formatNumber } from '../utils/helpers';

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlatform = platformFilter === 'all' || supplier.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  const platforms = [...new Set(suppliers.map(s => s.platform))];

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-900/20 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Supplier Database</h1>
              <p className="text-gray-400">
                Verified suppliers from China with quality ratings and reviews
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search suppliers by name or category..."
                className="input-field w-full pl-12"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="select-field"
              >
                <option value="all">All Platforms</option>
                {platforms.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSuppliers.map(supplier => (
            <div 
              key={supplier.id}
              className="glass-card-hover p-6 cursor-pointer"
              onClick={() => setSelectedSupplier(selectedSupplier?.id === supplier.id ? null : supplier)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    <Store className="w-7 h-7 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{supplier.name}</h3>
                      {supplier.verified && (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{supplier.platform}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/20 px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-amber-400 font-semibold">{supplier.rating}</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Reviews</p>
                  <p className="text-white font-semibold">{formatNumber(supplier.reviews)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">On-Time</p>
                  <p className="text-emerald-400 font-semibold">{supplier.onTimeDelivery}%</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Dispute</p>
                  <p className="text-cyan-400 font-semibold">{supplier.disputeRate}%</p>
                </div>
              </div>

              {/* Info Row */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {supplier.location}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Response: {supplier.responseTime}
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  {supplier.yearsActive} years
                </div>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {supplier.categories.map((cat, i) => (
                  <span key={i} className="badge-info text-xs">
                    {cat}
                  </span>
                ))}
              </div>

              {/* Expanded Details */}
              {selectedSupplier?.id === supplier.id && (
                <div className="pt-4 mt-4 border-t border-white/10 animate-in slide-in-from-top-2">
                  <h4 className="font-semibold text-white mb-3">Shipping Methods</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {supplier.shippingMethods.map((method, i) => (
                      <span key={i} className="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full text-sm text-gray-300">
                        <Truck className="w-3 h-3" />
                        {method}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-gray-500">Min. Order: </span>
                      <span className="text-white">{supplier.minOrder} {supplier.minOrder === 1 ? 'unit' : 'units'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Contact
                      </button>
                      <button className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        View Store
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Store className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No suppliers found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* Supplier Tips */}
        <div className="mt-8 glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Tips for Working with Suppliers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white/5 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-400 mb-2" />
              <h4 className="font-semibold text-white mb-1">Verify Suppliers</h4>
              <p className="text-sm text-gray-400">Always order samples before bulk orders</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <MessageSquare className="w-6 h-6 text-cyan-400 mb-2" />
              <h4 className="font-semibold text-white mb-1">Communication</h4>
              <p className="text-sm text-gray-400">Build relationships with responsive suppliers</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <Truck className="w-6 h-6 text-amber-400 mb-2" />
              <h4 className="font-semibold text-white mb-1">Shipping Options</h4>
              <p className="text-sm text-gray-400">Compare shipping costs and delivery times</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <Shield className="w-6 h-6 text-purple-400 mb-2" />
              <h4 className="font-semibold text-white mb-1">Payment Protection</h4>
              <p className="text-sm text-gray-400">Use platform escrow services for safety</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
