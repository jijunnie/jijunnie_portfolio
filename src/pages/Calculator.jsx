import React, { useState, useMemo } from 'react';
import { 
  Calculator as CalcIcon, 
  DollarSign, 
  TrendingUp, 
  Package,
  Truck,
  CreditCard,
  PieChart,
  Info,
  ArrowRight,
  Check
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/helpers';

export default function Calculator() {
  const [inputs, setInputs] = useState({
    productCost: 10,
    sellingPrice: 35,
    shippingCost: 3,
    shippingToCustomer: 0,
    platformFee: 15, // percentage
    paymentFee: 2.9, // percentage
    adSpend: 5,
    packagingCost: 1,
    returnRate: 5, // percentage
    monthlyUnits: 100
  });

  const calculations = useMemo(() => {
    const {
      productCost,
      sellingPrice,
      shippingCost,
      shippingToCustomer,
      platformFee,
      paymentFee,
      adSpend,
      packagingCost,
      returnRate,
      monthlyUnits
    } = inputs;

    // Per unit calculations
    const platformFeeAmount = (sellingPrice * platformFee) / 100;
    const paymentFeeAmount = (sellingPrice * paymentFee) / 100;
    const totalCost = productCost + shippingCost + platformFeeAmount + paymentFeeAmount + adSpend + packagingCost + shippingToCustomer;
    const grossProfit = sellingPrice - totalCost;
    const returnCostPerUnit = (grossProfit * returnRate) / 100;
    const netProfit = grossProfit - returnCostPerUnit;
    const profitMargin = (netProfit / sellingPrice) * 100;
    const roi = ((netProfit / totalCost) * 100);

    // Monthly calculations
    const monthlyRevenue = sellingPrice * monthlyUnits;
    const monthlyCost = totalCost * monthlyUnits;
    const monthlyProfit = netProfit * monthlyUnits;

    // Break-even
    const breakEvenUnits = Math.ceil(totalCost / netProfit);

    return {
      perUnit: {
        totalCost,
        grossProfit,
        netProfit,
        profitMargin,
        roi,
        platformFeeAmount,
        paymentFeeAmount
      },
      monthly: {
        revenue: monthlyRevenue,
        cost: monthlyCost,
        profit: monthlyProfit
      },
      breakEvenUnits
    };
  }, [inputs]);

  const handleInputChange = (key, value) => {
    setInputs(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }));
  };

  const InputField = ({ label, name, value, icon: Icon, suffix = '', prefix = '', tooltip }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-400">{label}</label>
        {tooltip && (
          <div className="group relative">
            <Info className="w-3 h-3 text-gray-500 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        )}
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{prefix}</span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => handleInputChange(name, e.target.value)}
          className={`input-field w-full ${Icon || prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''}`}
          step="0.01"
          min="0"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{suffix}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/20 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">Profit Calculator</h1>
            <CalcIcon className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-gray-400">
            Calculate your potential profits with accurate cost breakdowns
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Costs */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                Product Costs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label="Product Cost (from supplier)"
                  name="productCost"
                  value={inputs.productCost}
                  prefix="$"
                  tooltip="Cost to purchase from supplier"
                />
                <InputField 
                  label="Selling Price"
                  name="sellingPrice"
                  value={inputs.sellingPrice}
                  prefix="$"
                  tooltip="Your retail price"
                />
              </div>
            </div>

            {/* Shipping */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                Shipping Costs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label="Shipping from Supplier"
                  name="shippingCost"
                  value={inputs.shippingCost}
                  prefix="$"
                  tooltip="Cost to ship from China to your warehouse/customer"
                />
                <InputField 
                  label="Shipping to Customer"
                  name="shippingToCustomer"
                  value={inputs.shippingToCustomer}
                  prefix="$"
                  tooltip="Additional domestic shipping (if any)"
                />
                <InputField 
                  label="Packaging Cost"
                  name="packagingCost"
                  value={inputs.packagingCost}
                  prefix="$"
                  tooltip="Custom packaging, labels, etc."
                />
              </div>
            </div>

            {/* Fees */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                Fees & Marketing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label="Platform Fee (Shopify, Amazon, etc.)"
                  name="platformFee"
                  value={inputs.platformFee}
                  suffix="%"
                  tooltip="Marketplace or platform fees"
                />
                <InputField 
                  label="Payment Processing Fee"
                  name="paymentFee"
                  value={inputs.paymentFee}
                  suffix="%"
                  tooltip="Stripe, PayPal fees (~2.9%)"
                />
                <InputField 
                  label="Ad Spend per Sale"
                  name="adSpend"
                  value={inputs.adSpend}
                  prefix="$"
                  tooltip="Average cost to acquire a customer"
                />
                <InputField 
                  label="Return Rate"
                  name="returnRate"
                  value={inputs.returnRate}
                  suffix="%"
                  tooltip="Expected return/refund rate"
                />
              </div>
            </div>

            {/* Volume */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-pink-400" />
                Monthly Volume
              </h3>
              <InputField 
                label="Expected Monthly Sales (units)"
                name="monthlyUnits"
                value={inputs.monthlyUnits}
                tooltip="How many units you expect to sell per month"
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Per Unit Results */}
            <div className="glass-card p-6 sticky top-24">
              <h3 className="text-lg font-bold text-white mb-4">Per Unit Analysis</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400">Selling Price</span>
                  <span className="text-white font-semibold">{formatCurrency(inputs.sellingPrice)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-gray-400">Total Costs</span>
                  <span className="text-red-400 font-semibold">-{formatCurrency(calculations.perUnit.totalCost)}</span>
                </div>
                <div className="pl-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>• Product</span>
                    <span>{formatCurrency(inputs.productCost)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>• Shipping</span>
                    <span>{formatCurrency(inputs.shippingCost + inputs.shippingToCustomer)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>• Platform Fee</span>
                    <span>{formatCurrency(calculations.perUnit.platformFeeAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>• Payment Fee</span>
                    <span>{formatCurrency(calculations.perUnit.paymentFeeAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>• Marketing</span>
                    <span>{formatCurrency(inputs.adSpend)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>• Packaging</span>
                    <span>{formatCurrency(inputs.packagingCost)}</span>
                  </div>
                </div>
              </div>

              {/* Net Profit */}
              <div className={`p-4 rounded-xl ${calculations.perUnit.netProfit > 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-semibold">Net Profit</span>
                  <span className={`text-2xl font-bold ${calculations.perUnit.netProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(calculations.perUnit.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Profit Margin</span>
                  <span className={calculations.perUnit.profitMargin > 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {calculations.perUnit.profitMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-gray-400">ROI</span>
                  <span className={calculations.perUnit.roi > 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {calculations.perUnit.roi.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Monthly Projection */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="font-semibold text-white mb-4">Monthly Projection ({inputs.monthlyUnits} units)</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Revenue</span>
                    <span className="text-white font-semibold">{formatCurrency(calculations.monthly.revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Costs</span>
                    <span className="text-red-400">{formatCurrency(calculations.monthly.cost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Net Profit</span>
                    <span className={`text-lg font-bold ${calculations.monthly.profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(calculations.monthly.profit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Viability Indicator */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="font-semibold text-white mb-3">Product Viability</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      calculations.perUnit.profitMargin >= 30 ? 'bg-emerald-500' : 'bg-gray-600'
                    }`}>
                      {calculations.perUnit.profitMargin >= 30 && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={calculations.perUnit.profitMargin >= 30 ? 'text-white' : 'text-gray-500'}>
                      30%+ profit margin
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      calculations.perUnit.netProfit >= 10 ? 'bg-emerald-500' : 'bg-gray-600'
                    }`}>
                      {calculations.perUnit.netProfit >= 10 && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={calculations.perUnit.netProfit >= 10 ? 'text-white' : 'text-gray-500'}>
                      $10+ profit per unit
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      calculations.perUnit.roi >= 50 ? 'bg-emerald-500' : 'bg-gray-600'
                    }`}>
                      {calculations.perUnit.roi >= 50 && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={calculations.perUnit.roi >= 50 ? 'text-white' : 'text-gray-500'}>
                      50%+ ROI
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
