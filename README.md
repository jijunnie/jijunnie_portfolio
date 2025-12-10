# DropShip Analytics Pro

A comprehensive dropshipping market analysis platform that provides real-time insights into US and China markets. Find winning products, analyze trends, and maximize your dropshipping profits.

![DropShip Analytics](https://img.shields.io/badge/React-19.2.0-blue) ![Vite](https://img.shields.io/badge/Vite-7.2.4-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4.1-cyan)

## 🚀 Features

### 📊 Dashboard
- Real-time market overview with live data indicators
- Key performance metrics for US and China markets
- Quick access to top trending products
- Weekly performance charts and category distribution

### 🔍 Product Research
- Comprehensive product database with scoring algorithm
- Advanced filtering by category, competition level, profit margin
- Sort by score, profit, volume, or trend
- Detailed product modal with supplier information and market insights

### 🌍 Market Analysis
- Deep dive into US and China e-commerce markets
- Seasonal trend comparisons
- Regional performance data (top states/provinces)
- AI-powered niche opportunity analysis with recommendations

### 🏆 Daily Rankings
- **Top Gainers**: Products with highest 24-hour growth
- **Highest Profit**: Products with best profit margins
- **Top Volume**: Best-selling products by volume
- **Emerging Products**: AI-predicted products with viral potential

### 🏪 Supplier Database
- Verified supplier profiles from AliExpress and Alibaba
- Quality ratings, reviews, and response times
- Shipping methods and minimum order quantities
- On-time delivery rates and dispute statistics

### 🧮 Profit Calculator
- Comprehensive cost breakdown calculator
- Per-unit and monthly projections
- ROI and margin calculations
- Product viability indicators

## 🛠️ Tech Stack

- **Frontend**: React 19.2 with Vite
- **Styling**: Tailwind CSS with custom glass morphism design
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Routing**: React Router v7

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dropship-analytics.git

# Navigate to project directory
cd dropship-analytics

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Start with backend server
npm start
```

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── LiveIndicator.jsx
│   ├── MarketChart.jsx
│   ├── ProductCard.jsx
│   ├── ProductModal.jsx
│   ├── SearchBar.jsx
│   └── StatCard.jsx
├── data/
│   └── mockData.js      # Mock data for products, suppliers, trends
├── pages/               # Route pages
│   ├── Calculator.jsx
│   ├── Dashboard.jsx
│   ├── Markets.jsx
│   ├── Products.jsx
│   ├── Rankings.jsx
│   └── Suppliers.jsx
├── utils/
│   └── helpers.js       # Utility functions
├── App.jsx              # Main app with routing
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## 🎨 Design Features

- **Dark Mode**: Modern dark theme with slate colors
- **Glass Morphism**: Frosted glass card effects
- **Responsive**: Fully responsive design for all devices
- **Animations**: Smooth transitions and hover effects
- **Live Indicators**: Real-time status indicators

## 📈 Scoring Algorithm

Products are scored (0-100) based on:
- Profit margin potential
- Market demand (US & China)
- Competition level
- Sales volume trends
- Supplier reliability

## 🔮 Future Enhancements

- [ ] Real API integration (AliExpress, Amazon, Google Trends)
- [ ] User authentication and saved watchlists
- [ ] Price history tracking
- [ ] Competitor analysis tools
- [ ] Automated email alerts for trending products
- [ ] Multi-language support

## 📝 License

MIT License - feel free to use this project for your own dropshipping business!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ for dropshippers worldwide
