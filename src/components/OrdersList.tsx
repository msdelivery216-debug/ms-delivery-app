import React, { useState, useEffect } from 'react';
import { Search, Trash2, Edit, Calendar, User, MapPin, Package } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

export default function OrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // FIX 1: Array state to hold specific selected order IDs
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
      // Select all visible (filtered) orders
      setSelectedOrders(filteredOrders.map(order => order._id));
    } else {
      // Deselect all
      setSelectedOrders([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) 
        ? prev.filter(orderId => orderId !== id) // Remove if already selected
        : [...prev, id] // Add if not selected
    );
  };

  // --- ACTION BUTTON HANDLERS ---
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    
    try {
      const res = await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        // Remove it from the UI immediately
        setOrders(orders.filter(order => order._id !== id));
        // Also remove from selected list if it was checked
        setSelectedOrders(prev => prev.filter(orderId => orderId !== id));
      } else {
        alert("Failed to delete order from database.");
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleEdit = (order: any) => {
    // We will hook this up to your Edit form next!
    alert(`Edit button clicked for Order: ${order.orderNumber}. We will route this to the edit page next!`);
  };

  // Filter logic
  const filteredOrders = orders.filter(order => 
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">All Orders</h1>
          <p className="text-neutral-500">Manage and track all deliveries</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search customer name or order number..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-neutral-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-6 py-4">
                  {/* Master Checkbox */}
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
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredOrders.map((order) => (
                <tr key={order._id} className={`hover:bg-neutral-50/50 transition-colors ${selectedOrders.includes(order._id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    {/* Individual Checkbox */}
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={selectedOrders.includes(order._id)}
                      onChange={() => handleSelectOne(order._id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-indigo-600">{order.orderNumber}</span>
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {order.orderDate ? format(new Date(order.orderDate), 'dd MMM yyyy') : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-neutral-800">{order.customerName}</span>
                      <span className="text-xs text-neutral-500">{order.customerContact}</span>
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
                    <div className="flex items-center gap-2">
                      {/* Edit Button */}
                      <button 
                        onClick={() => handleEdit(order)}
                        className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Edit Order"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      {/* Delete Button */}
                      <button 
                        onClick={() => handleDelete(order._id)}
                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Order"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-neutral-500">No orders found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
