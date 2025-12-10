import React, { useState, useMemo } from 'react';
import { 
  Grid, 
  List, 
  SlidersHorizontal,
  ArrowUpDown,
  RefreshCw,
  Download
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import LiveIndicator from '../components/LiveIndicator';
import { trendingProducts, categories } from '../data/mockData';
import { sortProducts, filterProducts, formatNumber } from '../utils/helpers';

export default function Products() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    category: 'all',
    competition: 'all',
    minProfit: '',
    minScore: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const processedProducts = useMemo(() => {
    let products = [...trendingProducts];
    
    // Apply search
    if (searchTerm) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply filters
    products = filterProducts(products, filters);
    
    // Apply sorting
    products = sortProducts(products, sortBy, sortOrder);
    
    return products;
  }, [searchTerm, filters, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-gradient-to-b from-emerald-900/20 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">Product Research</h1>
                <LiveIndicator />
              </div>
              <p className="text-gray-400">
                Discover winning products with real-time market data
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-secondary flex items-center gap-2 py-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button className="btn-secondary flex items-center gap-2 py-2">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar 
            onSearch={setSearchTerm}
            onFilter={setFilters}
            filters={filters}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="text-gray-400">
            Found <span className="text-white font-semibold">{processedProducts.length}</span> products
          </div>
          
          <div className="flex items-center gap-4">
            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select-field py-2 text-sm"
              >
                <option value="score">Score</option>
                <option value="profit">Profit</option>
                <option value="profitMargin">Margin</option>
                <option value="salesVolume">Volume</option>
                <option value="trendPercentage">Trend</option>
              </select>
              <button
                onClick={toggleSortOrder}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ArrowUpDown className={`w-4 h-4 ${sortOrder === 'asc' ? 'text-emerald-400' : 'text-gray-400'}`} />
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilters({ ...filters, category: 'all' })}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filters.category === 'all' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setFilters({ ...filters, category: cat.name })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filters.category === cat.name 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {cat.name}
              <span className="ml-1 text-xs opacity-60">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Products Grid/List */}
        {processedProducts.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
              : 'space-y-3'
          }>
            {processedProducts.map(product => (
              <ProductCard 
                key={product.id}
                product={product}
                onSelect={setSelectedProduct}
                compact={viewMode === 'list'}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <SlidersHorizontal className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No products found</h3>
            <p className="text-gray-400">
              Try adjusting your filters or search term to find products.
            </p>
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
