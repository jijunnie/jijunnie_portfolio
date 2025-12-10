// Mock data for dropshipping analytics platform
// In production, this would come from APIs like AliExpress, Amazon, Google Trends, etc.

export const trendingProducts = [
  {
    id: 1,
    name: "Wireless Earbuds Pro Max",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200",
    sourcePrice: 12.50,
    sellingPrice: 49.99,
    profit: 37.49,
    profitMargin: 75,
    trend: "up",
    trendPercentage: 23,
    salesVolume: 15420,
    competition: "Medium",
    score: 94,
    supplier: "AliExpress",
    shippingTime: "7-15 days",
    usMarket: { demand: 89, growth: 15 },
    chinaMarket: { demand: 95, growth: 22 },
    tags: ["Hot", "Low Competition"]
  },
  {
    id: 2,
    name: "Smart Watch Fitness Tracker",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200",
    sourcePrice: 18.00,
    sellingPrice: 79.99,
    profit: 61.99,
    profitMargin: 77,
    trend: "up",
    trendPercentage: 45,
    salesVolume: 23150,
    competition: "High",
    score: 91,
    supplier: "AliExpress",
    shippingTime: "10-20 days",
    usMarket: { demand: 92, growth: 28 },
    chinaMarket: { demand: 88, growth: 18 },
    tags: ["Trending", "High Volume"]
  },
  {
    id: 3,
    name: "LED Strip Lights RGB",
    category: "Home & Garden",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200",
    sourcePrice: 5.20,
    sellingPrice: 24.99,
    profit: 19.79,
    profitMargin: 79,
    trend: "up",
    trendPercentage: 18,
    salesVolume: 45230,
    competition: "Low",
    score: 96,
    supplier: "AliExpress",
    shippingTime: "5-12 days",
    usMarket: { demand: 85, growth: 12 },
    chinaMarket: { demand: 78, growth: 8 },
    tags: ["Best Seller", "Low Competition"]
  },
  {
    id: 4,
    name: "Portable Blender USB",
    category: "Kitchen",
    image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=200",
    sourcePrice: 8.50,
    sellingPrice: 34.99,
    profit: 26.49,
    profitMargin: 76,
    trend: "up",
    trendPercentage: 32,
    salesVolume: 18760,
    competition: "Medium",
    score: 89,
    supplier: "AliExpress",
    shippingTime: "8-15 days",
    usMarket: { demand: 78, growth: 25 },
    chinaMarket: { demand: 82, growth: 15 },
    tags: ["Rising", "Good Margins"]
  },
  {
    id: 5,
    name: "Posture Corrector Belt",
    category: "Health & Beauty",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200",
    sourcePrice: 4.80,
    sellingPrice: 29.99,
    profit: 25.19,
    profitMargin: 84,
    trend: "up",
    trendPercentage: 67,
    salesVolume: 12340,
    competition: "Low",
    score: 93,
    supplier: "AliExpress",
    shippingTime: "7-14 days",
    usMarket: { demand: 88, growth: 45 },
    chinaMarket: { demand: 72, growth: 20 },
    tags: ["Viral", "High Margin"]
  },
  {
    id: 6,
    name: "Car Phone Mount Magnetic",
    category: "Automotive",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=200",
    sourcePrice: 3.20,
    sellingPrice: 19.99,
    profit: 16.79,
    profitMargin: 84,
    trend: "stable",
    trendPercentage: 5,
    salesVolume: 32100,
    competition: "High",
    score: 82,
    supplier: "AliExpress",
    shippingTime: "6-12 days",
    usMarket: { demand: 75, growth: 8 },
    chinaMarket: { demand: 80, growth: 5 },
    tags: ["Evergreen"]
  },
  {
    id: 7,
    name: "Mini Projector HD",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=200",
    sourcePrice: 45.00,
    sellingPrice: 149.99,
    profit: 104.99,
    profitMargin: 70,
    trend: "up",
    trendPercentage: 28,
    salesVolume: 8920,
    competition: "Medium",
    score: 88,
    supplier: "Alibaba",
    shippingTime: "12-25 days",
    usMarket: { demand: 82, growth: 22 },
    chinaMarket: { demand: 90, growth: 30 },
    tags: ["High Ticket", "Growing"]
  },
  {
    id: 8,
    name: "Pet Hair Remover Roller",
    category: "Pet Supplies",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200",
    sourcePrice: 2.80,
    sellingPrice: 14.99,
    profit: 12.19,
    profitMargin: 81,
    trend: "up",
    trendPercentage: 15,
    salesVolume: 28450,
    competition: "Low",
    score: 90,
    supplier: "AliExpress",
    shippingTime: "5-10 days",
    usMarket: { demand: 90, growth: 12 },
    chinaMarket: { demand: 65, growth: 5 },
    tags: ["Pet Niche", "Easy Win"]
  },
  {
    id: 9,
    name: "Reusable Water Bottle Smart",
    category: "Sports & Outdoors",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200",
    sourcePrice: 6.50,
    sellingPrice: 32.99,
    profit: 26.49,
    profitMargin: 80,
    trend: "up",
    trendPercentage: 38,
    salesVolume: 14230,
    competition: "Medium",
    score: 87,
    supplier: "AliExpress",
    shippingTime: "8-16 days",
    usMarket: { demand: 86, growth: 32 },
    chinaMarket: { demand: 70, growth: 15 },
    tags: ["Eco-Friendly", "Trendy"]
  },
  {
    id: 10,
    name: "Electric Neck Massager",
    category: "Health & Beauty",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200",
    sourcePrice: 15.00,
    sellingPrice: 59.99,
    profit: 44.99,
    profitMargin: 75,
    trend: "up",
    trendPercentage: 52,
    salesVolume: 9870,
    competition: "Medium",
    score: 92,
    supplier: "AliExpress",
    shippingTime: "10-18 days",
    usMarket: { demand: 91, growth: 40 },
    chinaMarket: { demand: 85, growth: 25 },
    tags: ["Hot", "WFH Essential"]
  }
];

export const categories = [
  { name: "Electronics", count: 1245, growth: 15, icon: "Smartphone" },
  { name: "Home & Garden", count: 892, growth: 22, icon: "Home" },
  { name: "Health & Beauty", count: 756, growth: 35, icon: "Heart" },
  { name: "Fashion", count: 1102, growth: 8, icon: "Shirt" },
  { name: "Sports & Outdoors", count: 543, growth: 18, icon: "Trophy" },
  { name: "Pet Supplies", count: 321, growth: 42, icon: "PawPrint" },
  { name: "Kitchen", count: 678, growth: 12, icon: "ChefHat" },
  { name: "Automotive", count: 412, growth: 5, icon: "Car" }
];

export const marketTrends = {
  us: {
    totalMarketSize: "5.4B",
    growth: 23,
    topCategories: ["Electronics", "Home & Garden", "Health"],
    seasonalTrends: [
      { month: "Jan", value: 65 },
      { month: "Feb", value: 59 },
      { month: "Mar", value: 80 },
      { month: "Apr", value: 81 },
      { month: "May", value: 76 },
      { month: "Jun", value: 85 },
      { month: "Jul", value: 90 },
      { month: "Aug", value: 88 },
      { month: "Sep", value: 95 },
      { month: "Oct", value: 110 },
      { month: "Nov", value: 145 },
      { month: "Dec", value: 160 }
    ],
    hotStates: [
      { name: "California", orders: 125000 },
      { name: "Texas", orders: 98000 },
      { name: "Florida", orders: 87000 },
      { name: "New York", orders: 82000 },
      { name: "Illinois", orders: 54000 }
    ]
  },
  china: {
    totalMarketSize: "8.2B",
    growth: 31,
    topCategories: ["Electronics", "Fashion", "Beauty"],
    seasonalTrends: [
      { month: "Jan", value: 120 },
      { month: "Feb", value: 85 },
      { month: "Mar", value: 95 },
      { month: "Apr", value: 88 },
      { month: "May", value: 92 },
      { month: "Jun", value: 145 },
      { month: "Jul", value: 98 },
      { month: "Aug", value: 102 },
      { month: "Sep", value: 115 },
      { month: "Oct", value: 125 },
      { month: "Nov", value: 180 },
      { month: "Dec", value: 140 }
    ],
    hotProvinces: [
      { name: "Guangdong", orders: 245000 },
      { name: "Zhejiang", orders: 198000 },
      { name: "Jiangsu", orders: 156000 },
      { name: "Shanghai", orders: 142000 },
      { name: "Shandong", orders: 98000 }
    ]
  }
};

export const suppliers = [
  {
    id: 1,
    name: "Shenzhen Electronics Co.",
    platform: "AliExpress",
    rating: 4.9,
    reviews: 15234,
    responseTime: "< 2 hours",
    shippingMethods: ["ePacket", "AliExpress Standard", "DHL"],
    minOrder: 1,
    location: "Shenzhen, China",
    categories: ["Electronics", "Gadgets"],
    verified: true,
    yearsActive: 8,
    onTimeDelivery: 96,
    disputeRate: 0.8
  },
  {
    id: 2,
    name: "Yiwu Home Goods Trading",
    platform: "Alibaba",
    rating: 4.7,
    reviews: 8921,
    responseTime: "< 4 hours",
    shippingMethods: ["Sea Freight", "Air Express", "Rail"],
    minOrder: 50,
    location: "Yiwu, China",
    categories: ["Home & Garden", "Kitchen"],
    verified: true,
    yearsActive: 12,
    onTimeDelivery: 94,
    disputeRate: 1.2
  },
  {
    id: 3,
    name: "Guangzhou Beauty Supply",
    platform: "AliExpress",
    rating: 4.8,
    reviews: 22456,
    responseTime: "< 1 hour",
    shippingMethods: ["ePacket", "Yanwen", "EMS"],
    minOrder: 1,
    location: "Guangzhou, China",
    categories: ["Health & Beauty", "Personal Care"],
    verified: true,
    yearsActive: 6,
    onTimeDelivery: 98,
    disputeRate: 0.5
  },
  {
    id: 4,
    name: "Ningbo Sports Equipment",
    platform: "Alibaba",
    rating: 4.6,
    reviews: 5678,
    responseTime: "< 6 hours",
    shippingMethods: ["Sea Freight", "Air Freight"],
    minOrder: 100,
    location: "Ningbo, China",
    categories: ["Sports & Outdoors", "Fitness"],
    verified: true,
    yearsActive: 15,
    onTimeDelivery: 92,
    disputeRate: 1.5
  },
  {
    id: 5,
    name: "Hangzhou Fashion Hub",
    platform: "AliExpress",
    rating: 4.5,
    reviews: 18234,
    responseTime: "< 3 hours",
    shippingMethods: ["ePacket", "China Post", "SF Express"],
    minOrder: 1,
    location: "Hangzhou, China",
    categories: ["Fashion", "Accessories"],
    verified: true,
    yearsActive: 5,
    onTimeDelivery: 91,
    disputeRate: 2.1
  }
];

export const dailyRankings = {
  date: new Date().toISOString().split('T')[0],
  lastUpdated: new Date().toISOString(),
  topGainers: [
    { id: 5, name: "Posture Corrector Belt", change: 67, rank: 1, previousRank: 8 },
    { id: 10, name: "Electric Neck Massager", change: 52, rank: 2, previousRank: 6 },
    { id: 2, name: "Smart Watch Fitness Tracker", change: 45, rank: 3, previousRank: 5 },
    { id: 9, name: "Reusable Water Bottle Smart", change: 38, rank: 4, previousRank: 7 },
    { id: 4, name: "Portable Blender USB", change: 32, rank: 5, previousRank: 9 }
  ],
  topByProfit: [
    { id: 7, name: "Mini Projector HD", profit: 104.99, margin: 70 },
    { id: 2, name: "Smart Watch Fitness Tracker", profit: 61.99, margin: 77 },
    { id: 10, name: "Electric Neck Massager", profit: 44.99, margin: 75 },
    { id: 1, name: "Wireless Earbuds Pro Max", profit: 37.49, margin: 75 },
    { id: 9, name: "Reusable Water Bottle Smart", profit: 26.49, margin: 80 }
  ],
  topByVolume: [
    { id: 3, name: "LED Strip Lights RGB", volume: 45230, trend: "up" },
    { id: 6, name: "Car Phone Mount Magnetic", volume: 32100, trend: "stable" },
    { id: 8, name: "Pet Hair Remover Roller", volume: 28450, trend: "up" },
    { id: 2, name: "Smart Watch Fitness Tracker", volume: 23150, trend: "up" },
    { id: 4, name: "Portable Blender USB", volume: 18760, trend: "up" }
  ],
  emergingProducts: [
    { name: "AI-Powered Pet Feeder", category: "Pet Supplies", potentialScore: 89 },
    { name: "Solar Phone Charger Backpack", category: "Electronics", potentialScore: 87 },
    { name: "Smart Sleep Tracker Ring", category: "Health & Beauty", potentialScore: 85 },
    { name: "Portable Espresso Machine", category: "Kitchen", potentialScore: 83 },
    { name: "UV Sanitizer Box", category: "Health & Beauty", potentialScore: 81 }
  ]
};

export const analyticsData = {
  revenueChart: [
    { name: "Mon", revenue: 4200, orders: 45, profit: 1680 },
    { name: "Tue", revenue: 5100, orders: 52, profit: 2040 },
    { name: "Wed", revenue: 4800, orders: 48, profit: 1920 },
    { name: "Thu", revenue: 6200, orders: 65, profit: 2480 },
    { name: "Fri", revenue: 7500, orders: 78, profit: 3000 },
    { name: "Sat", revenue: 8900, orders: 92, profit: 3560 },
    { name: "Sun", revenue: 7200, orders: 75, profit: 2880 }
  ],
  categoryPerformance: [
    { name: "Electronics", value: 35 },
    { name: "Health & Beauty", value: 25 },
    { name: "Home & Garden", value: 20 },
    { name: "Fashion", value: 12 },
    { name: "Other", value: 8 }
  ],
  geographicData: [
    { country: "United States", percentage: 45, revenue: 125000 },
    { country: "United Kingdom", percentage: 15, revenue: 42000 },
    { country: "Canada", percentage: 12, revenue: 33600 },
    { country: "Australia", percentage: 10, revenue: 28000 },
    { country: "Germany", percentage: 8, revenue: 22400 },
    { country: "Other", percentage: 10, revenue: 28000 }
  ]
};

export const nicheAnalysis = [
  {
    niche: "Home Office Equipment",
    saturation: 45,
    profitPotential: 85,
    competition: "Medium",
    trending: true,
    recommendation: "Strong Buy",
    insights: "Work-from-home trend continues to drive demand. Focus on ergonomic products."
  },
  {
    niche: "Pet Accessories",
    saturation: 35,
    profitPotential: 78,
    competition: "Low",
    trending: true,
    recommendation: "Buy",
    insights: "Growing pet ownership. Unique products perform well."
  },
  {
    niche: "Fitness & Wellness",
    saturation: 60,
    profitPotential: 72,
    competition: "High",
    trending: true,
    recommendation: "Hold",
    insights: "Competitive but stable. Focus on niche sub-categories."
  },
  {
    niche: "Smart Home Devices",
    saturation: 55,
    profitPotential: 80,
    competition: "High",
    trending: true,
    recommendation: "Buy",
    insights: "High demand despite competition. Focus on unique features."
  },
  {
    niche: "Sustainable Products",
    saturation: 25,
    profitPotential: 75,
    competition: "Low",
    trending: true,
    recommendation: "Strong Buy",
    insights: "Growing eco-consciousness. Early mover advantage available."
  }
];

// Helper function to generate random fluctuation for "real-time" feel
export const getRandomFluctuation = (baseValue, range = 5) => {
  const fluctuation = (Math.random() - 0.5) * 2 * range;
  return Math.round((baseValue + fluctuation) * 100) / 100;
};

// Simulate real-time price updates
export const getUpdatedPrices = (products) => {
  return products.map(product => ({
    ...product,
    sourcePrice: getRandomFluctuation(product.sourcePrice, 0.5),
    salesVolume: Math.round(getRandomFluctuation(product.salesVolume, 100))
  }));
};
