import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, Calendar as CalendarIcon, MapPin, User, Phone, 
  ExternalLink, IndianRupee, Layers, MessageSquare, CheckCircle2, Package
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';

// We define the updated Client type here to match MongoDB
interface MongoClient {
  _id: string;
  name: string;
  address: string;
  phone: string;
}

export default function OrderRegistration() {
  const [clients, setClients] = useState<MongoClient[]>([]);
  const [latestOrders, setLatestOrders] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    orderNumber: '',
    orderDate: format(new Date(), 'yyyy-MM-dd'),
    clientId: '',
    pickupLocation: '',
    customerName: '',
    dropLocation: '',
    mapPinUrl: '',
    customerContact: '',
    outsourceName: '',
    outsourceCharges: 0,
    modeOfPayment: 'Cash On Delivery' as const,
    deliveryCharges: 0,
    units: 1,
    remark: ''
  });

  useEffect(() => {
    fetchClients();
    fetchLatestOrders();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  };

  const fetchLatestOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setLatestOrders(data.slice(0, 15));
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  // UPDATED: Now looks for MongoDB's _id (string) and address fields
  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c._id === clientId);
    setFormData({
      ...formData,
      clientId,
      pickupLocation: client?.address || '' // Uses the new address field
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowSuccess(formData.orderNumber);
        setFormData({
          ...formData,
          orderNumber: '', // Resetting to blank instead of auto-generating
          customerName: '',
          dropLocation: '',
          mapPinUrl: '',
          customerContact: '',
          outsourceName: '',
          outsourceCharges: 0,
          deliveryCharges: 0,
          units: 1,
          remark: ''
        });
        fetchLatestOrders();
        setTimeout(() => setShowSuccess(null), 5000);
      } else {
        alert("Failed to save order. Make sure the orders backend is built!");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Order Registration</h1>
          <p className="text-neutral-500">Create new delivery orders and track them instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-xl shadow-neutral-100/50 overflow-hidden">
            <div className="p-8 md:p-10 space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-neutral-900">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700 ml-1">Order Number</label>
                    <input 
                      required
                      type="text"
                      value={formData.orderNumber}
                      onChange={(e) => setFormData({...formData, orderNumber: e.target.value})}
                      placeholder="e.g. INV-001"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl font-mono text-indigo-600 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700 ml-1">Order Date</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input 
                        required
                        type="date"
                        value={formData.orderDate}
                        onChange={(e) => setFormData({...formData, orderDate: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none
