import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Coins, 
  HandCoins, 
  Receipt,
  Plus,
  Trash2,
  AlertCircle,
  Briefcase,
  Calendar,
  MessageSquareShare,
  Copy,
  Check,
  Send,
  Table,
  Edit,
  FileCheck,
  Sparkles,
  Printer
} from 'lucide-react';
import { customerAPI, loanAPI, transactionAPI } from '../api';
import axios from 'axios';
import PaymentModal from '../components/PaymentModal';
import NewLoanModal from '../components/NewLoanModal';
import NewCustomerModal from '../components/NewCustomerModal';
import PrintModal from '../components/PrintModal';
import { useAuth } from '../context/AuthContext';

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [customer, setCustomer] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Loan Schedule state
  const [activeScheduleLoanId, setActiveScheduleLoanId] = useState(null);
  const [scheduleInstallments, setScheduleInstallments] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Selected installment details breakdown
  const [selectedInstallmentDetail, setSelectedInstallmentDetail] = useState(null);

  // Restructuring Modal state
  const [restructureLoanItem, setRestructureLoanItem] = useState(null);
  const [restructureForm, setRestructureForm] = useState({
    interestRate: '',
    rateType: 'monthly',
    paymentFrequency: 'monthly',
    tenure: '12',
    remarks: ''
  });
  const [restructureLoading, setRestructureLoading] = useState(false);

  // AI Reminder states
  const [draftText, setDraftText] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedLoanForDraft, setSelectedLoanForDraft] = useState(null);

  // Modals trigger states
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  // Print Modal states
  const [printType, setPrintType] = useState('receipt');
  const [printData, setPrintData] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // AI Credit Risk Analysis states
  const [creditAnalysis, setCreditAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const handleRunAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const res = await axios.get(`http://localhost:5001/api/ai/credit-risk/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCreditAnalysis(res.data);
    } catch (err) {
      alert('Failed to generate AI credit analysis.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const data = await customerAPI.getOne(id);
      setCustomer(data.customer);
      
      const detailedLoans = await Promise.all(
        data.loans.map(async (l) => {
          return await loanAPI.getOne(l._id);
        })
      );
      setLoans(detailedLoans);

      // Default first loan as active schedule view if available
      if (detailedLoans.length > 0 && !activeScheduleLoanId) {
        handleViewSchedule(detailedLoans[0]._id);
      }
    } catch (err) {
      setError('Failed to load borrower profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const handleViewSchedule = async (loanId) => {
    setActiveScheduleLoanId(loanId);
    setLoadingSchedule(true);
    try {
      const res = await axios.get(`http://localhost:5001/api/loans/${loanId}/installments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScheduleInstallments(res.data);
    } catch (err) {
      console.error('Failed to load installment schedule:', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleRestructureSubmit = async (e) => {
    e.preventDefault();
    if (!restructureForm.interestRate || !restructureForm.tenure) return;

    setRestructureLoading(true);
    try {
      await axios.post(
        `http://localhost:5001/api/loans/${restructureLoanItem._id}/restructure`,
        restructureForm,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert('Loan structured and rescheduled successfully!');
      setRestructureLoanItem(null);
      fetchCustomerData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restructure loan.');
    } finally {
      setRestructureLoading(false);
    }
  };

  const handlePrintCertificate = (loan) => {
    setPrintType('no_dues');
    setPrintData({
      ...loan,
      customerId: customer
    });
    setIsPrintOpen(true);
  };

  const handlePrintReceipt = (tx) => {
    setPrintType('receipt');
    setPrintData({
      ...tx,
      customerId: customer
    });
    setIsPrintOpen(true);
  };

  const handleDraftAI = async (loan) => {
    setSelectedLoanForDraft(loan);
    setDrafting(true);
    setShowDraftModal(true);
    setDraftText('');
    setCopied(false);

    try {
      const res = await axios.post(
        'http://localhost:5001/api/ai/draft-reminder',
        { customerId: customer._id, loanId: loan._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDraftText(res.data.message);
    } catch (err) {
      setDraftText('Failed to draft reminder. Please check if backend is online.');
    } finally {
      setDrafting(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(draftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(draftText)}`;
    window.open(url, '_blank');
  };

  const handleDeleteLoan = async (loanId) => {
    if (!window.confirm('Deleting this loan will also permanently remove all its payment transactions. Continue?')) {
      return;
    }
    try {
      await loanAPI.delete(loanId);
      setActiveScheduleLoanId(null);
      setScheduleInstallments([]);
      fetchCustomerData();
    } catch (err) {
      alert('Failed to delete loan.');
    }
  };

  const handleRevertTransaction = async (txId) => {
    if (!window.confirm('Are you sure you want to revert/delete this payment? This will update the borrower balances.')) {
      return;
    }
    try {
      await transactionAPI.delete(txId);
      fetchCustomerData();
      if (activeScheduleLoanId) {
        handleViewSchedule(activeScheduleLoanId);
      }
    } catch (err) {
      alert('Failed to revert transaction.');
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6 bg-brand-rose/10 border border-brand-rose/20 rounded-2xl text-brand-rose text-xs font-semibold flex items-center space-x-2 w-max mx-auto mt-12">
        <AlertCircle className="w-4 h-4" />
        <span>{error || 'Borrower file not found.'}</span>
      </div>
    );
  }

  // Statistics
  const totalPrincipalBorrowed = loans.reduce((acc, l) => acc + l.principalAmount, 0);
  const outstandingPrincipal = loans.reduce((acc, l) => acc + (l.calculations?.outstandingPrincipal || 0), 0);
  const outstandingInterest = loans.reduce((acc, l) => acc + (l.calculations?.outstandingInterest || 0), 0);
  const outstandingPenalty = loans.reduce((acc, l) => acc + (l.calculations?.outstandingDueCharges || 0) + (l.calculations?.outstandingLateCharges || 0), 0);
  const excessAdvanceSum = loans.reduce((acc, l) => acc + (l.calculations?.excessAdvanceBalance || 0), 0);
  
  const totalRepaidPrincipal = loans.reduce((acc, l) => acc + (l.calculations?.totalPrincipalPaid || 0), 0);
  const totalRepaidInterest = loans.reduce((acc, l) => acc + (l.calculations?.totalInterestPaid || 0), 0);

  // Timeline
  const allTransactions = loans.flatMap(l => 
    (l.transactions || []).map(tx => ({
      ...tx,
      loanRemarks: l.remarks
    }))
  ).sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header section */}
      <div className="space-y-4">
        <button 
          onClick={() => navigate('/customers')}
          className="flex items-center space-x-1.5 text-xs text-brand-dim hover:text-white transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">{customer.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                customer.status === 'Active' 
                  ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20' 
                  : 'bg-brand-rose/10 text-brand-rose border border-brand-rose/20'
              }`}>
                {customer.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-brand-dim mt-1.5 font-medium">
              <span className="flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-brand-accent" />
                <span>{customer.phone}</span>
              </span>
              {customer.occupation && (
                <span className="flex items-center space-x-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{customer.occupation}</span>
                </span>
              )}
              {customer.address && (
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{customer.address}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsEditCustomerModalOpen(true)}
              className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl border border-brand-border hover:bg-brand-border/40 text-xs font-bold text-brand-dim hover:text-white transition"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile & KYC</span>
            </button>
            <button
              onClick={() => setIsNewLoanModalOpen(true)}
              className="flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand-accent hover:bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-brand-accent/25 transition"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Disburse Loan</span>
            </button>
          </div>
        </div>
      </div>

      {/* KYC Profile Details & Attached Documents Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Extra KYC Details Box */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-brand-border p-6 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-brand-border pb-2.5">
            KYC & Guarantor Documentation Record
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-brand-dim block font-medium">Aadhaar (UIDAI Number)</span>
              <span className="font-bold text-white mt-1 block">{customer.aadharNumber || 'Not Registered'}</span>
            </div>
            <div>
              <span className="text-brand-dim block font-medium">PAN ID Card</span>
              <span className="font-bold text-white mt-1 block">{customer.panNumber || 'Not Registered'}</span>
            </div>
            <div>
              <span className="text-brand-dim block font-medium">Guarantor Address</span>
              <span className="font-bold text-white mt-1 block">{customer.guarantorAddress || 'Not Registered'}</span>
            </div>
            <div>
              <span className="text-brand-dim block font-medium">Guarantor ID Proof</span>
              <span className="font-bold text-white mt-1 block">{customer.guarantorIdDoc || 'Not Registered'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-brand-dim block font-medium">Settlement Bank Account</span>
              <span className="font-bold text-white mt-1 block">{customer.bankAccountNumber || 'Not Registered'}</span>
            </div>
          </div>
        </div>

        {/* Digital Files / Collateral Photos List */}
        <div className="glass-panel rounded-2xl border border-brand-border p-6 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-brand-border pb-2.5">
            Digital File Drawer ({customer.documents?.length || 0})
          </h3>
          {(!customer.documents || customer.documents.length === 0) ? (
            <div className="text-center p-6 text-brand-dim text-xs">
              No attached documents. Edit profile to upload identity proofs.
            </div>
          ) : (
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {customer.documents.map(doc => (
                <div key={doc._id} className="flex justify-between items-center bg-brand-bg/40 border border-brand-border px-3.5 py-2 rounded-xl text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <FileCheck className="w-4 h-4 text-brand-emerald" />
                    <span className="text-white font-medium truncate max-w-[160px]" title={doc.label}>{doc.label}</span>
                  </div>
                  <div className="flex items-center space-x-2.5 shrink-0">
                    <button
                      onClick={() => setViewingDoc({ label: doc.label, fileUrl: doc.fileUrl })}
                      className="text-[10px] font-bold text-brand-accent hover:underline"
                    >
                      View
                    </button>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-brand-dim hover:underline"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Customer profile items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Collateral (Girvi) */}
        <div className="glass-panel rounded-2xl border border-brand-border p-5 flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-brand-amber/10 flex items-center justify-center text-brand-amber shrink-0">
            <Coins className="w-6 h-6 animate-float" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-brand-amber tracking-wider">Girvi Assets (Collaterals)</span>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">{customer.collateralType === 'None' ? 'No Assets Held' : customer.collateralType}</h3>
              {customer.collateralValue > 0 && (
                <span className="text-xs text-brand-dim">(Valued at ₹{customer.collateralValue.toLocaleString('en-IN')})</span>
              )}
            </div>
            <p className="text-xs text-brand-dim leading-relaxed">{customer.collateralDescription || 'No collateral assets were submitted by this borrower.'}</p>
          </div>
        </div>

        {/* Guarantor Details */}
        <div className="glass-panel rounded-2xl border border-brand-border p-5 flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-brand-emerald tracking-wider">Guarantor Verification</span>
            <h3 className="text-sm font-bold text-white">{customer.guarantorName || 'No Guarantor Registered'}</h3>
            {customer.guarantorPhone && (
              <p className="text-xs text-brand-dim mt-0.5 font-medium flex items-center space-x-1.5">
                <Phone className="w-3 h-3 text-brand-emerald" />
                <span>{customer.guarantorPhone}</span>
              </p>
            )}
            <p className="text-xs text-brand-dim/75 leading-relaxed">{!customer.guarantorName && 'No security guarantor was assigned to this ledger profile.'}</p>
          </div>
        </div>
      </div>

      {/* Balance Sheet */}
      <div className="glass-panel rounded-2xl border border-brand-border p-6 space-y-5">
        <h3 className="text-xs font-bold text-white tracking-wide uppercase">File Balance Sheet</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-brand-dim font-bold uppercase">Original Lending</span>
            <p className="text-lg font-extrabold text-white">₹{totalPrincipalBorrowed.toLocaleString('en-IN')}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-brand-rose font-bold uppercase">Outstanding Principal</span>
            <p className="text-lg font-extrabold text-brand-rose">₹{outstandingPrincipal.toLocaleString('en-IN')}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-brand-amber font-bold uppercase">Outstanding Interest</span>
            <p className="text-lg font-extrabold text-brand-amber">₹{outstandingInterest.toLocaleString('en-IN')}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-brand-rose font-bold uppercase">Outstanding Penalty Fines</span>
            <p className="text-lg font-extrabold text-brand-rose">₹{outstandingPenalty.toLocaleString('en-IN')}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-brand-emerald font-bold uppercase">Total Repaid (Asal + Byaj)</span>
            <p className="text-lg font-extrabold text-brand-emerald">₹{(totalRepaidPrincipal + totalRepaidInterest).toLocaleString('en-IN')}</p>
            {excessAdvanceSum > 0 && (
              <span className="text-[9px] text-brand-amber font-bold block">Prepaid Advance: ₹{excessAdvanceSum.toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Gemini AI Credit & Defaulter Risk Profile */}
      <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-brand-border/40 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
              <Sparkles className="w-4.5 h-4.5 animate-pulse-soft" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wide">Gemini AI Credit Risk Analysis</h3>
              <p className="text-[10px] text-brand-dim mt-0.5">Real-time deep learning & algorithmic repayment scoring</p>
            </div>
          </div>
          {creditAnalysis && (
            <button
              onClick={handleRunAnalysis}
              disabled={loadingAnalysis}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-brand-border text-[10px] font-bold text-brand-dim hover:text-white hover:bg-brand-border/30 transition disabled:opacity-45"
            >
              <span>Re-Analyze Profile</span>
            </button>
          )}
        </div>

        {!creditAnalysis ? (
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 space-y-4 sm:space-y-0">
            <div className="text-left space-y-1">
              <p className="text-xs text-white font-semibold">Evaluate borrower default probability metrics</p>
              <p className="text-[10px] text-brand-dim">Reviews total borrowings, repayment ratios, late installments frequency, collaterals coverage, and guarantor presence.</p>
            </div>
            <button
              onClick={handleRunAnalysis}
              disabled={loadingAnalysis}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:bg-indigo-400 text-xs font-bold text-white shadow-lg shadow-brand-accent/20 transition-all cursor-pointer select-none"
            >
              {loadingAnalysis ? (
                <>
                  <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Ledger...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run AI Risk Analysis</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* Credit Score & Risk Rating */}
            <div className="bg-brand-bg/40 border border-brand-border/40 p-4 rounded-xl flex flex-col justify-center items-center text-center space-y-3">
              <span className="text-[9px] font-bold text-brand-dim uppercase tracking-wider">Byaj Credit Score</span>
              <div className="relative flex items-center justify-center">
                <div className="text-3xl font-extrabold text-white">{creditAnalysis.creditScore}</div>
                <div className="text-[9px] text-brand-dim ml-0.5 mt-2">/900</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                creditAnalysis.riskRating === 'LOW' ? 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20' :
                creditAnalysis.riskRating === 'MEDIUM' ? 'bg-brand-amber/10 text-brand-amber border-brand-amber/20' :
                'bg-brand-rose/10 text-brand-rose border-brand-rose/20'
              }`}>
                {creditAnalysis.riskRating} RISK
              </span>
            </div>

            {/* Risk Analysis Factors */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <span className="text-[9px] font-bold text-brand-dim uppercase tracking-wider block mb-2">Key Assessment Factors</span>
                <ul className="space-y-2">
                  {creditAnalysis.riskFactors?.map((factor, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-[11px] text-white">
                      <span className="text-brand-accent mt-0.5 font-bold">•</span>
                      <span className="leading-relaxed">{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-brand-border/30">
                <span className="text-[9px] font-bold text-brand-dim uppercase tracking-wider block mb-1">AI Lending Recommendation</span>
                <p className="text-[11px] text-brand-dim font-medium leading-relaxed italic">
                  "{creditAnalysis.advice}"
                </p>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Issued Loan agreements grid */}
      <div className="space-y-5">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">Issued Loan Files ({loans.length})</h3>

        {loans.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-brand-border p-12 text-center text-brand-dim text-xs">
            No loans issued on this borrower file. Click "Disburse Loan" to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {loans.map((loan) => {
              const calc = loan.calculations || {};
              const isActiveSchedule = activeScheduleLoanId === loan._id;
              const isSettled = loan.status === 'paid' || loan.status === 'closed';

              return (
                <div 
                  key={loan._id} 
                  className={`glass-panel border rounded-2xl p-6 flex flex-col justify-between space-y-6 ${
                    isSettled 
                      ? 'border-brand-emerald/30 shadow-lg shadow-brand-emerald/5' 
                      : 'border-brand-border'
                  } ${isActiveSchedule ? 'border-brand-accent/40 shadow-lg shadow-brand-accent/5' : ''}`}
                >
                  <div className="space-y-4">
                    {/* Loan Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                          <HandCoins className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-white">₹{loan.principalAmount.toLocaleString('en-IN')}</h4>
                            {loan.processingFee > 0 && (
                              <span className="text-[9px] bg-brand-border px-1.5 py-0.5 rounded text-brand-dim">+₹{loan.processingFee} Fee</span>
                            )}
                          </div>
                          <span className="text-[9px] font-semibold text-brand-dim uppercase tracking-wider block mt-0.5">
                            Issued: {new Date(loan.startDate).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        isSettled 
                          ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20' 
                          : 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'
                      }`}>
                        {loan.status}
                      </span>
                    </div>

                    {/* Rules details */}
                    <div className="grid grid-cols-3 gap-3 text-xs bg-brand-bg/50 border border-brand-border p-3.5 rounded-xl">
                      <div>
                        <span className="text-[9px] text-brand-dim font-bold uppercase">Rate</span>
                        <p className="text-white font-semibold mt-0.5">{loan.interestRate}% ({loan.rateType})</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-brand-dim font-bold uppercase">Formula</span>
                        <p className="text-white font-semibold mt-0.5 capitalize">{loan.interestType}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-brand-dim font-bold uppercase">Frequency</span>
                        <p className="text-white font-semibold mt-0.5 capitalize">{loan.paymentFrequency}</p>
                      </div>
                    </div>

                    {/* Calculations Outstandings */}
                    <div className="space-y-3.5 border-t border-brand-border/40 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">Balances</span>
                        <button
                          onClick={() => handleViewSchedule(loan._id)}
                          className={`text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1 border px-2 py-0.5 rounded-lg transition ${
                            isActiveSchedule 
                              ? 'bg-brand-accent text-white border-brand-accent'
                              : 'text-brand-dim hover:text-white border-brand-border hover:bg-brand-border/30'
                          }`}
                        >
                          <Table className="w-3 h-3" />
                          <span>{isActiveSchedule ? 'Viewing Schedule' : 'View Schedule'}</span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-brand-dim">Accrued Byaj</span>
                          <p className="font-semibold text-white">₹{calc.totalInterestAccrued?.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-brand-dim">Byaj Paid</span>
                          <p className="font-semibold text-brand-emerald">₹{calc.totalInterestPaid?.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-brand-dim">Fines Due</span>
                          <p className="font-semibold text-brand-rose">₹{calc.outstandingLateCharges?.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-brand-rose">Bal. Principal</span>
                          <p className="font-semibold text-brand-rose">₹{calc.outstandingPrincipal?.toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      {/* Outstanding Balance */}
                      <div className="flex justify-between items-center bg-brand-accent/5 border border-brand-accent/20 p-3 rounded-xl">
                        <span className="text-[10px] text-white font-bold uppercase">Total Outstanding</span>
                        <p className="text-sm font-extrabold text-brand-accent">₹{calc.totalOutstanding?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    {loan.remarks && (
                      <p className="text-[11px] text-brand-dim font-medium italic">Remarks: {loan.remarks}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-brand-border/40 pt-4 mt-4 flex-wrap gap-2">
                    
                    {/* Restructure & Closure buttons */}
                    <div className="flex items-center space-x-2">
                      {!isSettled && (
                        <button
                          onClick={() => {
                            setRestructureLoanItem(loan);
                            setRestructureForm({
                              interestRate: loan.interestRate.toString(),
                              rateType: loan.rateType,
                              paymentFrequency: loan.paymentFrequency,
                              tenure: loan.tenure.toString(),
                              remarks: `Restructured from Account #${loan._id.slice(-6)}`
                            });
                          }}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-accent/15 hover:bg-brand-accent/25 text-[10px] font-bold text-brand-accent transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Restructure</span>
                        </button>
                      )}
                      
                      {isSettled && (
                        <button
                          onClick={() => handlePrintCertificate(loan)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-emerald/15 hover:bg-brand-emerald/25 text-[10px] font-bold text-brand-emerald transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>No Dues Statement</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <button
                        onClick={() => handleDeleteLoan(loan._id)}
                        className="p-2 rounded-lg bg-brand-rose/5 text-brand-rose/70 hover:text-white hover:bg-brand-rose transition text-xs font-semibold"
                        title="Delete Loan Agreement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {!isSettled && (
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
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Loan Repayment Schedule Table */}
      {activeScheduleLoanId && (
        <div className="glass-panel rounded-2xl border border-brand-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">Repayment Installment Schedule</h3>
            <span className="text-[10px] text-brand-dim font-bold uppercase">Loan ID: {activeScheduleLoanId.slice(-6)}</span>
          </div>

          {loadingSchedule ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin"></div>
            </div>
          ) : scheduleInstallments.length === 0 ? (
            <div className="text-center p-8 text-brand-dim text-xs">No installments generated.</div>
          ) : (
            <div className="overflow-x-auto border border-brand-border rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-bg/50 text-[10px] uppercase font-bold text-brand-dim">
                    <th className="p-3.5">Inst. #</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Principal Component</th>
                    <th className="p-3.5">Interest Component</th>
                    <th className="p-3.5">Total Installment</th>
                    <th className="p-3.5">Amount Paid</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {scheduleInstallments.map((inst) => (
                    <tr 
                      key={inst._id} 
                      onClick={() => setSelectedInstallmentDetail(inst)}
                      className="hover:bg-brand-border/10 transition cursor-pointer"
                    >
                      <td className="p-3.5 font-bold text-white">EMI #{inst.installmentNumber}</td>
                      <td className="p-3.5 text-brand-dim">
                        {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3.5 text-brand-dim">₹{inst.principalComponent.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-brand-dim">₹{inst.interestComponent.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 font-semibold text-white">₹{inst.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-brand-emerald font-bold">₹{inst.amountPaid.toLocaleString('en-IN')}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          inst.status === 'paid' 
                            ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20' 
                            : inst.status === 'overdue' 
                            ? 'bg-brand-rose/10 text-brand-rose border border-brand-rose/20'
                            : inst.status === 'partially_paid'
                            ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'
                            : 'bg-brand-border text-brand-dim'
                        }`}>
                          {inst.status === 'paid' ? 'Paid' : inst.status === 'partially_paid' ? 'Partial' : inst.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Timeline Ledger */}
      <div className="glass-panel rounded-2xl border border-brand-border p-6 space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">File Transaction Timeline</h3>
        
        {allTransactions.length === 0 ? (
          <div className="text-center p-8 text-brand-dim text-xs">No repayments logged for this file.</div>
        ) : (
          <div className="overflow-x-auto border border-brand-border rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-brand-border bg-brand-bg/50 text-[9px] uppercase font-bold text-brand-dim">
                  <th className="p-3.5">Payment Date</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Mode</th>
                  <th className="p-3.5">Allocation</th>
                  <th className="p-3.5">Loan Remarks</th>
                  <th className="p-3.5">Notes</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {allTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-brand-border/10 transition">
                    <td className="p-3.5 text-brand-dim">
                      {new Date(tx.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className={`p-3.5 font-bold ${tx.paymentType === 'principal' ? 'text-brand-rose' : 'text-brand-emerald'}`}>
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-brand-dim uppercase font-semibold text-[10px]">{tx.paymentMode || 'cash'}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        tx.paymentType === 'principal' 
                          ? 'bg-brand-rose/10 text-brand-rose border border-brand-rose/20' 
                          : 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20'
                      }`}>
                        {tx.paymentType === 'principal' ? 'Asal' : tx.paymentType === 'interest' ? 'Byaj' : 'Waterfall'}
                      </span>
                    </td>
                    <td className="p-3.5 text-brand-dim truncate max-w-[120px]">{tx.loanRemarks || '—'}</td>
                    <td className="p-3.5 text-brand-dim">{tx.notes || '—'}</td>
                    <td className="p-3.5 text-right flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => handlePrintReceipt(tx)}
                        className="p-1.5 rounded-lg bg-brand-accent/10 text-brand-accent hover:text-white hover:bg-brand-accent transition"
                        title="Print Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevertTransaction(tx._id)}
                        className="p-1.5 rounded-lg bg-brand-rose/5 text-brand-rose/70 hover:text-white hover:bg-brand-rose transition"
                        title="Revert Payment Log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Installment Detail breakdown popup */}
      {selectedInstallmentDetail && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-sm bg-brand-card border border-brand-border rounded-2xl shadow-2xl my-auto p-6 space-y-4 animate-slide-up">
            <div className="flex justify-between items-center border-b border-brand-border/40 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Installment Breakdown</h3>
              <button onClick={() => setSelectedInstallmentDetail(null)} className="text-brand-dim hover:text-white">✕</button>
            </div>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-brand-dim">Installment Number</span>
                <span className="text-white font-bold">EMI #{selectedInstallmentDetail.installmentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-dim">Principal Portion</span>
                <span className="text-white font-semibold">₹{selectedInstallmentDetail.principalComponent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-dim">Interest Portion</span>
                <span className="text-white font-semibold">₹{selectedInstallmentDetail.interestComponent}</span>
              </div>
              <div className="flex justify-between border-t border-brand-border/40 pt-2 font-bold">
                <span className="text-white">Total Expected</span>
                <span className="text-brand-accent">₹{selectedInstallmentDetail.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-dim">Principal Paid</span>
                <span className="text-brand-emerald font-semibold">₹{selectedInstallmentDetail.principalPaid || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-dim">Interest Paid</span>
                <span className="text-brand-emerald font-semibold">₹{selectedInstallmentDetail.interestPaid || 0}</span>
              </div>
              <div className="flex justify-between border-t border-brand-border/40 pt-2 font-extrabold text-brand-emerald">
                <span>Total Amount Paid</span>
                <span>₹{selectedInstallmentDetail.amountPaid || 0}</span>
              </div>
              <div className="flex justify-between font-bold text-brand-rose">
                <span>Remaining Outstanding</span>
                <span>₹{Math.max(0, selectedInstallmentDetail.totalAmount - selectedInstallmentDetail.amountPaid)}</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 5. Restructuring Loan Modal wizard */}
      {restructureLoanItem && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-brand-card border border-brand-border rounded-2xl shadow-2xl my-auto overflow-hidden animate-slide-up">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg/50">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brand-accent" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">Restructure Agreement File</h2>
              </div>
              <button onClick={() => setRestructureLoanItem(null)} className="text-brand-dim hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRestructureSubmit} className="p-6 space-y-4">
              <p className="text-[10px] text-brand-dim leading-relaxed">
                यह एक्शन बकाया किस्तों को सील ( restructure / close ) कर के बची हुई मूलधन राशि ( outstanding principal ) को नई शर्तों के साथ एक नए लोन अग्रीमेंट में तब्दील कर देगा। पुराने लेन-देन सुरक्षित रहेंगे।
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase">New Interest Rate (%) *</label>
                <input
                  type="number"
                  value={restructureForm.interestRate}
                  onChange={(e) => setRestructureForm(prev => ({ ...prev, interestRate: e.target.value }))}
                  placeholder="e.g. 2"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase">Payment Frequency</label>
                <select
                  value={restructureForm.paymentFrequency}
                  onChange={(e) => setRestructureForm(prev => ({ ...prev, paymentFrequency: e.target.value }))}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                >
                  <option value="daily">Daily EMI</option>
                  <option value="weekly">Weekly EMI</option>
                  <option value="monthly">Monthly EMI</option>
                  <option value="yearly">Yearly EMI</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase">New Tenure (EMIs Count) *</label>
                <input
                  type="number"
                  value={restructureForm.tenure}
                  onChange={(e) => setRestructureForm(prev => ({ ...prev, tenure: e.target.value }))}
                  placeholder="e.g. 12"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-dim uppercase">Audit Remarks</label>
                <input
                  type="text"
                  value={restructureForm.remarks}
                  onChange={(e) => setRestructureForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Reason for restructure"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setRestructureLoanItem(null)}
                  className="px-5 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-dim hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restructureLoading}
                  className="px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-indigo-600 disabled:opacity-40 text-xs font-bold text-white shadow"
                >
                  {restructureLoading ? 'Restructuring...' : 'Disburse & Restructure'}
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

      {/* AI Reminder Draft Modal */}
      {showDraftModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-brand-card border border-brand-border rounded-2xl shadow-2xl my-auto overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                  <MessageSquareShare className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">AI Reminder Message</h2>
              </div>
              <button type="button" onClick={() => setShowDraftModal(false)} className="text-brand-dim hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {drafting ? (
                <div className="h-36 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin"></div>
                  <span className="text-xs text-brand-dim">Gemini AI is drafting message...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-brand-bg border border-brand-border p-4 rounded-xl text-xs text-white whitespace-pre-wrap leading-relaxed select-text font-mono">
                    {draftText}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-brand-dim italic leading-none">
                    <span>Target: {customer.name} ({customer.phone})</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-brand-border">
                <button
                  onClick={handleCopyText}
                  disabled={drafting || !draftText}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-brand-border hover:bg-brand-border/30 text-xs font-semibold text-white transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-brand-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  disabled={drafting || !draftText}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-emerald hover:bg-emerald-600 text-xs font-bold text-white shadow-lg shadow-brand-emerald/10 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Repayment and Loan Modals */}
      {selectedLoan && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedLoan(null);
          }}
          onRefresh={fetchCustomerData}
          loanId={selectedLoan._id}
          customerId={customer._id}
          customerName={customer.name}
        />
      )}

      <NewCustomerModal
        isOpen={isEditCustomerModalOpen}
        onClose={() => setIsEditCustomerModalOpen(false)}
        onRefresh={fetchCustomerData}
        editingCustomer={customer}
      />

      <NewLoanModal
        isOpen={isNewLoanModalOpen}
        onClose={() => setIsNewLoanModalOpen(false)}
        onRefresh={fetchCustomerData}
        preselectedCustomerId={customer._id}
      />

      {/* Inline Document Preview Viewer Overlay Modal */}
      {viewingDoc && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-4xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl p-5 space-y-4 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-brand-border/40 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">{viewingDoc.label}</h3>
              <button 
                type="button"
                onClick={() => setViewingDoc(null)} 
                className="text-brand-dim hover:text-white text-lg font-bold outline-none"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-auto flex items-center justify-center bg-black/40 rounded-xl p-2 min-h-[350px]">
              {/\.(png|jpe?g|gif|webp)$/i.test(viewingDoc.fileUrl) ? (
                <img 
                  src={viewingDoc.fileUrl} 
                  className="max-w-full max-h-[70vh] object-contain rounded-xl" 
                  alt={viewingDoc.label} 
                />
              ) : viewingDoc.fileUrl.toLowerCase().endsWith('.pdf') ? (
                <embed 
                  src={viewingDoc.fileUrl} 
                  className="w-full h-[70vh] rounded-xl" 
                  type="application/pdf" 
                />
              ) : (
                <div className="text-center space-y-3 p-6 text-brand-dim">
                  <AlertTriangle className="w-10 h-10 text-brand-amber mx-auto" />
                  <p className="text-xs">Preview is not supported for this file type.</p>
                  <a 
                    href={viewingDoc.fileUrl} 
                    download 
                    className="inline-block px-4 py-2 bg-brand-accent hover:bg-indigo-600 text-xs font-bold text-white rounded-xl transition"
                  >
                    Download File to Open
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <PrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        type={printType}
        data={printData}
      />

    </div>
  );
}
