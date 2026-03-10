import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, MapPin, Phone, User, CheckCircle2, X, Edit2, Trash2, Trash
} from 'lucide-react';
import { cn } from '../lib/utils';

// We define the Client type here to match what MongoDB sends back
export interface Client {
  _id: string;
  name: string;
  address: string;
  phone: string;
  status?: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({
    name: '',
    address: '',
    phone: ''
  });

  useEffect(() => {
    fetchClients();
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        // Send a PUT request with the MongoDB _id as a query parameter
        await fetch(`/api/clients?id=${editingClient._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newClient)
        });
        setShowToast({ message: 'Client updated successfully', type: 'success' });
      } else {
        // Send a POST request to create a new client
        await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newClient)
        });
        setShowToast({ message: 'Client added successfully', type: 'success' });
      }
      
      setIsModalOpen(false);
      setEditingClient(null);
      setNewClient({ name: '', address: '', phone: '' });
      fetchClients(); // Refresh the list from the database
      
      setTimeout(() => setShowToast(null), 3000);
    } catch (error) {
      setShowToast({ message: 'Error saving client', type: 'error' });
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setClients(clients.filter(c => c._id !== id));
        setShowToast({ message: 'Client deleted successfully', type: 'success' });
        setTimeout(() => setShowToast(null), 3000);
      }
    } catch (error) {
      setShowToast({ message: 'Error deleting client', type: 'error' });
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} clients?`)) return;
    try {
      const res = await fetch('/api/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setClients(clients.filter(c => !selectedIds.includes(c._id)));
        setSelectedIds([]);
        setShowToast({ message: 'Clients deleted successfully', type: 'success' });
        setTimeout(() => setShowToast(null), 3000);
      }
    } catch (error) {
      setShowToast({ message: 'Error deleting clients', type: 'error' });
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setNewClient({
      name: client.name || '',
      address: client.address || '',
      phone: client.phone || ''
    });
    setIsModalOpen(true);
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredClients = clients.filter(c => {
    const nameMatch = c.name?.toLowerCase().includes(search.toLowerCase()) || false;
    const phoneMatch = c.phone?.includes(search) || false;
    return nameMatch || phoneMatch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Client Management</h1>
          <p className="text-neutral-500">Manage your business partners and their details.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
            >
              <Trash className="w-5 h-5" />
              Delete ({selectedIds.length})
            </motion.button>
          )}
          <button 
            onClick={() => {
              setEditingClient(null);
              setNewClient({ name: '', address: '', phone: '' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Plus className="w-5 h-5" />
            Add New Client
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input 
          type="text"
          placeholder="Search by name or contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <motion.div
            key={client._id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md transition-all group relative",
              selectedIds.includes(client._id) && "border-indigo-500 bg-indigo-50/30"
            )}
          >
            <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => openEditModal(client)}
                className="p-2 bg-white border border-neutral-100 text-neutral-400 hover:text-indigo-600 rounded-xl shadow-sm transition-all"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(client._id)}
                className="p-2 bg-white border border-neutral-100 text-neutral-400 hover:text-red-600 rounded-xl shadow-sm transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <input 
                  type="checkbox"
                  checked={selectedIds.includes(client._id)}
                  onChange={() => toggleSelect(client._id)}
                  className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl uppercase">
                  {(client.name || 'C').charAt(0)}
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-neutral-900 mb-4">{client.name}</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-neutral-500">
                <MapPin className="w-4 h-4 mt-0.5 text-neutral-400" />
                <span>{client.address || 'No address provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-500">
                <Phone className="w-4 h-4 text-neutral-400" />
                <span>{client.phone || 'No contact provided'}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-neutral-900">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-neutral-700 ml-1">Client Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input 
                    required
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Enter company or person name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-neutral-700 ml-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3 w-5 h-5 text-neutral-400" />
                  <textarea 
                    value={newClient.address}
                    onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px]"
                    placeholder="Enter full address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-neutral-700 ml-1">Contact Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input 
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="+91 00000 00000"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-neutral-100 text-neutral-600 font-bold rounded-2xl hover:bg-neutral-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  {editingClient ? 'Update Client' : 'Save Client'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

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