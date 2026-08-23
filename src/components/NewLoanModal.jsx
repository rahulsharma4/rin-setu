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
    isExistingLoan: false,
    alreadyPaidInstallments: '0',
    skipCashBookOutflow: true,
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
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
  
  const numPaid = formData.isExistingLoan ? Math.min(previewSchedule.length, Math.max(0, parseInt(formData.alreadyPaidInstallments || 0))) : 0;
  const historicalPrincipalPaid = previewSchedule.slice(0, numPaid).reduce((acc, i) => acc + i.principalComponent, 0);
  const historicalInterestPaid = previewSchedule.slice(0, numPaid).reduce((acc, i) => acc + i.interestComponent, 0);
  const remainingPrincipalBalance = Math.max(0, (parseFloat(formData.principalAmount) || 0) - historicalPrincipalPaid);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-8 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      
      {/* Modal Card */}
      <div className="w-full max-w-4xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl animate-slide-up my-auto overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
              <HandCoins className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-text dark:text-white">
                {formData.isExistingLoan ? 'Add Existing / Running Loan (पुराना लोन जोड़ें)' : 'Create New Loan Agreement (नया लोन)'}
              </h2>
              <p className="text-[10px] text-brand-dim">
                {formData.isExistingLoan ? 'Onboard ongoing loan mid-way with past EMIs pre-marked' : 'Disburse fresh loan from start date'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-brand-dim hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="flex border-b border-brand-border bg-brand-bg/30 px-6 pt-3 space-x-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, isExistingLoan: false }))}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
              !formData.isExistingLoan
                ? 'border-brand-accent text-brand-accent'
                : 'border-transparent text-brand-dim hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>New Loan (नया लोन)</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, isExistingLoan: true }))}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
              formData.isExistingLoan
                ? 'border-brand-accent text-brand-accent'
                : 'border-transparent text-brand-dim hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>Existing / Running Loan (पुराना रनिंग लोन)</span>
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
              
              {/* Existing Loan Special Information Banner */}
              {formData.isExistingLoan && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-blue-400 flex items-center gap-1.5">
                    ℹ️ Purana Running Loan Setup Mode
                  </span>
                  <p className="text-[11px] text-brand-dim leading-relaxed">
                    Aap un borrowers ko add kar sakte hain jinka loan pehle se chal raha hai. Aap bata sakte hain ki kitni kiste (EMIs) pehle jama ho chuki hain, system bachi hui kisto ka hisab automatic manage karega.
                  </p>
                </div>
              )}

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
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">
                    {formData.isExistingLoan ? 'Original Loan Start Date *' : 'Lending Start Date *'}
                  </label>
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
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">
                    {formData.isExistingLoan ? 'Original Principal Amount (शुरुआती असूल) *' : 'Principal Amount (Asal) *'}
                  </label>
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
                  <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Total Tenure (Total EMIs) *</label>
                  <input
                    type="number"
                    name="tenure"
                    value={formData.tenure}
                    onChange={handleChange}
                    placeholder="e.g. 12"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/40 outline-none transition"
                    required
                    min="1"
                  />
                </div>

                {/* EXISTING LOAN EXTRA INPUT FIELDS */}
                {formData.isExistingLoan && (
                  <>
                    {/* Already Paid EMIs */}
                    <div className="space-y-1.5 md:col-span-2 bg-brand-bg/80 border border-brand-accent/30 p-3 rounded-xl">
                      <label className="text-[11px] font-extrabold text-brand-accent uppercase tracking-wider block">
                        Already Paid EMIs (कितनी किस्तें पहले जमा हो चुकी हैं?) *
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          name="alreadyPaidInstallments"
                          value={formData.alreadyPaidInstallments}
                          onChange={handleChange}
                          placeholder="e.g. 4"
                          className="w-32 bg-brand-card border border-brand-border focus:border-brand-accent focus:ring-0 rounded-xl px-4 py-2 text-xs text-brand-text dark:text-white outline-none transition font-bold"
                          min="0"
                          max={formData.tenure}
                        />
                        <span className="text-xs text-brand-dim">
                          out of <strong className="text-brand-text dark:text-white">{formData.tenure || 0}</strong> total EMIs
                        </span>
                      </div>
                      <p className="text-[10px] text-brand-dim italic mt-1">
                        System pehli {formData.alreadyPaidInstallments || 0} kisto ko automatically Paid mark kar dega.
                      </p>
                    </div>

                    {/* Skip CashBook Outflow Checkbox */}
                    <div className="space-y-1.5 md:col-span-2 flex items-center space-x-2 bg-brand-bg p-3 border border-brand-border rounded-xl">
                      <input
                        type="checkbox"
                        id="skipCashBookOutflow"
                        name="skipCashBookOutflow"
                        checked={formData.skipCashBookOutflow}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-brand-border text-brand-accent focus:ring-0 bg-brand-card cursor-pointer"
                      />
                      <label htmlFor="skipCashBookOutflow" className="text-xs font-semibold text-brand-text dark:text-white cursor-pointer">
                        Skip CashBook Outflow for Past Disbursement (पुराने लोन का खर्चा आज की कैशबुक से न काटें)
                      </label>
                    </div>
                  </>
                )}

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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-brand-bg border border-brand-border p-3.5 rounded-xl text-center">
                <div>
                  <span className="text-[9px] uppercase font-bold text-brand-dim block">Total Interest Yield</span>
                  <p className="text-base font-extrabold text-brand-emerald mt-0.5">₹{Math.round(totalInterestExpected).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-brand-dim block">
                    {formData.isExistingLoan ? 'Current Outstanding Asal' : 'Total Expected Repay'}
                  </span>
                  <p className="text-base font-extrabold text-brand-accent mt-0.5">
                    ₹{Math.round(formData.isExistingLoan ? remainingPrincipalBalance : totalRepayExpected).toLocaleString('en-IN')}
                  </p>
                </div>
                {formData.isExistingLoan && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-brand-dim block">Already Received Asal</span>
                    <p className="text-base font-extrabold text-emerald-400 mt-0.5">₹{Math.round(historicalPrincipalPaid).toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Live Schedule Table Preview */}
            <div className="space-y-3.5 bg-brand-bg/50 border border-brand-border p-4 rounded-xl flex flex-col justify-between max-h-[350px] lg:max-h-[460px] overflow-hidden">
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Table className="w-4 h-4" />
                  <span>Schedule Preview</span>
                </div>
                {formData.isExistingLoan && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    {numPaid} / {previewSchedule.length} EMIs Pre-Paid
                  </span>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto border border-brand-border rounded-xl bg-brand-bg p-2 space-y-2 mt-2">
                {previewSchedule.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-[10px] text-brand-dim font-medium p-4">
                    Enter amount, rate, tenure, and frequency to preview EMIs.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {previewSchedule.map((item, idx) => {
                      const isPastPaid = formData.isExistingLoan && idx < numPaid;
                      return (
                        <div 
                          key={item.installmentNumber} 
                          className={`flex justify-between items-center text-xs p-2 rounded-lg border transition ${
                            isPastPaid 
                              ? 'bg-emerald-500/10 border-emerald-500/30' 
                              : 'bg-brand-card border-brand-border/40'
                          }`}
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-brand-text dark:text-white">EMI #{item.installmentNumber}</span>
                              {isPastPaid ? (
                                <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded">
                                  ✓ Pre-Paid
                                </span>
                              ) : (
                                <span className="text-[9px] text-brand-dim">
                                  To Collect
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-brand-dim block mt-0.5">
                              Due: {new Date(item.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${isPastPaid ? 'text-emerald-400' : 'text-brand-text dark:text-white'}`}>
                              ₹{Math.round(item.totalAmount).toLocaleString('en-IN')}
                            </p>
                            <span className="text-[10px] text-brand-dim block mt-0.5">
                              ₹{Math.round(item.principalComponent)} asal / ₹{Math.round(item.interestComponent)} byaj
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {previewSchedule.length > 0 && (
                <div className="text-[9px] text-brand-dim text-center mt-2 italic leading-relaxed shrink-0">
                  {formData.isExistingLoan 
                    ? 'Green EMIs are marked as already paid. White EMIs will be managed via RinSetu collection waterfall.'
                    : 'Calculated based on standard financial periods. Scheduled installment records will be generated automatically in DB.'}
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
              className="px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:bg-indigo-400 text-xs font-bold text-white shadow-lg shadow-brand-accent/20 transition flex items-center space-x-1.5"
            >
              <span>{loading ? 'Processing...' : formData.isExistingLoan ? 'Add Existing Loan File' : 'Disburse & Generate Schedule'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
