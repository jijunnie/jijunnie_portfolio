import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { categories } from '../data/mockData';

export default function SearchBar({ 
  onSearch, 
  onFilter,
  filters = {},
  showFilters = true,
  placeholder = "Search products, niches, suppliers..."
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch?.(searchTerm);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilter?.(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: 'all',
      competition: 'all',
      minProfit: '',
      minScore: ''
    };
    setLocalFilters(clearedFilters);
    onFilter?.(clearedFilters);
  };

  const hasActiveFilters = Object.entries(localFilters).some(
    ([key, value]) => value && value !== 'all' && value !== ''
  );

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="input-field w-full pl-12 pr-24"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {showFilters && (
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`p-2 rounded-lg transition-colors ${
                hasActiveFilters || showFilterDropdown 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'hover:bg-white/10 text-gray-400'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          )}
          <button
            type="submit"
            className="btn-primary py-2 px-4 text-sm"
          >
            Search
          </button>
        </div>
      </form>

      {/* Filter Dropdown */}
      {showFilters && showFilterDropdown && (
        <div className="glass-card p-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-white">Filters</h4>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Category</label>
              <select
                value={localFilters.category || 'all'}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="select-field w-full"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Competition Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Competition</label>
              <select
                value={localFilters.competition || 'all'}
                onChange={(e) => handleFilterChange('competition', e.target.value)}
                className="select-field w-full"
              >
                <option value="all">Any Level</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Min Profit Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Min Profit ($)</label>
              <input
                type="number"
                value={localFilters.minProfit || ''}
                onChange={(e) => handleFilterChange('minProfit', e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                min="0"
                className="input-field w-full"
              />
            </div>

            {/* Min Score Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Min Score</label>
              <input
                type="number"
                value={localFilters.minScore || ''}
                onChange={(e) => handleFilterChange('minScore', e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                min="0"
                max="100"
                className="input-field w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
