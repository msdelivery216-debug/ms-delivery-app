import React, { useState, useEffect } from 'react';
import { Search, Trash2, Edit, Calendar, User, MapPin, Package, X, Save, Download } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';

export default function OrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);

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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(filteredOrders.map(order => order._id || order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (!id) return;
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      const res = await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders(orders.filter(order => (order._id || order.id) !== id));
        setSelectedOrders(prev => prev.filter(orderId => orderId !== id));
      } else alert("Failed to delete order from database.");
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedOrders.length} selected orders?`)) return;
    try {
      await Promise.all(selectedOrders.map(id => fetch(`/api/orders?id=${id}`, { method: 'DELETE' })));
      setOrders(orders.filter(order => !selectedOrders.includes(order._id || order.id)));
      setSelectedOrders([]);
    } catch (error) {
      console.error("Bulk delete failed:", error);
      fetchOrders(); 
    }
  };

  const handleEdit = (order: any) => {
    setEditingOrder({ ...order }); 
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOrder)
      });

      if (res.ok) {
        setEditingOrder(null); 
        fetchOrders(); 
      } else {
        alert("Failed to save updates. Make sure your API supports PUT requests.");
      }
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  // EXPORT TO EXCEL FUNCTION
  const handleExport = () => {
    if (filteredOrders.length === 0) {
      alert("No orders available to export!");
      return;
    }

    const headers = [
      "Order Number", "Order Date", "Customer Name", "Customer Contact", 
      "Pickup Location", "Drop Location", "Map Pin URL", "Outsource Name", 
      "Outsource Charges (AED)", "Delivery Charges (AED)", "Profit (AED)", 
      "Units", "Payment Mode", "Remark"
    ];

    const csvData = filteredOrders.map(order => {
      const cleanText = (text: any) => `"${(text || '').toString().replace(/"/g, '""')}"`;
      
      return [
        cleanText(order.orderNumber),
        order.orderDate ? format(new Date(order.orderDate), 'yyyy-MM-dd') : '',
        cleanText(order.customerName),
        cleanText(order.customerContact),
        cleanText(order.pickupLocation),
        cleanText(order.dropLocation),
        cleanText(order.mapPinUrl),
        cleanText(order.outsourceName),
        order.outsourceCharges || 0,
        order.deliveryCharges || 0,
        (order.deliveryCharges || 0) - (order.outsourceCharges || 0),
        order.units || 1,
        cleanText(order.modeOfPayment),
        cleanText(order.remark)
      ].join(',');
    });

    // Added \uFEFF to force Excel to read standard UTF-8 text formatting
    const csvContent = "\uFEFF" + [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MS_Delivery_Orders_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <div className="space-y-6 relative">
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

      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
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
        
        <div className="flex w-full lg:w-auto items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 font-bold rounded-2xl border transition-all shadow-sm whitespace-nowrap bg-white text-indigo-600 border-neutral-200 hover:bg-indigo-50"
          >
            <Download className="w-5 h-5" />
            Export to Excel
          </button>

          <button 
            onClick={handleBulkDelete}
            disabled={selectedOrders.length === 0}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 font-bold rounded-2xl border transition-all shadow-sm whitespace-nowrap
              ${selectedOrders.length > 0 ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 cursor-pointer' : 'bg-neutral-50 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-60'}`}
          >
            <Trash2 className="w-5 h-5" />
            Delete Selected {selectedOrders.length > 0 ? `(${selectedOrders.length})` : ''}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-6 py-4 w-12">
                  <input type="checkbox" className="w-4 h-4 rounded border-neutral-300 text-indigo-600 cursor-pointer" onChange={handleSelectAll} checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0} />
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
                const orderId = order._id || order.id;
                return (
                  <tr key={orderId} className={`hover:bg-neutral-50/50 transition-colors ${selectedOrders.includes(orderId) ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox" className="w-4 h-4 rounded border-neutral-300 text-indigo-600 cursor-pointer" checked={selectedOrders.includes(orderId)} onChange={() => handleSelectOne(orderId)} />
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
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><User className="w-4 h-4" /></div>
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-800">{order.customerName}</span>
                          <span className="text-xs text-neutral-500">{order.customerContact}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start gap-1 text-xs"><MapPin className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" /><span className="truncate text-neutral-600">{order.pickupLocation}</span></div>
                        <div className="flex items-start gap-1 text-xs"><Package className="w-3 h-3 text-orange-500 mt-0.5 shrink-0" /><span className="truncate text-neutral-600 font-medium">{order.dropLocation}</span></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-neutral-800">Del: {order.deliveryCharges || 0}</span>
                        <span className="text-[10px] text-neutral-400">Out: {order.outsourceCharges || 0}</span>
                        <span className="text-xs font-bold text-emerald-600 mt-1">Profit: {(order.deliveryCharges || 0) - (order.outsourceCharges || 0)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(order)} className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Edit Order"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(orderId)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete Order"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredOrders.length === 0 && <div className="text-center py-12 text-neutral-500 font-medium">No orders found.</div>}
        </div>
      </div>

      {editingOrder && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 md:p-8 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">Edit Order</h2>
                <p className="text-neutral-500 text-sm mt-1">ID: <span className="font-mono text-indigo-600">{editingOrder.orderNumber}</span></p>
              </div>
              <button onClick={() => setEditingOrder(null)} className="p-3 hover:bg-neutral-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateOrder} className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 ml-1">Customer Name</label>
                  <input type="text" value={editingOrder.customerName || ''} onChange={(e) => setEditingOrder({...editingOrder, customerName: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 ml-1">Contact Details</label>
                  <input type="text" value={editingOrder.customerContact || ''} onChange={(e) => setEditingOrder({...editingOrder, customerContact: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 ml-1">Pickup Location</label>
                  <input type="text" value={editingOrder.pickupLocation || ''} onChange={(e) => setEditingOrder({...editingOrder, pickupLocation: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 ml-1">Drop Location</label>
                  <input type="text" value={editingOrder.dropLocation || ''} onChange={(e) => setEditingOrder({...editingOrder, dropLocation: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 ml-1">Delivery Charges (AED)</label>
                  <input type="number" value={editingOrder.deliveryCharges || 0} onChange={(e) => setEditingOrder({...editingOrder, deliveryCharges: Number(e.target.value)})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-700 ml-1">Outsource Charges (AED)</label>
                  <input type="number" value={editingOrder.outsourceCharges || 0} onChange={(e) => setEditingOrder({...editingOrder, outsourceCharges: Number(e.target.value)})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingOrder(null)} className="px-6 py-4 font-bold text-neutral-600 hover:bg-neutral-100 rounded-2xl transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
