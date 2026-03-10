import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Package, Wallet, 
  ArrowUpRight, Clock, CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency } from '../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalOrders: 0,
    activeClients: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Failed to fetch');
        const orders = await res.json();
        
        // Calculate financial totals from MongoDB data
        const revenue = orders.reduce((sum: number, o: any) => sum + (Number(o.deliveryCharges) || 0), 0);
        const outsource = orders.reduce((sum: number, o: any) => sum + (Number(o.outsourceCharges) || 0), 0);
        
        setStats({
          totalRevenue: revenue,
          totalProfit: revenue - outsource,
          totalOrders: orders.length,
          activeClients: new Set(orders.map((o: any) => o.clientId)).size
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const cards = [
    { 
      title: 'Total Revenue', 
      value: formatCurrency(stats.totalRevenue), 
      icon: Wallet, 
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Total collection'
    },
    { 
      title: 'Net Profit', 
      value: formatCurrency(stats.totalProfit), 
      icon: TrendingUp, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'After outsource costs'
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders.toLocaleString(), 
      icon: Package, 
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      description: 'Successful registrations'
    },
    { 
      title: 'Active Clients', 
      value: stats.activeClients.toLocaleString(), 
      icon: Users, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Business partners'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Business Overview</h1>
          <p className="text-neutral-500 font-medium">Real-time performance for MS Delivery Services Dubai.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-100 rounded-2xl shadow-sm">
          <Clock className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-neutral-600">Live Updates</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <motion.div 
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-4 rounded-2xl ${card.bgColor} ${card.color} transition-colors group-hover:bg-neutral-900 group-hover:text-white`}>
                <card.icon className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-neutral-300 group-hover:text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-1">{card.title}</p>
              <h3 className="text-2xl font-black text-neutral-900 tracking-tight">{card.value}</h3>
              <p className="text-xs font-medium text-neutral-400 mt-2">{card.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-indigo-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-3xl font-bold">Ready to scale, Arun?</h2>
            <p className="text-indigo-100 max-w-md">Every order registered helps grow MS Delivery Services. Keep track of your logistics and financials in one place.</p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="flex items-center gap-2 bg-indigo-800/50 px-4 py-2 rounded-xl border border-indigo-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold">AED Support Active</span>
              </div>
              <div className="flex items-center gap-2 bg-indigo-800/50 px-4 py-2 rounded-xl border border-indigo-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold">MongoDB Live</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-3xl border border-white/20">
               <Package className="w-24 h-24 text-white opacity-80" />
            </div>
          </div>
        </div>
        {/* Background Decorative Circles */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-800 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-700 rounded-full blur-3xl opacity-50"></div>
      </div>
    </div>
  );
}