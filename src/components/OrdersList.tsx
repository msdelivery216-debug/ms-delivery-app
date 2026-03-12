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
      // Safely grab the ID whether it's stored as _id or id
      setSelectedOrders(filteredOrders.map(order => order._id || order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (!id) return;
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
        setOrders(orders.filter(order => (order._id || order.id) !== id));
        setSelectedOrders(prev => prev.filter(orderId => orderId !== id));
      } else {
        alert("Failed to delete order from database.");
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedOrders.length} selected orders? This cannot be undone.`)) return;
    
    try {
      await Promise.all(
        selectedOrders.map(id => 
          fetch(`/api/orders?id=${id}`, { method: 'DELETE' })
        )
      );
      setOrders(orders.filter(order => !selectedOrders.includes(order._id || order.id)));
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
        
        {/* Bulk Delete Button - Now ALWAYS visible, but disabled if nothing is selected */}
        <button 
          onClick={handleBulkDelete}
          disabled={selectedOrders.length === 0}
          className={`flex items-center justify-center gap-2 px-6 py-4 font-bold rounded-2xl border transition-all shadow-sm whitespace-nowrap w-full sm:w-auto
            ${selectedOrders.length > 0 
              ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 cursor-pointer' 
              : 'bg-neutral-50 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-60'}`}
        >
          <Trash2 className="w-5 h-5" />
          Delete Selected {selectedOrders.length > 0 ? `(${selectedOrders.length})` : ''}
        </button>
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
              {filteredOrders.map((order) => {
                const orderId = order._id || order.id; // Safe ID check
                return (
                  <tr key={orderId} className={`hover:bg-neutral-50/50 transition-colors ${selectedOrders.includes(orderId) ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        checked={selectedOrders.includes(orderId)}
                        onChange={() => handleSelectOne(orderId)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-indigo-600">{order.orderNumber}</span>
                        <span className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" /> {order.orderDate ? format(new Date(order.orderDate), 'dd MMM yyyy') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-800">{order.customerName}</span>
                          <span className="text-xs text-neutral-500">{order.customerContact}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start gap-1 text-xs">
                          <MapPin className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="truncate text-neutral-600">{order.pickupLocation}</span>
                        </div>
                        <div className="flex items-start gap-1 text-xs">
                          <Package className="w-3 h-3 text-orange-500 mt-0.5 shrink-0" />
                          <span className="truncate text-neutral-600 font-medium">{order.dropLocation}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-neutral-800">Del: {order.deliveryCharges || 0}</span>
                        <span className="text-[10px] text-neutral-400">Out: {order.outsourceCharges || 0}</span>
                        <span className="text-xs font-bold text-emerald-600 mt-1">
                          Profit: {(order.deliveryCharges || 0) - (order.outsourceCharges || 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(order)}
                          className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Edit Order"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(orderId)}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete Order"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-neutral-500 font-medium">
              No orders found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
