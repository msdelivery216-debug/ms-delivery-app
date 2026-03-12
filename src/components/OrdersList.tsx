import React, { useState, useEffect } from 'react';
import { Search, Trash2, Edit, Calendar, User, MapPin, Package } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

export default function OrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- CHECKBOX HANDLERS ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(filteredOrders.map(order => order._id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) 
        ? prev.filter(orderId => orderId !== id) 
        : [...prev, id]
    );
  };

  // --- ACTION BUTTON HANDLERS ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    
    try {
      const res = await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders(orders.filter(order => order._id !== id));
        setSelectedOrders(prev => prev.filter(orderId => orderId !== id));
      } else {
        alert("Failed to delete order from database.");
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedOrders.length} selected orders? This cannot be undone.`)) return;
    
    try {
      await Promise.all(
        selectedOrders.map(id => 
          fetch(`/api/orders?id=${id}`, { method: 'DELETE' })
        )
      );
      setOrders(orders.filter(order => !selectedOrders.includes(order._id)));
      setSelectedOrders([]);
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert("There was an error deleting some orders. Refreshing the list.");
      fetchOrders(); 
    }
  };

  const handleEdit = (order: any) => {
    alert(`Edit button clicked for Order: ${order.orderNumber}. We will route this to the edit page next!`);
  };

  // Filter logic
  const filteredOrders = orders.filter(order => 
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProfit = filteredOrders.reduce((acc, curr) => 
    acc + ((curr.deliveryCharges || 0) - (curr.outsourceCharges || 0)), 0
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-500 font-medium">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">All Orders</h1>
          <p className="text-neutral-500">Manage and track all deliveries</p>
        </div>
        
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col items-end shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Total Net Profit</span>
          <span className="text-2xl font-black text-emerald-700">{formatCurrency(totalProfit)}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search customer name or order number..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-neutral-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Bulk Delete Button - Only shows when checkboxes are selected */}
        {selectedOrders.length > 0 && (
          <button 
            onClick={handleBulkDelete}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-100 hover:bg-red-100 transition-all shadow-sm whitespace-nowrap"
          >
            <Trash2 className="w-5 h-5" />
            Delete Selected ({selectedOrders.length})
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                  />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase">Order Details</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase">Locations</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase">Financials (AED)</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredOrders.map((order) => (
                <tr key={order._id} className={`hover:bg-neutral-50/50 transition-colors ${selectedOrders.includes(order._id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleSelectOne(order._id)}
                    />
                  </td>
                  <td className="
