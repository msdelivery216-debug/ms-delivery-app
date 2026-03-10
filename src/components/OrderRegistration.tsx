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
    orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
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
          orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
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
                      readOnly
                      type="text"
                      value={formData.orderNumber}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl font-mono text-indigo-600 font-bold outline-none"
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
                        className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700 ml-1">Client Name</label>
                  <select 
                    required
                    value={formData.clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    <option value="">Select a client</option>
                    {/* UPDATED: Maps over MongoDB _id and name */}
                    {clients.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700 ml-1">Pickup Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3 w-5 h-5 text-neutral-400" />
                    <textarea 
                      required
                      value={formData.pickupLocation}
                      onChange={(e) => setFormData({...formData, pickupLocation: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                      placeholder="Auto-filled from client address"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-neutral-900">Customer Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700 ml-1">Customer Name</label>
                    <input 
                      required
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Receiver's name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700 ml-1">Customer Contact</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input 
                        required
                        type="tel"
                        value={formData.customerContact}
                        onChange={(e) => setFormData({...formData, customerContact: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="+91 00000 00000"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700 ml-1">Drop Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3 w-5 h-5 text-neutral-400" />
                    <textarea 
                      required
                      value={formData.dropLocation}
                      onChange={(e) => setFormData({...formData, dropLocation: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                      placeholder="Full delivery address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700 ml-1">Map Pin URL (Optional)</label>
                  <div className="relative">
                    <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input 
                      type="url"
                      value={formData.mapPinUrl}
                      onChange={(e) => setFormData({...formData, mapPinUrl: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Google Maps link"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-neutral-100">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-neutral-900">Financials & Logistics</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700 ml-1">Outsource Name</label>
                    <input 
                      type="text"
                      value={formData.outsourceName}
                      onChange={(e) => setFormData({...formData, outsourceName: e.target.value})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Rider or Vendor name"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Outsource Charges */}
  <div className="space-y-2">
    <label className="text-sm font-semibold text-neutral-700 ml-1">Outsource Charges (AED)</label>
    <input 
      type="text" 
      value={formData.outsourceCharges}
      onChange={(e) => {
        // Only allow numbers and one decimal point
        const val = e.target.value.replace(/[^0-9.]/g, '');
        setFormData({...formData, outsourceCharges: parseFloat(val) || 0});
      }}
      /* Inline style to be 100% sure arrows stay hidden */
      style={{ appearance: 'none', MozAppearance: 'textfield' }}
      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
      placeholder="0.00"
    />
  </div>

  {/* Delivery Charges */}
  <div className="space-y-2">
    <label className="text-sm font-semibold text-neutral-700 ml-1">Delivery Charges (AED)</label>
    <input 
      required
      type="text" 
      value={formData.deliveryCharges}
      onChange={(e) => {
        const val = e.target.value.replace(/[^0-9.]/g, '');
        setFormData({...formData, deliveryCharges: parseFloat(val) || 0});
      }}
      style={{ appearance: 'none', MozAppearance: 'textfield' }}
      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
      placeholder="0.00"
    />
  </div>
</div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700 ml-1">Units</label>
                    <div className="relative">
                      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input 
                        type="number"
                        value={formData.units}
                        onChange={(e) => setFormData({...formData, units: parseInt(e.target.value) || 1})}
                        className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700 ml-1">Payment Mode</label>
                    <select 
                      value={formData.modeOfPayment}
                      onChange={(e) => setFormData({...formData, modeOfPayment: e.target.value as any})}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                    >
                      <option value="Cash On Pickup">Cash On Pickup</option>
                      <option value="Cash On Delivery">Cash On Delivery</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-neutral-700 ml-1">Estimated Profit</label>
                    <div className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl font-bold text-emerald-700">
                      {formatCurrency(formData.deliveryCharges - formData.outsourceCharges)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700 ml-1">Remark</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-3 w-5 h-5 text-neutral-400" />
                    <textarea 
                      value={formData.remark}
                      onChange={(e) => setFormData({...formData, remark: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]"
                      placeholder="Any special instructions..."
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-indigo-600 text-white font-bold text-lg rounded-3xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3"
              >
                <Package className="w-6 h-6" />
                Register Order
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900">Latest Orders</h2>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">Last 15</span>
          </div>
          
          <div className="space-y-4 max-h-[1200px] overflow-y-auto pr-2 custom-scrollbar">
            {latestOrders.map((order) => (
              <motion.div
                key={order._id || order.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono font-bold text-indigo-600">{order.orderNumber}</span>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">{format(new Date(order.orderDate), 'dd MMM')}</span>
                </div>
                <h4 className="font-bold text-neutral-900 mb-1 truncate">{order.customerName}</h4>
                <p className="text-xs text-neutral-500 mb-3 truncate">{order.dropLocation}</p>
                <div className="flex justify-between items-center pt-3 border-t border-neutral-50">
                  <span className="text-xs font-medium text-neutral-400">{order.clientName || 'Client'}</span>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(order.deliveryCharges)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">Order Registered!</h3>
                <p className="text-neutral-500">
                  Your order <span className="font-mono font-bold text-indigo-600">{showSuccess}</span> has been submitted successfully.
                </p>
              </div>
              <button 
                onClick={() => setShowSuccess(null)}
                className="w-full py-4 bg-neutral-900 text-white font-bold rounded-2xl hover:bg-neutral-800 transition-all"
              >
                Great, thanks!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}