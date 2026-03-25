import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Edit2, X, AlertCircle } from 'lucide-react';

type TransactionType = 'COP' | 'COD' | 'CLIENT_PAID' | 'PREPAID' | 'PAYMENT_SENT' | 'PAYMENT_RECEIVED' | string;

interface Partner {
  id: string;
  name: string;
  type: 'OUTSOURCE' | 'CLIENT';
}

interface LedgerEntry {
  _id?: string;
  id?: string;
  partnerId: string;
  date: string;
  description: string;
  type: TransactionType;
  partnerShare: number;
  myShare: number;
  amount: number; 
  isManual?: boolean;
}

export default function PaymentSummary() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // 1. Fetch Partners from SQLite
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch('/api/partners'); 
        if (!response.ok) throw new Error('Failed to fetch partners');
        const data = await response.json();
        setPartners(data);
        if (data.length > 0) setActivePartnerId(data[0].id);
      } catch (err: any) {
        console.error(err);
        setError('Could not load partners. Ensure server.ts is running.');
      }
    };
    fetchPartners();
  }, []);

  // 2. Fetch Ledger Entries for Active Partner
  useEffect(() => {
    if (!activePartnerId) return;
    const fetchLedger = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/ledger?partnerId=${activePartnerId}`);
        if (!response.ok) throw new Error('Failed to fetch ledger');
        const data = await response.json();
        setEntries(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLedger();
  }, [activePartnerId]);

  const activePartner = partners.find(p => p.id === activePartnerId);

  // Calculate Net Balance
  const netBalance = useMemo(() => {
    return entries.reduce((acc, entry) => {
      if (entry.type === 'COP' || entry.type === 'COD') return acc + entry.myShare;
      if (entry.type === 'CLIENT_PAID' || entry.type === 'PREPAID') return acc - entry.partnerShare;
      if (entry.type === 'PAYMENT_RECEIVED') return acc - entry.amount;
      if (entry.type === 'PAYMENT_SENT') return acc + entry.amount;
      return acc;
    }, 0);
  }, [entries]);

  // Save or Update Payment
  const handleSavePayment = async (type: 'PAYMENT_SENT' | 'PAYMENT_RECEIVED') => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) return;
    
    const payload = {
      partnerId: activePartnerId,
      date: new Date().toISOString().split('T')[0],
      description: type === 'PAYMENT_SENT' ? 'Manual Payment Sent' : 'Manual Payment Received',
      type: type,
      amount: Number(paymentAmount)
    };

    try {
      if (editingEntryId) {
        const res = await fetch(`/api/ledger/${editingEntryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update');
        
        // Refresh ledger
        const ledgerRes = await fetch(`/api/ledger?partnerId=${activePartnerId}`);
        setEntries(await ledgerRes.json());
        setEditingEntryId(null);
      } else {
        const res = await fetch('/api/ledger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to save');
        
        const ledgerRes = await fetch(`/api/ledger?partnerId=${activePartnerId}`);
        setEntries(await ledgerRes.json());
      }
      setPaymentAmount('');
    } catch (err) {
      alert('Error saving payment. Check console.');
      console.error(err);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this manual transaction?')) return;
    try {
      const res = await fetch(`/api/ledger/${entryId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setEntries(entries.filter(e => e.id !== entryId));
    } catch (err) {
      alert('Error deleting transaction.');
      console.error(err);
    }
  };

  const startEdit = (entry: LedgerEntry) => {
    if (entry.id) {
      setEditingEntryId(entry.id);
      setPaymentAmount(entry.amount.toString());
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Sidebar Menu */}
      <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Partners & Clients</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {error ? (
            <div className="p-4 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          ) : partners.length === 0 ? (
            <div className="p-4 text-sm text-slate-500 text-center">Loading from database...</div>
          ) : (
            partners.map(partner => (
              <button
                key={partner.id}
                onClick={() => setActivePartnerId(partner.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activePartnerId === partner.id 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                <div className="flex flex-col">
                  <span>{partner.name}</span>
                  <span className={`text-[10px] font-bold tracking-wider uppercase mt-1 ${activePartnerId === partner.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {partner.type}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
        {!activePartnerId ? (
          <div className="h-full flex items-center justify-center text-slate-400">Select a partner to view their ledger.</div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6 text-slate-800">
              Account Summary: <span className="text-indigo-600">{activePartner?.name}</span>
            </h1>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
              <div className={`p-6 rounded-2xl shadow-sm border ${
                netBalance > 0 ? 'bg-emerald-50 border-emerald-200' : 
                netBalance < 0 ? 'bg-rose-50 border-rose-200' : 
                'bg-white border-slate-200'
              }`}>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Balance</h3>
                <p className={`text-3xl font-bold mt-2 ${
                  netBalance > 0 ? 'text-emerald-600' : 
                  netBalance < 0 ? 'text-rose-600' : 
                  'text-slate-800'
                }`}>
                  {netBalance > 0 ? `They owe you: ${Math.abs(netBalance)}` : 
                   netBalance < 0 ? `You owe them: ${Math.abs(netBalance)}` : 
                   'Settled (0)'}
                </p>
              </div>

              <div className={`p-6 bg-white rounded-2xl shadow-sm border xl:col-span-2 flex flex-col justify-center transition-all ${editingEntryId ? 'ring-2 ring-amber-400 border-amber-400' : 'border-slate-200'}`}>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-700">
                    {editingEntryId ? 'Edit Manual Settlement' : 'Record New Settlement'}
                  </label>
                  {editingEntryId && (
                    <button onClick={() => { setEditingEntryId(null); setPaymentAmount(''); }} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input 
                    type="number" 
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full sm:flex-1 border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow bg-slate-50"
                  />
                  <div className="flex w-full sm:w-auto gap-2">
                    <button 
                      onClick={() => handleSavePayment('PAYMENT_SENT')}
                      className="flex-1 sm:flex-none bg-rose-500 hover:bg-rose-600 text-white px-5 py-3 rounded-xl font-semibold transition-colors shadow-sm"
                    >
                      {editingEntryId ? 'Update Sent' : 'I Paid Them'}
                    </button>
                    <button 
                      onClick={() => handleSavePayment('PAYMENT_RECEIVED')}
                      className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-semibold transition-colors shadow-sm"
                    >
                      {editingEntryId ? 'Update Received' : 'They Paid Me'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 bg-white">
                <h3 className="font-bold text-slate-800">Transaction History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Description</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">{activePartner?.type === 'OUTSOURCE' ? 'Driver Cut' : 'Agency Cut'}</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Your Cut</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Balance Effect</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading ledger data...</td></tr>
                    ) : entries.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">No transactions found for this partner.</td></tr>
                    ) : (
                      entries.map((entry) => (
                        <tr key={entry.id} className={`hover:bg-slate-50 transition-colors ${editingEntryId === entry.id ? 'bg-amber-50/50' : ''}`}>
                          <td className="p-4 text-sm text-slate-600">{new Date(entry.date).toLocaleDateString()}</td>
                          <td className="p-4 text-sm text-slate-800 font-medium">
                            {entry.description}
                            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-500">{entry.type}</span>
                          </td>
                          <td className="p-4 text-sm text-slate-600">{entry.partnerShare > 0 ? entry.partnerShare : '-'}</td>
                          <td className="p-4 text-sm text-slate-600">{entry.myShare > 0 ? entry.myShare : '-'}</td>
                          <td className="p-4 text-sm font-medium">
                            {entry.type === 'COP' || entry.type === 'COD' ? <span className="text-emerald-600">+ {entry.myShare}</span> : null}
                            {entry.type === 'CLIENT_PAID' || entry.type === 'PREPAID' ? <span className="text-rose-600">- {entry.partnerShare}</span> : null}
                            {entry.type === 'PAYMENT_RECEIVED' ? <span className="text-rose-600">- {entry.amount}</span> : null}
                            {entry.type === 'PAYMENT_SENT' ? <span className="text-emerald-600">+ {entry.amount}</span> : null}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              {entry.isManual && (
                                <>
                                  <button onClick={() => startEdit(entry)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDelete(entry.id!)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
