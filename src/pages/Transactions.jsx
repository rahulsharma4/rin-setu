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
import axios from 'axios';
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

  const headers = { Authorization: `Bearer ${token}` };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5001/api/transactions?showReversed=${showReversed}`, { headers });
      setTransactions(res.data);
    } catch (err) {
      setError('Failed to load transaction ledger records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [showReversed]);

  const handleRevert = async (id) => {
    if (!window.confirm('Are you sure you want to revert/delete this transaction? This will restore the borrower outstanding balance.')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5001/api/transactions/${id}`, { headers });
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

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-text">Payment Ledger</h1>
          <p className="text-xs text-brand-dim mt-1.5 font-medium">Historical audit of all byaj (interest) and asal (principal) repayments received.</p>
        </div>
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
              <tbody className="divide-y divide-brand-border/40">
                {filteredTransactions.map((tx) => (
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
      )}

    </div>
  );
}
