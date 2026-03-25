import React, { useState, useMemo } from 'react';

// --- Types & Interfaces ---
type TransactionType = 'COP' | 'COD' | 'CLIENT_PAID' | 'PAYMENT_SENT' | 'PAYMENT_RECEIVED';

interface Partner {
  id: string;
  name: string;
  type: 'OUTSOURCE' | 'CLIENT';
}

interface LedgerEntry {
  id: string;
  partnerId: string; // Ties the transaction to a specific agency/client
  date: string;
  description: string;
  type: TransactionType;
  partnerShare: number; // Formerly agencyShare
  myShare: number;
  amount: number; 
}

// --- Dummy Data (Replace with API calls later) ---
const PARTNERS: Partner[] = [
  { id: 'drv-01', name: 'Ahmed (Outsource)', type: 'OUTSOURCE' },
  { id: 'drv-02', name: 'Speedy Logistics', type: 'OUTSOURCE' },
  { id: 'cli-01', name: 'Downtown Bakery', type: 'CLIENT' },
  { id: 'cli-02', name: 'Sugar & Spice Dubai', type: 'CLIENT' },
];

const INITIAL_ENTRIES: LedgerEntry[] = [
  { id: '1', partnerId: 'drv-01', date: '2026-03-20', description: 'Order #101 (COP)', type: 'COP', partnerShare: 30, myShare: 15, amount: 0 },
  { id: '2', partnerId: 'drv-01', date: '2026-03-21', description: 'Order #102 (COD)', type: 'COD', partnerShare: 30, myShare: 15, amount: 0 },
  { id: '3', partnerId: 'cli-01', date: '2026-03-22', description: 'Bulk Delivery (Pre-paid)', type: 'CLIENT_PAID', partnerShare: 100, myShare: 40, amount: 0 },
];

export default function PaymentSummary() {
  const [entries, setEntries] = useState<LedgerEntry[]>(INITIAL_ENTRIES);
  const [activePartnerId, setActivePartnerId] = useState<string>(PARTNERS[0].id);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Get the currently selected partner object
  const activePartner = PARTNERS.find(p => p.id === activePartnerId);

  // Filter entries to only show the ones for the selected partner
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => entry.partnerId === activePartnerId);
  }, [entries, activePartnerId]);

  // Calculate Net Balance for the selected partner
  const netBalance = useMemo(() => {
    return filteredEntries.reduce((acc, entry) => {
      if (entry.type === 'COP' || entry.type === 'COD') return acc + entry.myShare;
      if (entry.type === 'CLIENT_PAID') return acc - entry.partnerShare;
      if (entry.type === 'PAYMENT_RECEIVED') return acc - entry.amount;
      if (entry.type === 'PAYMENT_SENT') return acc + entry.amount;
      return acc;
    }, 0);
  }, [filteredEntries]);

  // Handle manual payments
  const handlePayment = (type: 'PAYMENT_SENT' | 'PAYMENT_RECEIVED') => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) return;
    
    const newEntry: LedgerEntry = {
      id: Date.now().toString(),
      partnerId: activePartnerId, // Attach payment to the active partner
      date: new Date().toISOString().split('T')[0],
      description: type === 'PAYMENT_SENT' ? 'Manual Payment Sent' : 'Manual Payment Received',
      type: type,
      partnerShare: 0,
      myShare: 0,
      amount: Number(paymentAmount)
    };

    setEntries([...entries, newEntry]);
    setPaymentAmount(''); // Reset input
  };

  return (
    <div className="flex h-screen bg-gray-50 border-t border-gray-200">
      
      {/* LEFT COLUMN: Sidebar Menu */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Partners & Clients</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {PARTNERS.map(partner => (
            <button
              key={partner.id}
              onClick={() => setActivePartnerId(partner.id)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activePartnerId === partner.id 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100 border border-transparent'
              }`}
            >
              <div className="flex flex-col">
                <span>{partner.name}</span>
                <span className="text-xs font-normal text-gray-400 mt-1">{partner.type}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: Ledger & Dashboard */}
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Account Summary: {activePartner?.name}
        </h1>
        
        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <div className={`p-6 rounded-xl shadow-sm border ${
            netBalance > 0 ? 'bg-green-50 border-green-200' : 
            netBalance < 0 ? 'bg-red-50 border-red-200' : 
            'bg-white border-gray-200'
          }`}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Current Balance</h3>
            <p className={`text-3xl font-bold mt-2 ${
              netBalance > 0 ? 'text-green-600' : 
              netBalance < 0 ? 'text-red-600' : 
              'text-gray-800'
            }`}>
              {netBalance > 0 ? `They owe you: ${Math.abs(netBalance)}` : 
               netBalance < 0 ? `You owe them: ${Math.abs(netBalance)}` : 
               'Settled (0)'}
            </p>
          </div>

          {/* Payment Action Area */}
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-2 flex flex-col justify-center">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Record Settlement</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount..."
                className="flex-1 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
              <button 
                onClick={() => handlePayment('PAYMENT_SENT')}
                className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-5 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap"
              >
                I Paid Them
              </button>
              <button 
                onClick={() => handlePayment('PAYMENT_RECEIVED')}
                className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-5 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap"
              >
                They Paid Me
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-700">Transaction History</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">{activePartner?.type === 'OUTSOURCE' ? 'Driver Cut' : 'Agency Cut'}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Your Cut</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Balance Effect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 italic">No transactions found for this partner.</td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm text-gray-600">{entry.date}</td>
                    <td className="p-4 text-sm text-gray-800 font-medium">
                      {entry.description}
                      <span className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-gray-100 rounded text-gray-500">{entry.type}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{entry.partnerShare > 0 ? entry.partnerShare : '-'}</td>
                    <td className="p-4 text-sm text-gray-600">{entry.myShare > 0 ? entry.myShare : '-'}</td>
                    <td className="p-4 text-sm font-medium">
                      {entry.type === 'COP' || entry.type === 'COD' ? <span className="text-green-600">+ {entry.myShare}</span> : null}
                      {entry.type === 'CLIENT_PAID' ? <span className="text-red-600">- {entry.partnerShare}</span> : null}
                      {entry.type === 'PAYMENT_RECEIVED' ? <span className="text-red-600">- {entry.amount} (Settled)</span> : null}
                      {entry.type === 'PAYMENT_SENT' ? <span className="text-green-600">+ {entry.amount} (Settled)</span> : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}