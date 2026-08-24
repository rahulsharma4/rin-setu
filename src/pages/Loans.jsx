import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  HandCoins, 
  Search, 
  Receipt, 
  Trash2, 
  AlertCircle,
  ShieldCheck,
  Plus,
  Edit,
  SlidersHorizontal,
  RotateCcw,
  Printer,
  X,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { loanAPI } from '../api';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import NewLoanModal from '../components/NewLoanModal';
import PrintModal from '../components/PrintModal';

export default function Loans() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loans, setLoans] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'paid', 'overdue'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewMode, setViewMode] = useState(() => localStorage.getItem('loans_view_mode') || 'grid');

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('loans_view_mode', mode);
  };

  // Modals state
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false);

  // Advanced Search filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minPrincipal, setMinPrincipal] = useState('');
  const [maxPrincipal, setMaxPrincipal] = useState('');
  const [collateralFilter, setCollateralFilter] = useState('all');
  const [overdueDaysFilter, setOverdueDaysFilter] = useState('all');

  // Print modal states
  const [printType, setPrintType] = useState('no_dues');
  const [printData, setPrintData] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const handlePrintCertificate = (loan) => {
    setPrintType('no_dues');
    setPrintData(loan);
    setIsPrintOpen(true);
  };

  // Edit Loan state
  const [editingLoan, setEditingLoan] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', remarks: '' });
  const [editLoading, setEditLoading] = useState(false);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const data = await loanAPI.getAll();
      setLoans(data);
    } catch (err) {
      setError('Failed to load loans list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Deleting this loan will also permanently remove all its payment transactions. Continue?')) {
      return;
    }
    try {
      await loanAPI.delete(id);
      fetchLoans();
    } catch (err) {
      alert('Failed to delete loan.');
    }
  };

  const handleEditClick = (loan) => {
    setEditingLoan(loan);
    setEditForm({
      status: loan.status,
      remarks: loan.remarks || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await api.put(
        `loans/${editingLoan._id}`,
        editForm
      );
      setEditingLoan(null);
      fetchLoans();
    } catch (err) {
      alert('Failed to update loan.');
    } finally {
      setEditLoading(false);
    }
  };

  // Filter & Search
  const filteredLoans = loans.filter((l) => {
    const calc = l.calculations || {};
    const matchesFilter = filter === 'all' || l.status === filter;
    const matchesSearch = l.customerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.customerId?.phone?.includes(searchQuery);

    // Advanced Filters
    const principal = l.principalAmount || 0;
    const matchesMinPrincipal = !minPrincipal || principal >= parseFloat(minPrincipal);
    const matchesMaxPrincipal = !maxPrincipal || principal <= parseFloat(maxPrincipal);

    const collateral = l.customerId?.collateralType || 'None';
    const matchesCollateral = collateralFilter === 'all' || collateral.toLowerCase() === collateralFilter.toLowerCase();

    const overdueDays = calc.overdueDays || 0;
    let matchesOverdueDays = true;
    if (overdueDaysFilter === '15') {
      matchesOverdueDays = overdueDays > 15;
    } else if (overdueDaysFilter === '30') {
      matchesOverdueDays = overdueDays > 30;
    } else if (overdueDaysFilter === '60') {
      matchesOverdueDays = overdueDays > 60;
    }

    return matchesFilter && matchesSearch && matchesMinPrincipal && matchesMaxPrincipal && matchesCollateral && matchesOverdueDays;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Lending Agreements</h1>
          <p className="text-xs text-brand-dim mt-1.5 font-medium">Overview of active, overdue, and settled byaj files.</p>
        </div>

        <button
          onClick={() => setIsNewLoanModalOpen(true)}
          className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand-accent hover:bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-brand-accent/25 transition"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Issue Loan</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Tabs */}
        <div className="flex bg-brand-card border border-brand-border p-1 rounded-xl w-max">
          {['all', 'active', 'overdue', 'paid'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                filter === tab 
                  ? 'bg-brand-accent text-white shadow' 
                  : 'text-brand-dim hover:text-brand-text dark:hover:text-white'
              }`}
            >
              {tab === 'paid' ? 'Settled' : tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2.5 w-full max-w-md">
          <div className="flex items-center space-x-3 flex-1 bg-brand-card border border-brand-border rounded-xl px-3.5 py-2">
            <Search className="w-4 h-4 text-brand-dim" />
            <input
              type="text"
              placeholder="Search borrower name/phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs text-brand-text placeholder-brand-dim/50 outline-none w-full focus:ring-0 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-2.5 rounded-xl border transition ${
              showAdvanced || minPrincipal || maxPrincipal || collateralFilter !== 'all' || overdueDaysFilter !== 'all'
                ? 'bg-brand-accent/20 border-brand-accent text-brand-accent'
                : 'bg-brand-card border-brand-border text-brand-dim hover:text-brand-text dark:hover:text-white'
            }`}
            title="Toggle Advanced Filters"
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </button>

          <div className="flex items-center border border-brand-border bg-brand-card rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => handleToggleViewMode('grid')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-brand-accent text-white font-bold' : 'text-brand-dim hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4.5 h-4.5" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('table')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'table' ? 'bg-brand-accent text-white font-bold' : 'text-brand-dim hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="glass-panel border border-brand-border rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 animate-slide-down">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-brand-dim uppercase tracking-wider">Min Principal (₹)</label>
            <input
              type="number"
              placeholder="Min value"
              value={minPrincipal}
              onChange={(e) => setMinPrincipal(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-brand-dim uppercase tracking-wider">Max Principal (₹)</label>
            <input
              type="number"
              placeholder="Max value"
              value={maxPrincipal}
              onChange={(e) => setMaxPrincipal(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-brand-dim uppercase tracking-wider">Collateral Asset (गिरवी)</label>
            <select
              value={collateralFilter}
              onChange={(e) => setCollateralFilter(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
            >
              <option value="all">All Collateral Types</option>
              <option value="gold">Gold (सोना)</option>
              <option value="silver">Silver (चांदी)</option>
              <option value="vehicle">Vehicle (गाड़ी)</option>
              <option value="land">Land/Property</option>
              <option value="documents">File Documents</option>
              <option value="none">No Collateral</option>
            </select>
          </div>

          <div className="space-y-1.5 flex flex-col justify-between">
            <div>
              <label className="text-[9px] font-bold text-brand-dim uppercase tracking-wider">Overdue Duration</label>
              <select
                value={overdueDaysFilter}
                onChange={(e) => setOverdueDaysFilter(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
              >
                <option value="all">Any Overdue Days</option>
                <option value="15">&gt; 15 Days Overdue</option>
                <option value="30">&gt; 30 Days Overdue</option>
                <option value="60">&gt; 60 Days Overdue</option>
              </select>
            </div>
            {(minPrincipal || maxPrincipal || collateralFilter !== 'all' || overdueDaysFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setMinPrincipal('');
                  setMaxPrincipal('');
                  setCollateralFilter('all');
                  setOverdueDaysFilter('all');
                }}
                className="flex items-center justify-center space-x-1.5 text-[10px] text-brand-rose hover:text-white font-bold transition mt-2 outline-none self-end"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loans Grid / Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin"></div>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-brand-border p-12 text-center flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="w-8 h-8 text-brand-dim/30 animate-pulse" />
          <p className="text-xs text-brand-dim">No matching loan agreements found.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="glass-panel border border-brand-border bg-brand-card rounded-2xl p-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border/60 text-[9px] text-brand-dim uppercase font-bold tracking-wider">
                  <th className="pb-3.5 pl-2">Borrower Name</th>
                  <th className="pb-3.5">Principal Amount</th>
                  <th className="pb-3.5">Rate & Interest Type</th>
                  <th className="pb-3.5">Status</th>
                  <th className="pb-3.5">Remaining Outstanding</th>
                  <th className="pb-3.5">Disbursement Date</th>
                  <th className="pb-3.5 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/30 text-brand-text dark:text-slate-300 font-medium">
                {filteredLoans.map((loan) => {
                  const calc = loan.calculations || {};
                  return (
                    <tr 
                      key={loan._id} 
                      onClick={() => navigate(`/customers/${loan.customerId?._id}`)}
                      className="hover:bg-brand-bg/40 transition cursor-pointer"
                    >
                      <td className="py-3.5 pl-2">
                        <div className="font-bold text-brand-text dark:text-white text-xs">{loan.customerId?.name || 'Deleted Borrower'}</div>
                        <div className="text-[10px] text-brand-dim mt-0.5">{loan.customerId?.phone || '—'}</div>
                      </td>
                      <td className="py-3.5 text-brand-text dark:text-slate-300 font-semibold">
                        ₹{loan.principalAmount.toLocaleString('en-IN')}
                        {loan.processingFee > 0 && (
                          <div className="text-[9px] text-brand-dim mt-0.5 font-normal">Fee: ₹{loan.processingFee}</div>
                        )}
                      </td>
                      <td className="py-3.5">
                        <div className="text-brand-text dark:text-slate-300 font-semibold">{loan.interestRate}% ({loan.rateType})</div>
                        <div className="text-[9px] text-brand-dim mt-0.5 capitalize">{loan.interestType}</div>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center space-x-1.5">
                          {loan.isExistingLoan && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Old
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            loan.status === 'paid' 
                              ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20' 
                              : loan.status === 'overdue'
                              ? 'bg-brand-rose/10 text-brand-rose border border-brand-rose/20'
                              : 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'
                          }`}>
                            {loan.status === 'paid' ? 'Settled' : loan.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 font-extrabold text-brand-accent">
                        ₹{calc.totalOutstanding?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 text-brand-dim font-mono">
                        {new Date(loan.startDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3.5 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditClick(loan)}
                            className="p-1.5 rounded bg-brand-accent/10 text-brand-accent hover:text-white hover:bg-brand-accent transition"
                            title="Edit Remarks/Status"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(loan._id)}
                            className="p-1.5 rounded bg-brand-rose/5 text-brand-rose/70 hover:text-white hover:bg-brand-rose transition"
                            title="Delete Loan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {loan.status !== 'paid' ? (
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-brand-emerald hover:bg-emerald-600 text-[10px] font-bold text-white transition"
                            >
                              Repay
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePrintCertificate(loan)}
                              className="p-1.5 rounded bg-brand-emerald/10 text-brand-emerald hover:bg-brand-emerald hover:text-white transition"
                              title="Print No Dues"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredLoans.map((loan) => {
            const calc = loan.calculations || {};
            return (
              <div 
                key={loan._id} 
                className={`glass-panel border rounded-2xl p-6 flex flex-col justify-between space-y-5 ${
                  loan.status === 'paid' ? 'border-brand-emerald/30' : 'border-brand-border'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Title Header */}
                  <div className="flex items-start justify-between">
                    <div onClick={() => navigate(`/customers/${loan.customerId?._id}`)} className="cursor-pointer">
                      <h3 className="text-sm font-extrabold text-white hover:text-brand-accent hover:underline transition">
                        {loan.customerId?.name || 'Deleted Borrower'}
                      </h3>
                      <span className="text-[10px] text-brand-dim font-medium mt-1 block">Phone: {loan.customerId?.phone || '—'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1.5">
                      {loan.isExistingLoan && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Existing / पुराना
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        loan.status === 'paid' 
                          ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20' 
                          : loan.status === 'overdue'
                          ? 'bg-brand-rose/10 text-brand-rose border border-brand-rose/20'
                          : 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'
                      }`}>
                        {loan.status === 'paid' ? 'Settled' : loan.status}
                      </span>
                    </div>
                  </div>

                  {/* Rules details grid */}
                  <div className="grid grid-cols-3 gap-2.5 bg-brand-bg/50 border border-brand-border p-3 rounded-xl text-[11px] font-medium text-brand-dim">
                    <div>
                      <span className="text-[9px] font-bold uppercase">Principal</span>
                      <p className="text-white mt-0.5">₹{loan.principalAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase">Rate</span>
                      <p className="text-white mt-0.5">{loan.interestRate}% ({loan.rateType})</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase">Type</span>
                      <p className="text-white mt-0.5 capitalize">{loan.interestType}</p>
                    </div>
                  </div>

                  {/* Financial ledger line */}
                  <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-brand-border/40">
                    <div>
                      <span className="text-[9px] text-brand-dim font-bold uppercase">Accrued Interest</span>
                      <p className="font-semibold text-white mt-0.5">₹{calc.totalInterestAccrued?.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-brand-dim font-bold uppercase">Interest Repaid</span>
                      <p className="font-semibold text-brand-emerald mt-0.5">₹{calc.totalInterestPaid?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Total remaining outstanding */}
                  <div className="flex justify-between items-center bg-brand-accent/5 border border-brand-accent/20 p-3 rounded-xl mt-2">
                    <span className="text-[9px] font-bold text-white uppercase">Remaining Outstanding</span>
                    <p className="text-sm font-extrabold text-brand-accent">₹{calc.totalOutstanding?.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="flex items-center justify-between border-t border-brand-border/40 pt-4 mt-2">
                  <span className="text-[9px] text-brand-dim font-semibold">
                    Start: {new Date(loan.startDate).toLocaleDateString('en-IN')}
                  </span>
                  
                  <div className="flex items-center space-x-2.5">
                    <button
                      onClick={() => handleEditClick(loan)}
                      className="p-2 rounded-lg bg-brand-accent/10 text-brand-accent hover:text-white hover:bg-brand-accent transition"
                      title="Edit Loan Remarks/Status"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(loan._id)}
                      className="p-2 rounded-lg bg-brand-rose/5 text-brand-rose/70 hover:text-white hover:bg-brand-rose transition"
                      title="Delete Loan File"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {loan.status !== 'paid' ? (
                      <button
                        onClick={() => {
                          setSelectedLoan(loan);
                          setIsPaymentModalOpen(true);
                        }}
                        className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-600 text-xs font-bold text-white shadow-lg shadow-brand-emerald/10 transition"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Record Repayment</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePrintCertificate(loan)}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-600 text-xs font-bold text-white shadow-lg shadow-brand-emerald/10 transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print No Dues</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Loan Metadata Modal */}
      {editingLoan && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl shadow-2xl animate-slide-up my-auto overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                  <Edit className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Update Loan Metadata</h2>
              </div>
              <button type="button" onClick={() => setEditingLoan(null)} className="text-brand-dim hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Loan Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                >
                  <option value="active">Active</option>
                  <option value="overdue">Overdue</option>
                  <option value="paid">Settled (Paid)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Loan Remarks</label>
                <input
                  type="text"
                  value={editForm.remarks}
                  onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Update loan documentation comments"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setEditingLoan(null)}
                  className="px-5 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-dim hover:text-white hover:bg-brand-border/30 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:bg-indigo-400 text-xs font-bold text-white shadow-lg shadow-brand-accent/20 transition"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modals */}
      {selectedLoan && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedLoan(null);
          }}
          onRefresh={fetchLoans}
          loanId={selectedLoan._id}
          customerId={selectedLoan.customerId?._id}
          customerName={selectedLoan.customerId?.name}
        />
      )}

      <NewLoanModal
        isOpen={isNewLoanModalOpen}
        onClose={() => setIsNewLoanModalOpen(false)}
        onRefresh={fetchLoans}
      />

      <PrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        type={printType}
        data={printData}
      />

    </div>
  );
}
