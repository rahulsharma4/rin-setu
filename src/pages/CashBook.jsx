import React, { useState, useEffect } from 'react';
import { CircleDollarSign, Plus, ArrowUpRight, ArrowDownRight, RefreshCw, Trash2, CalendarCheck, ShieldAlert, Sparkles } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function CashBook() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtering & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter]);

  // Form states for manual entry
  const [form, setForm] = useState({
    type: 'opening_balance',
    amount: '',
    paymentMode: 'cash',
    notes: '',
  });

  const headers = { Authorization: `Bearer ${token}` };

  const fetchCashBook = async () => {
    setLoading(true);
    try {
      const res = await api.get('reports/cashbook');
      setData(res.data);
    } catch {
      setError('Failed to load cash book details.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data?.entries || data.entries.length === 0) return;
    const headers = ['Date', 'Type', 'Amount', 'Mode', 'Notes'];
    const rows = data.entries.map(e => [
      new Date(e.paymentDate).toLocaleDateString('en-IN'),
      e.type,
      e.amount,
      e.paymentMode,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cashbook-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => { fetchCashBook(); }, []);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount) return;

    setBtnLoading(true);
    let type = form.type;
    let notes = form.notes;

    if (form.type.startsWith('expense_')) {
      type = 'expense';
      const sub = form.type.replace('expense_', '').toUpperCase();
      notes = `[${sub}] ${form.notes}`;
    } else if (form.type.startsWith('income_')) {
      if (form.type === 'income_penalty') {
        type = 'penalty_charge';
      } else {
        type = 'collection';
        const sub = form.type.replace('income_', '').replace('_', ' ').toUpperCase();
        notes = `[${sub}] ${form.notes}`;
      }
    }

    try {
      await api.post('reports/cashbook', {
        ...form,
        type,
        notes
      });
      setForm({ type: 'opening_balance', amount: '', paymentMode: 'cash', notes: '' });
      fetchCashBook();
    } catch (err) {
      alert('Failed to log entry.');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to revert this entry? This cannot be undone.')) return;
    try {
      await api.delete(`reports/cashbook/${id}`);
      fetchCashBook();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete entry.');
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { summary, entries } = data;

  const filteredEntries = (entries || []).filter((entry) => {
    const matchesType = typeFilter === 'all' || entry.type === typeFilter;
    const notesStr = entry.notes || '';
    const amountStr = String(entry.amount || '');
    const matchesSearch = 
      notesStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      amountStr.includes(searchQuery) ||
      (entry.paymentMode && entry.paymentMode.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesType && matchesSearch;
  });

  const totalItems = filteredEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + itemsPerPage);

  const getSubcategoryBadge = (notes) => {
    const match = notes?.match(/^\[(.*?)\]/);
    return match ? match[1] : null;
  };

  const getCleanNotes = (notes) => {
    return notes?.replace(/^\[.*?\]\s*/, '') || '—';
  };

  const cardStats = [
    { label: 'Opening Drawer Balance', value: `₹${summary.openingBalance.toLocaleString('en-IN')}`, icon: CircleDollarSign, color: 'indigo' },
    { label: 'Total Collections (+)', value: `₹${summary.totalCollected.toLocaleString('en-IN')}`, icon: ArrowUpRight, color: 'emerald' },
    { label: 'Total Disbursements (-)', value: `₹${summary.totalDisbursed.toLocaleString('en-IN')}`, icon: ArrowDownRight, color: 'rose' },
    { label: 'Closing Cash Position', value: `₹${summary.closingBalance.toLocaleString('en-IN')}`, icon: CircleDollarSign, color: 'amber' },
  ];

  const colorMap = {
    indigo: 'text-brand-accent bg-brand-accent/10 border-brand-accent/20',
    emerald: 'text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20',
    rose: 'text-brand-rose bg-brand-rose/10 border-brand-rose/20',
    amber: 'text-brand-amber bg-brand-amber/10 border-brand-amber/20',
  };

  return (
    <div className="space-y-7 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Cash Book</h1>
          <p className="text-xs text-brand-dim mt-1.5 font-medium">Reconcile opening drawer totals, collections receipts, and loan disbursements.</p>
        </div>
        <button
          onClick={fetchCashBook}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-dim hover:text-white hover:bg-brand-border/40 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardStats.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`glass-panel border rounded-2xl p-5 space-y-3 glow-${card.color}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[card.color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold text-brand-dim uppercase tracking-wider">{card.label}</span>
                <p className="text-lg font-extrabold text-white mt-1">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Journal Entries */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border/40 pb-3 flex-wrap gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">Cash Book Journal Table</h3>
              {filteredEntries.length > 0 && (
                <button
                  onClick={exportToCSV}
                  className="px-2.5 py-1 bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent text-[9px] font-bold uppercase rounded-lg border border-brand-accent/25 transition"
                >
                  Export CSV
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <div className="w-full sm:flex-1 relative flex items-center bg-brand-bg border border-brand-border rounded-xl px-3 py-2">
                <input
                  type="text"
                  placeholder="Search notes or amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs text-brand-text placeholder-brand-dim/50 outline-none w-full focus:ring-0 focus:outline-none"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-44 bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-3 py-2 text-xs text-brand-text outline-none transition"
              >
                <option value="all">All Entries</option>
                <option value="collection">Collections</option>
                <option value="disbursement">Disbursements</option>
                <option value="opening_balance">Opening Balance</option>
                <option value="expense">Expenses</option>
                <option value="penalty_charge">Penalty Charges</option>
              </select>
            </div>
            
            {filteredEntries.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-brand-dim">
                No entries logged. Add opening balance to start.
              </div>
            ) : (
              <div className="overflow-x-auto border border-brand-border rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-brand-border bg-brand-bg/50 text-[10px] uppercase font-bold text-brand-dim">
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Mode</th>
                      <th className="p-3.5">Notes</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40 font-medium text-brand-text dark:text-slate-300">
                    {paginatedEntries.map((entry) => (
                      <tr key={entry._id} className="hover:bg-brand-border/10 transition">
                        <td className="p-3.5 text-brand-dim">
                          {new Date(entry.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                            entry.type === 'collection' ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20' :
                            entry.type === 'disbursement' ? 'bg-brand-rose/10 text-brand-rose border-brand-rose/20' :
                            entry.type === 'opening_balance' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' :
                            'bg-brand-border text-brand-dim border-transparent'
                          }`}>
                            {entry.type?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`p-3.5 font-bold ${
                          entry.type === 'collection' || entry.type === 'opening_balance' ? 'text-brand-emerald' : 'text-brand-rose'
                        }`}>
                          ₹{entry.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-brand-dim uppercase font-semibold text-[10px]">{entry.paymentMode}</td>
                        <td className="p-3.5 text-brand-dim truncate max-w-[150px]">
                          {getSubcategoryBadge(entry.notes) ? (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-brand-border text-white mr-1.5 border border-brand-border/40">
                              {getSubcategoryBadge(entry.notes)}
                            </span>
                          ) : null}
                          <span title={getCleanNotes(entry.notes)}>{getCleanNotes(entry.notes)}</span>
                        </td>
                        <td className="p-3.5 text-right">
                          {(!entry.transactionId && !entry.loanId) ? (
                            <button
                              onClick={() => handleDeleteEntry(entry._id)}
                              className="p-1.5 rounded bg-brand-rose/10 text-brand-rose hover:bg-brand-rose hover:text-white transition"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[9px] text-brand-dim font-bold uppercase tracking-wider bg-brand-border px-1.5 py-0.5 rounded">Auto</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Premium Pagination Control Footer */}
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-brand-border/40 text-xs text-brand-dim">
                <div className="flex items-center space-x-2">
                  <span>Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-brand-card border border-brand-border rounded-lg px-2 py-1 text-xs text-brand-text outline-none cursor-pointer focus:ring-0 focus:border-brand-accent/50"
                  >
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size} rows
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-brand-dim/80">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} items
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-brand-card border border-brand-border hover:bg-brand-bg disabled:opacity-40 disabled:hover:bg-brand-card text-brand-text transition font-bold"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                      .map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                            currentPage === page
                              ? 'bg-brand-accent text-white shadow shadow-brand-accent/20'
                              : 'bg-brand-card border border-brand-border hover:bg-brand-bg text-brand-text'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg bg-brand-card border border-brand-border hover:bg-brand-bg disabled:opacity-40 disabled:hover:bg-brand-card text-brand-text transition font-bold"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Log manual balance & Reconciliation chart */}
        <div className="space-y-6">
          
          {/* Manual Entry Form */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide flex items-center space-x-1.5">
              <CalendarCheck className="w-4 h-4 text-brand-accent" />
              <span>Log Manual Drawer Entry</span>
            </h3>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-brand-dim uppercase">Entry Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-3 py-2 text-xs text-brand-text dark:text-white outline-none transition"
                >
                  <option value="opening_balance">Set/Add Opening Balance</option>
                  <option value="expense_rent">Office Rent Expense (किराया)</option>
                  <option value="expense_salary">Staff Salary Expense (सैलरी)</option>
                  <option value="expense_tea">Tea & Snacks Expense (चाय-पानी)</option>
                  <option value="expense_misc">Other Miscellaneous Expense</option>
                  <option value="income_file_charge">File Processing Charge (फाइल चार्ज)</option>
                  <option value="income_commission">Brokerage / Commission (कमीशन)</option>
                  <option value="income_penalty">Extra Penalty Credit (जुर्माना)</option>
                  <option value="income_misc">Other Miscellaneous Income</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-brand-dim uppercase">Amount (Rupiya) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="e.g. 10000"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-3 py-2 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-brand-dim uppercase">Payment Mode</label>
                <select
                  value={form.paymentMode}
                  onChange={(e) => setForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-3 py-2 text-xs text-brand-text dark:text-white outline-none transition"
                >
                  <option value="cash">Cash (Drawer)</option>
                  <option value="online">UPI / QR Code</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-brand-dim uppercase">Notes/Description</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Rent payment or opening cash details"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-3 py-2 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={btnLoading}
                className="w-full py-2.5 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:opacity-40 text-xs font-bold text-white shadow shadow-brand-accent/20 transition-all"
              >
                {btnLoading ? 'Saving...' : 'Log Drawer Entry'}
              </button>
            </form>
          </div>

          {/* Reconciliation mode split ratios */}
          <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-brand-emerald" />
              <span>Payment Mode Reconciliation</span>
            </h3>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-dim font-medium">Cash Collections</span>
                <span className="font-bold text-white">₹{summary.collectionsSplit?.cash.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-dim font-medium">UPI / QR Code</span>
                <span className="font-bold text-white">₹{summary.collectionsSplit?.upi.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-dim font-medium">Bank Transfers</span>
                <span className="font-bold text-white">₹{summary.collectionsSplit?.bank.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-dim font-medium">Cheques Received</span>
                <span className="font-bold text-white">₹{summary.collectionsSplit?.cheque.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
