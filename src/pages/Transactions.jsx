import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Search, 
  Trash2, 
  AlertTriangle,
  Receipt,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Transactions() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); 
  const [showReversed, setShowReversed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, showReversed]);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`transactions?showReversed=${showReversed}`);
      setTransactions(res.data);
    } catch (err) {
      setError('Failed to load transaction ledger records.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) return;
    const headers = ['Payment Date', 'Borrower Name', 'Phone', 'Amount (INR)', 'Payment Type', 'Notes'];
    const rows = filteredTransactions.map(tx => [
      new Date(tx.paymentDate).toLocaleDateString('en-IN'),
      tx.customerId?.name || 'Deleted Borrower',
      tx.customerId?.phone || '',
      tx.amount,
      tx.paymentType,
      `"${(tx.notes || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payment-ledger-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchTransactions();
  }, [showReversed]);

  const handleRevert = async (id) => {
    if (!window.confirm('Are you sure you want to revert/delete this transaction? This will restore the borrower outstanding balance.')) {
      return;
    }

    try {
      await api.delete(`transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revert transaction.');
    }
  };

  // Filter & Search
  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = typeFilter === 'all' || tx.paymentType === typeFilter;
    const matchesSearch = tx.customerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tx.customerId?.phone?.includes(searchQuery) ||
                          (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-text">Payment Ledger</h1>
          <p className="text-xs text-brand-dim mt-1.5 font-medium">Historical audit of all byaj (interest) and asal (principal) repayments received.</p>
        </div>
        {filteredTransactions.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand-accent hover:bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-brand-accent/25 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Ledger</span>
          </button>
        )}
      </div>

      {/* Filter Options & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Filters */}
        <div className="flex bg-brand-card border border-brand-border p-1 rounded-xl w-max">
          {[
            { id: 'all', label: 'All Payments' },
            { id: 'interest', label: 'Byaj (Interest)' },
            { id: 'principal', label: 'Asal (Principal)' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setTypeFilter(type.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                typeFilter === type.id 
                  ? 'bg-brand-accent text-white shadow' 
                  : 'text-brand-dim hover:text-brand-text dark:hover:text-white'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Toggle Reversed check box */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowReversed(!showReversed)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-brand-border text-xs text-brand-dim hover:text-brand-text dark:hover:text-white transition"
          >
            {showReversed ? <EyeOff className="w-4 h-4 text-brand-rose" /> : <Eye className="w-4 h-4 text-brand-emerald" />}
            <span>{showReversed ? 'Hide Reversed' : 'Show Reversed'}</span>
          </button>

          {/* Search */}
          <div className="flex items-center space-x-3 w-full max-w-xs bg-brand-card border border-brand-border rounded-xl px-3.5 py-2">
            <Search className="w-4 h-4 text-brand-dim" />
            <input
              type="text"
              placeholder="Search name or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs text-brand-text placeholder-brand-dim/50 outline-none w-full focus:ring-0 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin"></div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-brand-border p-12 text-center flex flex-col items-center justify-center space-y-3">
          <History className="w-8 h-8 text-brand-dim/30 animate-pulse" />
          <p className="text-xs text-brand-dim font-medium">No transaction records match your filters.</p>
        </div>
      ) : (
        <>
          <div className="glass-panel rounded-2xl border border-brand-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-bg/50 text-[10px] uppercase font-bold text-brand-dim">
                    <th className="p-4">Payment Date</th>
                    <th className="p-4">Borrower File</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Allocation</th>
                    <th className="p-4">Loan Details</th>
                    <th className="p-4">Payment Notes</th>
                    <th className="p-4 text-right">Revert Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40 font-medium text-brand-text dark:text-slate-300">
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx._id} className={`hover:bg-brand-border/10 transition ${tx.isReversed ? 'bg-brand-rose/5 opacity-60 line-through' : ''}`}>
                      <td className="p-4 text-brand-dim">
                        {new Date(tx.paymentDate).toLocaleDateString('en-IN', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric'
                        })}
                      </td>
                      <td 
                        onClick={() => navigate(`/customers/${tx.customerId?._id}`)}
                        className="p-4 font-bold text-brand-text hover:text-brand-accent hover:underline cursor-pointer"
                      >
                        {tx.customerId?.name || 'Deleted Borrower'}
                        <span className="text-[10px] text-brand-dim font-normal block mt-0.5">{tx.customerId?.phone || '—'}</span>
                      </td>
                      <td className={`p-4 font-extrabold ${tx.isReversed ? 'text-brand-dim' : tx.paymentType === 'principal' ? 'text-brand-rose' : 'text-brand-emerald'}`}>
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        {tx.isReversed ? (
                          <span className="px-2 py-0.5 rounded bg-brand-rose/20 text-brand-rose border border-brand-rose/30 text-[9px] font-bold uppercase">REVERSED</span>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            tx.paymentType === 'principal' 
                              ? 'bg-brand-rose/10 text-brand-rose border border-brand-rose/20' 
                              : 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20'
                          }`}>
                            {tx.paymentType === 'principal' ? 'Asal (Principal)' : 'Byaj (Interest)'}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-brand-dim">
                        {tx.loanId ? (
                          <span>₹{tx.loanId.principalAmount?.toLocaleString('en-IN')} ({tx.loanId.interestRate}% {tx.loanId.rateType})</span>
                        ) : (
                          <span className="italic text-brand-rose/60">Loan Agreement Deleted</span>
                        )}
                      </td>
                      <td className="p-4 text-brand-dim truncate max-w-[200px]" title={tx.notes}>{tx.notes || '—'}</td>
                      <td className="p-4 text-right">
                        {!tx.isReversed && (
                          <button
                            onClick={() => handleRevert(tx._id)}
                            className="p-2 rounded-lg bg-brand-rose/5 text-brand-rose/70 hover:text-white hover:bg-brand-rose transition"
                            title="Revert Payment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
        </>
      )}

    </div>
  );
}
