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

  // NEW: EXPORT TO EXCEL FUNCTION
  const handleExport = () => {
    if (filteredOrders.length === 0) {
      alert("No orders available to export!");
      return;
    }

    // 1. Define the Excel Column Headers
    const headers = [
      "Order Number", "Order Date", "Customer Name", "Customer Contact", 
      "Pickup Location", "Drop Location", "Map Pin URL", "Outsource Name", 
      "Outsource Charges (AED)", "Delivery Charges (AED)", "Profit (AED)", 
      "Units", "Payment Mode", "Remark"
    ];

    // 2. Map the data to match the headers
    const csvData = filteredOrders.map(order => {
      // Clean up text fields to prevent commas from breaking the Excel columns
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

    // 3. Combine headers and data, then trigger download
    const csvContent = [headers.join(','), ...csvData].join('\n');
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

      {/* SEARCH AND ACTION BUTTONS */}
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
          {/* EXPORT BUTTON */}
          <button 
            onClick={handleExport}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 font-bold rounded-2xl border transition-all shadow-sm whitespace-nowrap bg-white text-indigo-600 border-neutral-200 hover:bg-indigo-50"
          >
            <Download className="w-5 h-5" />
            Export to Excel
          </button>

          {/* BULK DELETE BUTTON */}
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
                  <input type="checkbox" className="w-4 h-4 rounded border-neutral-300 text-
