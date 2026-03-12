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
        <div className="w-12 h-
