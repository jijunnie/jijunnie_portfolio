// Utility functions for the dropshipping analytics platform

export const formatCurrency = (value, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(value);
};

export const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatPercentage = (value) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

export const formatCompactNumber = (value) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

export const calculateProfitMargin = (sellingPrice, sourcePrice, additionalCosts = 0) => {
  const profit = sellingPrice - sourcePrice - additionalCosts;
  const margin = (profit / sellingPrice) * 100;
  return {
    profit: Math.round(profit * 100) / 100,
    margin: Math.round(margin * 10) / 10
  };
};

export const calculateROI = (investment, revenue) => {
  return ((revenue - investment) / investment) * 100;
};

export const getScoreColor = (score) => {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 80) return 'text-cyan-400';
  if (score >= 70) return 'text-amber-400';
  return 'text-red-400';
};

export const getScoreBgColor = (score) => {
  if (score >= 90) return 'bg-emerald-500/20';
  if (score >= 80) return 'bg-cyan-500/20';
  if (score >= 70) return 'bg-amber-500/20';
  return 'bg-red-500/20';
};

export const getTrendIcon = (trend) => {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    default:
      return '→';
  }
};

export const getTrendColor = (trend) => {
  switch (trend) {
    case 'up':
      return 'text-emerald-400';
    case 'down':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

export const getCompetitionColor = (competition) => {
  switch (competition.toLowerCase()) {
    case 'low':
      return 'badge-success';
    case 'medium':
      return 'badge-warning';
    case 'high':
      return 'badge-danger';
    default:
      return 'badge-info';
  }
};

export const getRecommendationColor = (recommendation) => {
  switch (recommendation.toLowerCase()) {
    case 'strong buy':
      return 'text-emerald-400 bg-emerald-500/20';
    case 'buy':
      return 'text-cyan-400 bg-cyan-500/20';
    case 'hold':
      return 'text-amber-400 bg-amber-500/20';
    case 'sell':
      return 'text-red-400 bg-red-500/20';
    default:
      return 'text-gray-400 bg-gray-500/20';
  }
};

export const sortProducts = (products, sortBy, sortOrder = 'desc') => {
  return [...products].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'score':
        aValue = a.score;
        bValue = b.score;
        break;
      case 'profit':
        aValue = a.profit;
        bValue = b.profit;
        break;
      case 'profitMargin':
        aValue = a.profitMargin;
        bValue = b.profitMargin;
        break;
      case 'salesVolume':
        aValue = a.salesVolume;
        bValue = b.salesVolume;
        break;
      case 'trendPercentage':
        aValue = a.trendPercentage;
        bValue = b.trendPercentage;
        break;
      default:
        aValue = a.score;
        bValue = b.score;
    }
    
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });
};

export const filterProducts = (products, filters) => {
  return products.filter(product => {
    if (filters.category && filters.category !== 'all' && product.category !== filters.category) {
      return false;
    }
    if (filters.minProfit && product.profit < filters.minProfit) {
      return false;
    }
    if (filters.maxPrice && product.sellingPrice > filters.maxPrice) {
      return false;
    }
    if (filters.minScore && product.score < filters.minScore) {
      return false;
    }
    if (filters.competition && filters.competition !== 'all' && 
        product.competition.toLowerCase() !== filters.competition.toLowerCase()) {
      return false;
    }
    return true;
  });
};

export const calculateShippingEstimate = (method, weight = 0.5) => {
  const rates = {
    'ePacket': { base: 2.5, perKg: 3.0, days: '10-20' },
    'AliExpress Standard': { base: 0, perKg: 0, days: '15-30' },
    'DHL': { base: 15, perKg: 8.0, days: '3-7' },
    'EMS': { base: 10, perKg: 5.0, days: '7-15' },
    'China Post': { base: 1.5, perKg: 2.0, days: '20-40' }
  };
  
  const rate = rates[method] || rates['AliExpress Standard'];
  return {
    cost: rate.base + (rate.perKg * weight),
    deliveryTime: rate.days
  };
};

export const getTimeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};
