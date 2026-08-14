import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, HandCoins, Calculator, ShieldAlert, Table } from 'lucide-react';
import { customerAPI, loanAPI } from '../api';

// Helper functions for preview schedule calculation matching backend
function getPeriodicRateFraction(interestRate, rateType, paymentFrequency) {
  let annualRateFraction = 0;
  if (rateType === 'daily') annualRateFraction = (interestRate * 365) / 100;
  else if (rateType === 'weekly') annualRateFraction = (interestRate * 52) / 100;
  else if (rateType === 'monthly') annualRateFraction = (interestRate * 12) / 100;
  else if (rateType === 'yearly') annualRateFraction = interestRate / 100;
  
  if (paymentFrequency === 'daily') return annualRateFraction / 365;
  if (paymentFrequency === 'weekly') return annualRateFraction / 52;
  if (paymentFrequency === 'monthly') return annualRateFraction / 12;
  if (paymentFrequency === 'yearly') return annualRateFraction;
  return annualRateFraction / 12;
}

function getNextDate(startDate, paymentFrequency, index) {
  const nextDate = new Date(startDate);
  if (paymentFrequency === 'daily') nextDate.setDate(nextDate.setDate() + index);
  else if (paymentFrequency === 'weekly') nextDate.setDate(nextDate.getDate() + index * 7);
  else if (paymentFrequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + index);
  else if (paymentFrequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + index);
  return nextDate;
}

function generateLocalPreviewSchedule(loan) {
  const P = parseFloat(loan.principalAmount) || 0;
  const R = parseFloat(loan.interestRate) || 0;
  const N = parseInt(loan.tenure) || 0;
  const startDate = loan.startDate ? new Date(loan.startDate) : new Date();
  const interestType = loan.interestType;
  const rateType = loan.rateType;
  const paymentFrequency = loan.paymentFrequency;

  if (P <= 0 || R <= 0 || N <= 0) return [];

  const list = [];
  const r = getPeriodicRateFraction(R, rateType, paymentFrequency);

  if (interestType === 'flat') {
    const totalInterest = P * r * N;
    const interestPerInstallment = Math.round((totalInterest / N) * 100) / 100;
    const principalPerInstallment = Math.round((P / N) * 100) / 100;
    
    let principalRemaining = P;
    let interestRemaining = totalInterest;

    for (let i = 1; i <= N; i++) {
      const isLast = i === N;
      const pComp = isLast ? principalRemaining : principalPerInstallment;
      const iComp = isLast ? interestRemaining : interestPerInstallment;
      
      list.push({
        installmentNumber: i,
        dueDate: getNextDate(startDate, paymentFrequency, i),
        principalComponent: pComp,
        interestComponent: iComp,
        totalAmount: pComp + iComp
      });
      
      principalRemaining -= pComp;
      interestRemaining -= iComp;
    }
  } 
  else if (interestType === 'reducing') {
    let emi = 0;
    if (r === 0) {
      emi = P / N;
    } else {
      emi = P * (r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
    }
    
    let activePrincipal = P;

    for (let i = 1; i <= N; i++) {
      const isLast = i === N;
      const iComp = activePrincipal * r;
      let pComp = emi - iComp;

      if (isLast || activePrincipal < pComp) {
        pComp = activePrincipal;
      }

      list.push({
        installmentNumber: i,
        dueDate: getNextDate(startDate, paymentFrequency, i),
        principalComponent: Math.round(pComp * 100) / 100,
        interestComponent: Math.round(iComp * 100) / 100,
        totalAmount: Math.round((pComp + iComp) * 100) / 100
      });

      activePrincipal -= pComp;
    }
  } 
  else {
    // Simple Interest
    const interestPerInstallment = P * r;

    for (let i = 1; i <= N; i++) {
      const isLast = i === N;
      const pComp = isLast ? P : 0;
      const iComp = interestPerInstallment;

      list.push({
        installmentNumber: i,
        dueDate: getNextDate(startDate, paymentFrequency, i),
        principalComponent: pComp,
        interestComponent: iComp,
        totalAmount: pComp + iComp
      });
    }
  }

  return list;
}

export default function NewLoanModal({ isOpen, onClose, onRefresh, preselectedCustomerId = null }) {
  if (!isOpen) return null;

  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customerId: preselectedCustomerId || '',
    principalAmount: '',
    processingFee: '',
    interestRate: '',
    rateType: 'monthly',
    interestType: 'simple',
    paymentFrequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    tenure: '12',
    dueCharges: '',
    lateCharges: '',
    lateFeeRate: '50',
    lateFeeType: 'daily',
    remarks: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewSchedule, setPreviewSchedule] = useState([]);

  useEffect(() => {
    customerAPI.getAll()
      .then(data => {
        setCustomers(data.filter(c => c.status === 'Active'));
        if (data.length > 0 && !formData.customerId) {
          setFormData(prev => ({ ...prev, customerId: preselectedCustomerId || data[0]._id }));
        }
      })
      .catch(() => setError('Failed to load active borrowers.'));
  }, [preselectedCustomerId]);

  // Recalculate schedule preview
  useEffect(() => {
    const list = generateLocalPreviewSchedule(formData);
    setPreviewSchedule(list);
  }, [formData.principalAmount, formData.interestRate, formData.tenure, formData.rateType, formData.interestType, formData.paymentFrequency, formData.startDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId || !formData.principalAmount || !formData.interestRate || !formData.tenure) {
      setError('Please provide all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loanAPI.create(formData);
      onRefresh();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disburse loan file.');
    } finally {
      setLoading(false);
    }
  };

  // Summary values
  const totalInterestExpected = previewSchedule.reduce((acc, i) => acc + i.interestComponent, 0);
  const totalRepayExpected = parseFloat(formData.principalAmount || 0) + totalInterestExpected;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      
      {/* Modal Card */}
      <div className="w-full max-w-4xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl animate-slide-up my-auto overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
              <HandCoins className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-base font-bold text-brand-text dark:text-white">Create Loan Agreement</h2>
          </div>
          <button type="button" onClick={onClose} className="text-brand-dim hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-brand-rose/10 border border-brand-rose/20 rounded-xl text-brand-rose text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left side: Inputs */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Customer */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Select Borrower *</label>
                  <select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                    required
                    disabled={!!preselectedCustomerId}
                  >
                    {customers.length === 0 ? (
                      <option value="">No Active Borrowers</option>
                    ) : (
                      customers.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.phone})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Start Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Lending Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                    required
                  />
                </div>

                {/* Principal */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Principal Amount (Asal) *</label>
                  <input
                    type="number"
                    name="principalAmount"
                    value={formData.principalAmount}
                    onChange={handleChange}
                    placeholder="e.g. 100000"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition"
                    required
                    min="1"
                  />
                </div>

                {/* Processing Fee */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Processing Fee</label>
                  <input
                    type="number"
                    name="processingFee"
                    value={formData.processingFee}
                    onChange={handleChange}
                    placeholder="e.g. 1000"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition"
                    min="0"
                  />
                </div>

                {/* Interest Rate */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Interest Rate (%) *</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      name="interestRate"
                      value={formData.interestRate}
                      onChange={handleChange}
                      placeholder="e.g. 2"
                      step="0.01"
                      className="flex-1 bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition"
                      required
                      min="0"
                    />
                    <select
                      name="rateType"
                      value={formData.rateType}
                      onChange={handleChange}
                      className="w-28 bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-2 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                    >
                      <option value="daily">Per Day</option>
                      <option value="weekly">Per Week</option>
                      <option value="monthly">Per Month</option>
                      <option value="yearly">Per Year</option>
                    </select>
                  </div>
                </div>

                {/* Tenure */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Tenure (Installments Count) *</label>
                  <input
                    type="number"
                    name="tenure"
                    value={formData.tenure}
                    onChange={handleChange}
                    placeholder="e.g. 12"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-white placeholder-brand-dim/40 outline-none transition"
                    required
                    min="1"
                  />
                </div>

                {/* Interest Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Interest Type</label>
                  <select
                    name="interestType"
                    value={formData.interestType}
                    onChange={handleChange}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                  >
                    <option value="simple">Simple Interest (Sadharan)</option>
                    <option value="flat">Flat Rate (EMI)</option>
                    <option value="reducing">Reducing Balance (EMI)</option>
                  </select>
                </div>

                {/* Payment Frequency */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Repayment Frequency</label>
                  <select
                    name="paymentFrequency"
                    value={formData.paymentFrequency}
                    onChange={handleChange}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                  >
                    <option value="daily">Daily Collection</option>
                    <option value="weekly">Weekly Collection</option>
                    <option value="monthly">Monthly Collection</option>
                    <option value="yearly">Yearly Collection</option>
                  </select>
                </div>

                {/* Due Penalty Charges */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Due Penalty Charges</label>
                  <input
                    type="number"
                    name="dueCharges"
                    value={formData.dueCharges}
                    onChange={handleChange}
                    placeholder="e.g. 500 (one-time penalty)"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition"
                    min="0"
                  />
                </div>

                {/* Late Fines Charges */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Late Fine Charges</label>
                  <input
                    type="number"
                    name="lateCharges"
                    value={formData.lateCharges}
                    onChange={handleChange}
                    placeholder="e.g. 1000 (accumulated fines)"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition"
                    min="0"
                  />
                </div>

                {/* Auto Late Fee Rate */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Auto Late Fee Rate (₹) *</label>
                  <input
                    type="number"
                    name="lateFeeRate"
                    value={formData.lateFeeRate}
                    onChange={handleChange}
                    placeholder="e.g. 50"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition"
                    min="0"
                    required
                  />
                </div>

                {/* Auto Late Fee Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Late Fee Accrual Type</label>
                  <select
                    name="lateFeeType"
                    value={formData.lateFeeType}
                    onChange={handleChange}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
                  >
                    <option value="daily">Daily (रोज का)</option>
                    <option value="flat">Flat (एक बार का)</option>
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Disbursement Notes</label>
                <input
                  type="text"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Notes about documents verified, guarantor, etc."
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition"
                />
              </div>

              {/* Summary Calculator Cards */}
              <div className="grid grid-cols-2 gap-3 bg-brand-bg border border-brand-border p-3.5 rounded-xl text-center">
                <div>
                  <span className="text-[9px] uppercase font-bold text-brand-dim block">Total Interest Yield</span>
                  <p className="text-base font-extrabold text-brand-emerald mt-0.5">₹{Math.round(totalInterestExpected).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-brand-dim block">Total Expected Repay</span>
                  <p className="text-base font-extrabold text-brand-accent mt-0.5">₹{Math.round(totalRepayExpected).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Right side: Live Schedule Table Preview */}
            <div className="space-y-3.5 bg-brand-bg/50 border border-brand-border p-4 rounded-xl flex flex-col justify-between max-h-[300px] lg:max-h-[420px] overflow-hidden">
              <div className="flex items-center space-x-2 text-brand-accent font-bold text-xs uppercase tracking-wider shrink-0">
                <Table className="w-4 h-4" />
                <span>Repayment Schedule Preview</span>
              </div>
              
              <div className="flex-1 overflow-y-auto border border-brand-border rounded-xl bg-brand-bg p-2 space-y-2 mt-2">
                {previewSchedule.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-[10px] text-brand-dim font-medium p-4">
                    Enter amount, rate, tenure, and frequency to preview EMIs.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {previewSchedule.map(item => (
                      <div key={item.installmentNumber} className="flex justify-between items-center text-xs bg-brand-card border border-brand-border/40 p-2 rounded-lg">
                        <div>
                          <span className="font-bold text-brand-text dark:text-white">EMI #{item.installmentNumber}</span>
                          <span className="text-[10px] text-brand-dim block mt-0.5">
                            Due: {new Date(item.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-brand-text dark:text-white">₹{Math.round(item.totalAmount).toLocaleString('en-IN')}</p>
                          <span className="text-[10px] text-brand-dim block mt-0.5">
                            ₹{Math.round(item.principalComponent)} asal / ₹{Math.round(item.interestComponent)} byaj
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {previewSchedule.length > 0 && (
                <div className="text-[9px] text-brand-dim text-center mt-2 italic leading-relaxed shrink-0">
                  Calculated based on standard financial periods. Scheduled installment records will be generated automatically in the database when issued.
                </div>
              )}
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-brand-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-dim hover:text-white hover:bg-brand-border/30 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:bg-indigo-400 text-xs font-bold text-white shadow-lg shadow-brand-accent/20 transition"
            >
              {loading ? 'Disbursing...' : 'Disburse & Generate Schedule'}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
