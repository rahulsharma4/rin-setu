import React, { useState, useEffect } from 'react';
import { X, Calculator, Table, CircleDollarSign, CalendarDays } from 'lucide-react';

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
  if (paymentFrequency === 'daily') nextDate.setDate(nextDate.getDate() + index);
  else if (paymentFrequency === 'weekly') nextDate.setDate(nextDate.getDate() + index * 7);
  else if (paymentFrequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + index);
  else if (paymentFrequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + index);
  return nextDate;
}

function calculateSchedule(loan) {
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

export default function EMICalculator({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    principalAmount: '100000',
    interestRate: '2',
    rateType: 'monthly',
    interestType: 'simple',
    paymentFrequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    tenure: '12',
  });

  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    const list = calculateSchedule(formData);
    setSchedule(list);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const totalInterestExpected = schedule.reduce((acc, i) => acc + i.interestComponent, 0);
  const totalRepayExpected = parseFloat(formData.principalAmount || 0) + totalInterestExpected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/15 flex items-center justify-center text-brand-accent">
              <Calculator className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Lending EMI Calculator</h2>
              <span className="text-[9px] text-brand-dim font-semibold block mt-0.5">Check interest payouts & installment schedule templates</span>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-dim hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Inputs Section */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Principal */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Principal Amount (Asal)</label>
              <input
                type="number"
                name="principalAmount"
                value={formData.principalAmount}
                onChange={handleChange}
                placeholder="e.g. 100000"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-white placeholder-brand-dim/40 outline-none transition"
                min="1"
              />
            </div>

            {/* Interest Rate */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Interest Rate (%)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={handleChange}
                  placeholder="e.g. 2"
                  step="0.01"
                  className="flex-1 bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-white placeholder-brand-dim/40 outline-none transition"
                  min="0"
                />
                <select
                  name="rateType"
                  value={formData.rateType}
                  onChange={handleChange}
                  className="w-28 bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-2 py-2.5 text-xs text-white outline-none transition"
                >
                  <option value="daily">Per Day</option>
                  <option value="weekly">Per Week</option>
                  <option value="monthly">Per Month</option>
                  <option value="yearly">Per Year</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Interest Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Interest Type</label>
                <select
                  name="interestType"
                  value={formData.interestType}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition"
                >
                  <option value="simple">Simple (साधारण)</option>
                  <option value="flat">Flat (EMI)</option>
                  <option value="reducing">Reducing (EMI)</option>
                </select>
              </div>

              {/* Payment Frequency */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Repayment Period</label>
                <select
                  name="paymentFrequency"
                  value={formData.paymentFrequency}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Tenure */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Installments Count (Tenure)</label>
                <input
                  type="number"
                  name="tenure"
                  value={formData.tenure}
                  onChange={handleChange}
                  placeholder="e.g. 12"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-white placeholder-brand-dim/40 outline-none transition"
                  min="1"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Reference Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition"
                />
              </div>
            </div>

            {/* Calculations Summary Box */}
            <div className="p-4 bg-brand-bg border border-brand-border rounded-xl space-y-3">
              <span className="text-[9px] uppercase font-bold text-brand-accent tracking-wider block border-b border-brand-border/40 pb-1.5">Calculated Yield Report</span>
              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-dim font-medium">Principal (मूलधन):</span>
                <span className="font-bold text-white">₹{parseFloat(formData.principalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-dim font-medium">Interest (ब्याज):</span>
                <span className="font-bold text-brand-emerald">₹{Math.round(totalInterestExpected).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-brand-border/40 pt-2 font-bold">
                <span className="text-white">Total Repayable:</span>
                <span className="text-brand-accent">₹{Math.round(totalRepayExpected).toLocaleString('en-IN')}</span>
              </div>
            </div>

          </div>

          {/* Results Schedule Table */}
          <div className="lg:col-span-3 bg-brand-bg/50 border border-brand-border p-4 rounded-xl flex flex-col justify-between max-h-[380px] lg:max-h-[460px] overflow-hidden">
            <div className="flex items-center space-x-2 text-brand-accent font-bold text-xs uppercase tracking-wider shrink-0 mb-3">
              <Table className="w-4 h-4" />
              <span>Simulated Installment Schedule</span>
            </div>

            <div className="flex-1 overflow-y-auto border border-brand-border rounded-xl bg-brand-bg p-2.5 space-y-2">
              {schedule.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-[10px] text-brand-dim font-medium p-4">
                  Please enter values on the left to preview simulated installments.
                </div>
              ) : (
                schedule.map((item) => (
                  <div key={item.installmentNumber} className="flex justify-between items-center text-[10px] bg-brand-card border border-brand-border/40 p-2 rounded-lg hover:border-brand-accent/20 transition">
                    <div>
                      <span className="font-bold text-white">Installment #{item.installmentNumber}</span>
                      <span className="text-[8px] text-brand-dim block mt-0.5">
                        Due Date: {new Date(item.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">₹{Math.round(item.totalAmount).toLocaleString('en-IN')}</p>
                      <span className="text-[8px] text-brand-dim block mt-0.5">
                        Asal: ₹{Math.round(item.principalComponent)} | Byaj: ₹{Math.round(item.interestComponent)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={onClose}
              className="mt-4 w-full py-2.5 rounded-xl border border-brand-border hover:bg-brand-border hover:text-white text-xs font-semibold text-brand-dim transition uppercase tracking-wider outline-none"
            >
              Close Calculator
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
