import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  UserPlus, 
  Phone, 
  MapPin, 
  Coins, 
  ShieldCheck, 
  Trash2, 
  Eye,
  ShieldAlert,
  SlidersHorizontal,
  RotateCcw,
  Upload,
  Edit
} from 'lucide-react';
import { customerAPI } from '../api';
import NewCustomerModal from '../components/NewCustomerModal';
import BulkImportModal from '../components/BulkImportModal';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Advanced Filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [collateralFilter, setCollateralFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loanCountFilter, setLoanCountFilter] = useState('all');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerAPI.getAll();
      setCustomers(data);
    } catch (err) {
      setError('Failed to fetch borrowers directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Avoid triggering card click redirect
    if (!window.confirm('Are you sure you want to delete this borrower? This cannot be undone.')) {
      return;
    }

    try {
      await customerAPI.delete(id);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customer file.');
    }
  };

  // Filter customers by search & advanced criteria
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.phone.includes(searchQuery);

    const matchesCollateral = collateralFilter === 'all' || c.collateralType?.toLowerCase() === collateralFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || c.status?.toLowerCase() === statusFilter.toLowerCase();
    
    const matchesLoanCount = loanCountFilter === 'all' || 
                             (loanCountFilter === 'active' && c.activeLoansCount > 0) ||
                             (loanCountFilter === 'none' && c.activeLoansCount === 0);

    return matchesSearch && matchesCollateral && matchesStatus && matchesLoanCount;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Borrowers Directory</h1>
          <p className="text-xs text-brand-dim mt-1.5 font-medium">Manage borrowing files, guarantor contacts, and asset collaterals.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl border border-brand-border hover:bg-brand-bg text-xs font-bold text-brand-dim hover:text-brand-text dark:hover:text-white transition"
          >
            <Upload className="w-4 h-4" />
            <span>Excel Import</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand-accent hover:bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-brand-accent/25 transition"
          >
            <UserPlus className="w-4.5 h-4.5" />
            <span>Register Borrower</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center space-x-3 w-full max-w-lg">
        <div className="flex items-center space-x-3 flex-1 bg-brand-card border border-brand-border rounded-xl px-3.5 py-2.5">
          <Search className="w-4.5 h-4.5 text-brand-dim" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs text-brand-text placeholder-brand-dim/50 outline-none w-full focus:ring-0 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`p-3 rounded-xl border transition ${
            showAdvanced || collateralFilter !== 'all' || statusFilter !== 'all' || loanCountFilter !== 'all'
              ? 'bg-brand-accent/20 border-brand-accent text-brand-accent'
              : 'bg-brand-card border-brand-border text-brand-dim hover:text-brand-text dark:hover:text-white'
          }`}
          title="Toggle Advanced Filters"
        >
          <SlidersHorizontal className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="glass-panel border border-brand-border rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-down">
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

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-brand-dim uppercase tracking-wider">KYC Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="blocked">Blocked Accounts</option>
            </select>
          </div>

          <div className="space-y-1.5 flex flex-col justify-between">
            <div>
              <label className="text-[9px] font-bold text-brand-dim uppercase tracking-wider">Active Lending files</label>
              <select
                value={loanCountFilter}
                onChange={(e) => setLoanCountFilter(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
              >
                <option value="all">Any Loan Count</option>
                <option value="active">Has Active Loans</option>
                <option value="none">No Active Loans</option>
              </select>
            </div>
            {(collateralFilter !== 'all' || statusFilter !== 'all' || loanCountFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setCollateralFilter('all');
                  setStatusFilter('all');
                  setLoanCountFilter('all');
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

      {/* Directory Content */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin"></div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-brand-border p-12 text-center flex flex-col items-center justify-center space-y-3">
          <ShieldAlert className="w-8 h-8 text-brand-dim/30 animate-pulse" />
          <p className="text-xs text-brand-dim">No borrowers found. Register one to begin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map((customer) => (
            <div
              key={customer._id}
              onClick={() => navigate(`/customers/${customer._id}`)}
              className="glass-panel glass-panel-hover border border-brand-border p-6 rounded-2xl cursor-pointer flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                {/* File Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{customer.name}</h3>
                    <div className="flex items-center space-x-1.5 text-[10px] text-brand-dim font-medium mt-1">
                      <Phone className="w-3 h-3 text-brand-accent" />
                      <span>{customer.phone}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    customer.status === 'Active' 
                      ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20' 
                      : 'bg-brand-rose/10 text-brand-rose border border-brand-rose/20'
                  }`}>
                    {customer.status}
                  </span>
                </div>

                {/* Collateral (Girvi) Display */}
                {customer.collateralType !== 'None' ? (
                  <div className="bg-brand-bg/50 border border-brand-border p-2.5 rounded-xl flex items-start space-x-2.5">
                    <Coins className="w-4 h-4 text-brand-amber shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[9px] uppercase font-bold text-brand-amber">Girvi: {customer.collateralType}</span>
                      <p className="text-[10px] text-brand-dim font-medium leading-normal mt-0.5">{customer.collateralDescription || '—'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-brand-dim/60 font-semibold italic bg-brand-bg/25 border border-brand-border/40 p-2.5 rounded-xl">
                    No collateral asset registered.
                  </div>
                )}

                {/* Address & Guarantor short details */}
                <div className="space-y-1.5 text-[11px] text-brand-dim font-medium">
                  {customer.address && (
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-dim/75" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  )}
                  {customer.guarantorName && (
                    <div className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald" />
                      <span>Guarantor: {customer.guarantorName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between border-t border-brand-border/40 pt-4">
                <span className="text-[10px] text-brand-dim font-bold uppercase tracking-wider">
                  {customer.activeLoansCount} Active Loans
                </span>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/customers/${customer._id}`);
                    }}
                    className="p-2 rounded-lg bg-brand-border/50 text-brand-dim hover:text-white hover:bg-brand-border transition"
                    title="View details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCustomer(customer);
                      setIsModalOpen(true);
                    }}
                    className="p-2 rounded-lg bg-brand-accent/10 text-brand-accent hover:text-white hover:bg-brand-accent transition"
                    title="Edit profile"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(customer._id, e)}
                    className="p-2 rounded-lg bg-brand-rose/5 text-brand-rose/70 hover:text-white hover:bg-brand-rose transition"
                    title="Delete customer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <NewCustomerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        onRefresh={fetchCustomers}
        editingCustomer={editingCustomer}
      />

      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onRefresh={fetchCustomers}
      />

    </div>
  );
}
