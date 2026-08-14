import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';

export default function PrintModal({ isOpen, onClose, type, data }) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const isReceipt = type === 'receipt';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      
      {/* Stylesheet override to ensure print media only targets #print-area */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            color: #000000 !important;
            background: #ffffff !important;
            padding: 20px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div className="w-full max-w-2xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up my-auto no-print">
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/15 flex items-center justify-center text-brand-accent">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                {isReceipt ? 'Print Payment Receipt' : 'Print No Dues Certificate'}
              </h2>
              <span className="text-[9px] text-brand-dim font-semibold block mt-0.5">
                {isReceipt ? 'Bhugtan Raseed' : 'Rin Mukti Praman Patra'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-dim hover:text-white transition outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Panel */}
        <div className="p-6 bg-brand-bg/25 border-b border-brand-border max-h-[450px] overflow-y-auto flex justify-center">
          
          {/* Printable Div */}
          <div 
            id="print-area" 
            className="w-full max-w-xl bg-white text-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 font-sans leading-relaxed text-xs"
          >
            {isReceipt ? (
              // ==================== PAYMENT RECEIPT LAYOUT ====================
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-1.5 border-b border-dashed border-slate-300 pb-4">
                  <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">RINSETU RECEIPT</h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Payment Acknowledgment Ledger Receipt</p>
                  <p className="text-[9px] text-slate-400">Date: {new Date(data.paymentDate || data.createdAt).toLocaleString('en-IN')}</p>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 text-[10px] bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase block">Receipt ID</span>
                    <span className="font-mono text-slate-700 font-bold">{data._id}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase block">Loan Account Reference</span>
                    <span className="font-mono text-slate-700 font-bold">{data.loanId?._id || data.loanId || 'N/A'}</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-1 border-b border-slate-200 pb-4">
                  <h3 className="text-[9px] font-extrabold text-slate-400 uppercase">Borrower Details (उधारी कर्ता)</h3>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <p><span className="font-bold text-slate-500">Name:</span> {data.customerId?.name || 'Customer'}</p>
                    <p><span className="font-bold text-slate-500">Phone:</span> {data.customerId?.phone || '—'}</p>
                    {data.customerId?.address && (
                      <p className="col-span-2"><span className="font-bold text-slate-500">Address:</span> {data.customerId.address}</p>
                    )}
                  </div>
                </div>

                {/* Receipt breakdown */}
                <div className="space-y-3">
                  <h3 className="text-[9px] font-extrabold text-slate-400 uppercase">Transaction Breakdown (भुगतान विवरण)</h3>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 text-[9px] text-slate-400 uppercase font-extrabold">
                        <th className="pb-2">Description</th>
                        <th className="pb-2 text-right">Payment Mode</th>
                        <th className="pb-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="py-2.5">
                          <p className="font-bold">Repayment Collection</p>
                          <span className="text-[9px] text-slate-400">Total cash/online deposit</span>
                        </td>
                        <td className="py-2.5 text-right uppercase font-semibold text-slate-600">{data.paymentMode || 'cash'}</td>
                        <td className="py-2.5 text-right font-black text-slate-900">₹{data.amount?.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Waterfall Splits */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Waterfall Allocation Splits (वितरण)</span>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[10px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Principal Component (असल हिस्सा):</span>
                      <span className="font-bold text-slate-800">₹{Math.round(data.allocatedPrincipal || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest Component (ब्याज हिस्सा):</span>
                      <span className="font-bold text-slate-800">₹{Math.round(data.allocatedInterest || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Late Penalty Component (जुर्माना):</span>
                      <span className="font-bold text-slate-800">₹{Math.round(data.allocatedLateFee || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Charges Component (शुल्क):</span>
                      <span className="font-bold text-slate-800">₹{Math.round(data.allocatedDueCharges || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Notes & Footer signature */}
                <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                  <div className="max-w-[60%] space-y-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase block">Remarks</span>
                    <p className="text-[10px] text-slate-600 italic">"{data.notes || 'No payment description notes added.'}"</p>
                  </div>
                  <div className="text-center w-36 space-y-1 border-t border-slate-300 pt-3">
                    <p className="text-[9px] font-bold text-slate-800 uppercase tracking-wide">Authorized Signatory</p>
                    <span className="text-[8px] text-slate-400 block mt-0.5">RinSetu Ledger</span>
                  </div>
                </div>
              </div>
            ) : (
              // ==================== NO DUES CERTIFICATE LAYOUT ====================
              <div className="space-y-8 p-4 border-4 border-double border-slate-300 rounded-lg relative overflow-hidden bg-white">
                
                {/* Watermark Seal */}
                <div className="absolute right-6 top-6 opacity-[0.05] pointer-events-none select-none text-slate-900">
                  <CheckCircle2 className="w-40 h-40" />
                </div>

                {/* Header Title */}
                <div className="text-center space-y-2 pb-4 border-b-2 border-slate-200">
                  <h1 className="text-lg font-black tracking-widest text-slate-900 uppercase"> Rin Mukti Praman Patra </h1>
                  <h2 className="text-sm font-extrabold text-slate-800 tracking-wider uppercase">LOAN CLOSURE & NO DUES CERTIFICATE</h2>
                  <p className="text-[9px] text-slate-400">RinSetu Enterprise Ledger Services</p>
                </div>

                {/* Certification details */}
                <div className="space-y-4 text-slate-700 text-[11px] leading-relaxed text-center px-4">
                  <p className="font-semibold text-slate-400 text-[9px] uppercase tracking-wider">To Whomsoever It May Concern</p>
                  <p className="pt-2">
                    This is to formally certify and record that the borrower named below has cleared and settled all outstanding payments, including principal balance, periodic interest payouts, and accrued penalty fines, under the following Loan Agreement details:
                  </p>
                </div>

                {/* Loan Account summary details table */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-y-3 text-[10px]">
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[8px] block">Borrower Name (ऋण कर्ता)</span>
                    <span className="font-bold text-slate-800 text-xs">{data.customerId?.name || 'Customer'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[8px] block">Phone / Mobile</span>
                    <span className="font-bold text-slate-800">{data.customerId?.phone || '—'}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2.5">
                    <span className="font-bold text-slate-400 uppercase text-[8px] block">Loan Account Number</span>
                    <span className="font-mono font-bold text-slate-800">#{data._id}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2.5">
                    <span className="font-bold text-slate-400 uppercase text-[8px] block">Disbursed Principal (मूलधन)</span>
                    <span className="font-bold text-slate-800">₹{data.principalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2.5">
                    <span className="font-bold text-slate-400 uppercase text-[8px] block">Lending Start Date</span>
                    <span className="font-bold text-slate-800">{new Date(data.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2.5">
                    <span className="font-bold text-slate-400 uppercase text-[8px] block">Loan Closure Date (मुक्ति तिथि)</span>
                    <span className="font-bold text-brand-emerald font-extrabold">{data.closureDate ? new Date(data.closureDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                {/* Formal statement of closure */}
                <div className="text-center font-bold text-[10px] text-slate-600 bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                  ✅ Account Status: CLOSED | Outstanding Balance: ₹0.00
                </div>

                <p className="text-[10px] text-slate-500 text-center leading-relaxed italic px-4">
                  "No further liabilities or payment balances remain due from the borrower for the aforementioned Loan ID. The collateral asset (if submitted) has been released and cleared from our ledger registers."
                </p>

                {/* Footer Signature */}
                <div className="pt-6 border-t border-slate-200 flex justify-between items-center px-4">
                  <div className="text-left">
                    <span className="text-[8px] text-slate-400 block">Certificate ID</span>
                    <span className="font-mono text-[9px] text-slate-600 font-semibold uppercase">RINSETU-ND-{data._id?.toString().slice(-8)}</span>
                  </div>
                  <div className="text-center w-36 space-y-1.5 border-t border-slate-300 pt-3">
                    <p className="text-[9px] font-black text-slate-800 uppercase tracking-wide">Lender Signature</p>
                    <span className="text-[8px] text-slate-400 block mt-0.5">Seal & Verification Sign</span>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-brand-bg/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-brand-border text-xs font-semibold text-brand-dim hover:text-white hover:bg-brand-border/40 transition"
          >
            Close Preview
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-brand-accent hover:bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-brand-accent/20 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
