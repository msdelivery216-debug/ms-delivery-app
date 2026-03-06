import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download,
  Filter,
  Calendar,
  Edit2,
  X,
  Save,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isWithinInterval, startOfToday, endOfToday, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import * as XLSX from 'xlsx';
import { Order, DateFilter, Client } from '../types';
import { formatCurrency, cn } from '../lib/utils';

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filter, setFilter] = useState<DateFilter>('This Month');
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    Promise.all([fetchOrders(), fetchClients()]).finally(() => setLoading(false));
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const res = await fetch(`/api/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOrder)
      });
      
      if (res.ok) {
        setEditingOrder(null);
        setShowToast(true);
        fetchOrders();
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter(order => {
    const date = new Date(order.orderDate);
    const now = new Date();
    
    switch (filter) {
      case 'Today':
        return isWithinInterval(date, { start: startOfToday(), end: endOfToday() });
      case 'This Month':
        return isWithinInterval(date, { start: startOfMonth(now), end: endOfMonth(now) });
      case 'Last 3 Months':
        return isWithinInterval(date, { start: subMonths(now, 3), end: now });
      case 'Last 6 Months':
        return isWithinInterval(date, { start: subMonths(now, 6), end: now });
      case 'Yearly':
        return isWithinInterval(date, { start: startOfYear(now), end: endOfYear(now) });
      default:
        return true;
    }
  });

  const stats = {
    totalOrders: filteredOrders.length,
    totalDelivery: filteredOrders.reduce((sum, o) => sum + o.deliveryCharges, 0),
    totalOutsource: filteredOrders.reduce((sum, o) => sum + o.outsourceCharges, 0),
    totalProfit: filteredOrders.reduce((sum, o) => sum + (o.deliveryCharges - o.outsourceCharges), 0),
  };

  const exportToExcel = () => {
    const data = filteredOrders.map(o => ({
      'Order #': o.orderNumber,
      'Date': o.orderDate,
      'Client': o.clientName,
      'Pickup': o.pickupLocation,
      'Customer': o.customerName,
      'Drop': o.dropLocation,
      'Contact': o.customerContact,
      'Outsource': o.outsourceName,
      'Outsource Charges': o.outsourceCharges,
      'Payment Mode': o.modeOfPayment,
      'Delivery Charges': o.deliveryCharges,
      'Units': o.units,
      'Profit': o.deliveryCharges - o.outsourceCharges,
      'Remark': o.remark
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `MS_Delivery_Orders_${filter.replace(' ', '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Business Overview</h1>
          <p className="text-neutral-500">Track your logistics performance and growth.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as DateFilter)}
              className="pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
            >
              {['Today', 'This Month', 'Last 3 Months', 'Last 6 Months', 'Yearly'].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Delivery Charges', value: formatCurrency(stats.totalDelivery), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Outsource Charges', value: formatCurrency(stats.totalOutsource), icon: ArrowDownRight, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Total Profit', value: formatCurrency(stats.totalProfit), icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
            </div>
            <p className="text-sm font-medium text-neutral-500 mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-neutral-900">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">Recent Orders</h2>
          <span className="text-xs font-medium px-2 py-1 bg-neutral-100 text-neutral-600 rounded-lg">
            {filteredOrders.length} Orders Found
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Order #</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">Delivery</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">Profit</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-sm text-indigo-600 font-medium">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{format(new Date(order.orderDate), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4 text-sm text-neutral-900 font-medium">{order.clientName}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{order.customerName}</td>
                  <td className="px-6 py-4 text-sm text-neutral-900 font-medium text-right">{formatCurrency(order.deliveryCharges)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">
                    {formatCurrency(order.deliveryCharges - order.outsourceCharges)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setEditingOrder(order)}
                      className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    No orders found for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
              onClick={() => setEditingOrder(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="p-8 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-2xl font-bold text-neutral-900">Edit Order {editingOrder.orderNumber}</h2>
                <button onClick={() => setEditingOrder(null)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateOrder} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700">Order Date</label>
                    <input 
                      type="date"
                      value={editingOrder.orderDate}
                      onChange={(e) => setEditingOrder({...editingOrder, orderDate: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700">Client</label>
                    <select 
                      value={editingOrder.clientId}
                      onChange={(e) => setEditingOrder({...editingOrder, clientId: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.clientName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700">Pickup Location</label>
                  <textarea 
                    value={editingOrder.pickupLocation}
                    onChange={(e) => setEditingOrder({...editingOrder, pickupLocation: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700">Customer Name</label>
                    <input 
                      type="text"
                      value={editingOrder.customerName}
                      onChange={(e) => setEditingOrder({...editingOrder, customerName: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700">Customer Contact</label>
                    <input 
                      type="tel"
                      value={editingOrder.customerContact}
                      onChange={(e) => setEditingOrder({...editingOrder, customerContact: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700">Drop Location</label>
                  <textarea 
                    value={editingOrder.dropLocation}
                    onChange={(e) => setEditingOrder({...editingOrder, dropLocation: e.target.value})}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700">Delivery Charges</label>
                    <input 
                      type="number"
                      value={editingOrder.deliveryCharges}
                      onChange={(e) => setEditingOrder({...editingOrder, deliveryCharges: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700">Outsource Charges</label>
                    <input 
                      type="number"
                      value={editingOrder.outsourceCharges}
                      onChange={(e) => setEditingOrder({...editingOrder, outsourceCharges: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="flex-1 px-6 py-4 bg-neutral-100 text-neutral-600 font-bold rounded-2xl hover:bg-neutral-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[100]"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-bold">Order Updated!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
