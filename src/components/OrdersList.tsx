import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  CheckCircle2,
  ChevronDown,
  MoreVertical,
  Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Order, Client } from '../types';
import { formatCurrency, cn } from '../lib/utils';

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    Promise.all([fetchOrders(), fetchClients()]).finally(() => setLoading(false));
  }, []);

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data);
  };

  const fetchClients = async () => {
    const res = await fetch('/api/clients');
    const data = await res.json();
    setClients(data);
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    // CHANGED: The URL format now matches our MongoDB backend
    const res = await fetch(`/api/orders?id=${id}`, { method: 'DELETE' }); 
    
    if (res.ok) {
      // CHANGED: Checking for both id and _id to be safe with MongoDB
      setOrders(orders.filter(o => o.id !== id && o._id !== id));
      setShowToast({ message: 'Order deleted successfully', type: 'success' });
      setTimeout(() => setShowToast(null), 3000);
    } else {
      setShowToast({ message: 'Failed to delete order', type: 'error' });
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} orders?`)) return;
    
    // CHANGED: URL changed to '/api/orders' and method changed to 'DELETE'
    const res = await fetch('/api/orders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds })
    });
    
    if (res.ok) {
      setOrders(orders.filter(o => !selectedIds.includes(o.id) && !selectedIds.includes(o._id)));
      setSelectedIds([]);
      setShowToast({ message: 'Orders deleted successfully', type: 'success' });
      setTimeout(() => setShowToast(null), 3000);
    } else {
      setShowToast({ message: 'Failed to delete orders', type: 'error' });
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    const res = await fetch(`/api/orders/${editingOrder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingOrder)
    });
    if (res.ok) {
      setEditingOrder(null);
      fetchOrders();
      setShowToast({ message: 'Order updated successfully', type: 'success' });
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.clientName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">All Orders</h1>
          <p className="text-neutral-500">View and manage all delivery orders.</p>
        </div>
        
        {selectedIds.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleBulkDelete}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
          >
            <Trash className="w-5 h-5" />
            Delete Selected ({selectedIds.length})
          </motion.button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input 
            type="text"
            placeholder="Search by order #, customer, or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox"
                    checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Order #</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">Delivery</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className={cn(
                  "hover:bg-neutral-50/50 transition-colors group",
                  selectedIds.includes(order.id) && "bg-indigo-50/30"
                )}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-indigo-600 font-medium">{order.orderNumber}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{format(new Date(order.orderDate), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4 text-sm text-neutral-900 font-medium">{order.clientName}</td>
                  <td className="px-6 py-4 text-sm text-neutral-600">{order.customerName}</td>
                  <td className="px-6 py-4 text-sm text-neutral-900 font-medium text-right">{formatCurrency(order.deliveryCharges)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setEditingOrder(order)}
                        className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(order.id)}
                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    No orders found.
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
              
              <form onSubmit={handleUpdate} className="p-8 space-y-6">
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
            className={cn(
              "fixed bottom-8 right-8 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[100]",
              showToast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            )}
          >
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-bold">{showToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
