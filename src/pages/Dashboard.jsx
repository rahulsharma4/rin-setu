import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CircleDollarSign, 
  TrendingUp, 
  Handshake, 
  CalendarDays, 
  Plus, 
  ArrowUpRight, 
  Bot,
  Send,
  Sparkles,
  AlertTriangle,
  Clock,
  Sparkle,
  Calculator,
  GripVertical
} from 'lucide-react';
import { loanAPI, transactionAPI } from '../api';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import NewCustomerModal from '../components/NewCustomerModal';
import NewLoanModal from '../components/NewLoanModal';
import EMICalculator from '../components/EMICalculator';

export default function Dashboard() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dashboard Summaries & Audit state
  const [dailySummary, setDailySummary] = useState(null);
  const [eodSummary, setEodSummary] = useState(null);
  const [anomalies, setAnomalies] = useState([]);

  // Chat Bot states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Namaste! Mai Byaj CRM ka AI assistant hu. Aaj aapka business kaisa raha? Overdue reports ya collection analysis dekhne ke liye mujhse puchhein.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isEMICalculatorOpen, setIsEMICalculatorOpen] = useState(false);

  // Date Filters
  const [filterType, setFilterType] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Draggable widget order sorting state
  const [widgetOrder, setWidgetOrder] = useState(() => {
    const saved = localStorage.getItem('dashboardWidgetOrder');
    return saved ? JSON.parse(saved) : ['capital', 'profit', 'borrowers', 'yield'];
  });

  const headers = { Authorization: `Bearer ${token}` };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let eodUrl = 'http://localhost:5001/api/reports/eod-summary';
      if (filterStartDate && filterEndDate) {
        eodUrl += `?startDate=${filterStartDate}&endDate=${filterEndDate}`;
      }

      const [loansData, txData, dailyRes, eodRes, anomalyRes] = await Promise.all([
        loanAPI.getAll(),
        transactionAPI.getAll(),
        axios.get('http://localhost:5001/api/reports/daily-summary', { headers }),
        axios.get(eodUrl, { headers }),
        axios.get('http://localhost:5001/api/reports/anomalies', { headers })
      ]);
      setLoans(loansData);
      setAllTransactions(txData);
      setTransactions(txData.slice(0, 5));
      setDailySummary(dailyRes.data);
      setEodSummary(eodRes.data);
      setAnomalies(anomalyRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterTypeChange = (type) => {
    setFilterType(type);
    const today = new Date();
    
    if (type === 'all') {
      setFilterStartDate('');
      setFilterEndDate('');
    } else if (type === 'today') {
      const todayStr = today.toISOString().split('T')[0];
      setFilterStartDate(todayStr);
      setFilterEndDate(todayStr);
    } else if (type === 'week') {
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      setFilterStartDate(lastWeek.toISOString().split('T')[0]);
      setFilterEndDate(today.toISOString().split('T')[0]);
    } else if (type === 'month') {
      const lastMonth = new Date();
      lastMonth.setDate(today.getDate() - 30);
      setFilterStartDate(lastMonth.toISOString().split('T')[0]);
      setFilterEndDate(today.toISOString().split('T')[0]);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filterStartDate, filterEndDate]);

  // Filtered transactions for KPIs
  const filteredTxs = allTransactions.filter(tx => {
    if (!filterStartDate || !filterEndDate) return true;
    const txDate = tx.paymentDate.split('T')[0];
    return txDate >= filterStartDate && txDate <= filterEndDate;
  });

  // Filtered loans for KPIs (disbursed in period)
  const filteredLoans = loans.filter(l => {
    if (!filterStartDate || !filterEndDate) return true;
    const loanDate = l.startDate.split('T')[0];
    return loanDate >= filterStartDate && loanDate <= filterEndDate;
  });

  // Compute metrics
  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
  const overdueLoans = loans.filter(l => l.status === 'overdue');
  
  const totalOutstandingPrincipal = activeLoans.reduce(
    (acc, loan) => acc + (loan.calculations?.outstandingPrincipal || 0), 0
  );
  
  const totalOutstandingInterest = activeLoans.reduce(
    (acc, loan) => acc + (loan.calculations?.outstandingInterest || 0), 0
  );

  const totalOutstandingCapital = totalOutstandingPrincipal + totalOutstandingInterest;

  // Cumulative/Period Profit (Byaj Received)
  const totalProfitEarned = (filterStartDate && filterEndDate)
    ? filteredTxs.reduce((acc, tx) => acc + (tx.allocatedInterest || 0), 0)
    : loans.reduce((acc, loan) => acc + (loan.calculations?.totalInterestPaid || 0), 0);

  // Active Borrowers (disbursed in period or total active)
  const activeBorrowersCount = (filterStartDate && filterEndDate)
    ? filteredLoans.length
    : activeLoans.length;

  // Expected Yield / Collections in period (or monthly yield if all-time)
  const expectedMonthlyYield = (filterStartDate && filterEndDate)
    ? (eodSummary?.expected || 0)
    : activeLoans.reduce((acc, loan) => {
        const P = loan.principalAmount;
        const R = loan.interestRate;
        if (loan.rateType === 'monthly') {
          return acc + (P * (R / 100));
        } else {
          return acc + ((P * (R / 100)) / 12);
        }
      }, 0);

  // Drag and Drop sort handlers
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (sourceIndex === targetIndex) return;

    const newOrder = [...widgetOrder];
    const [moved] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, moved);

    setWidgetOrder(newOrder);
    localStorage.setItem('dashboardWidgetOrder', JSON.stringify(newOrder));
  };

  // Send message to AI
  const handleSendChat = async (textToSend) => {
    const msg = textToSend || chatInput;
    if (!msg.trim()) return;

    // Add user message
    setChatMessages(prev => [...prev, { sender: 'user', text: msg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5001/api/ai/chat',
        { message: msg },
        { headers }
      );
      const reply = response.data.reply;
      
      setChatMessages(prev => [...prev, { sender: 'bot', text: reply }]);

      // Action routing check
      const lower = msg.toLowerCase();
      if (lower.includes('overdue') || lower.includes('remind')) {
        setTimeout(() => {
          setChatMessages(prev => [...prev, { sender: 'bot', text: '💡 Shortcuts: Overdue collection directory open karu?', action: 'go_collection' }]);
        }, 1000);
      }
      if (lower.includes('cash') || lower.includes('expens')) {
        setTimeout(() => {
          setChatMessages(prev => [...prev, { sender: 'bot', text: '💡 Shortcuts: Cash Book balance sheet open karu?', action: 'go_cashbook' }]);
        }, 1000);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, AI response failure. Please check if backend is online.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const quickPrompts = [
    "Aaj kitna collection expected hai?",
    "Overdue loans check karo",
    "Cash Book balance kya hai?"
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Morning Summary Banner */}
      {dailySummary && (
        <div className="bg-indigo-50 dark:bg-brand-card border border-brand-border/80 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-indigo-950 dark:text-white flex items-center gap-1.5">
              <Sparkle className="w-5 h-5 text-brand-amber animate-spin" style={{ animationDuration: '6s' }} />
              Good Morning, Admin!
            </h2>
            <p className="text-[11px] text-indigo-900/80 dark:text-brand-dim font-medium">
              Aaj ka estimated collection targets: <span className="text-indigo-950 dark:text-white font-bold">₹{dailySummary.todayDue.toLocaleString('en-IN')}</span> due aaj, 
              aur <span className="text-indigo-950 dark:text-white font-bold">{dailySummary.overdueAccountsCount}</span> overdue file files hain.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
            <span className="bg-brand-amber/15 text-brand-amber border border-brand-amber/20 px-3 py-1.5 rounded-xl uppercase tracking-wider">
              {dailySummary.todayPaymentsDueCount} EMIs Due Today
            </span>
            {dailySummary.loansReadyToCloseCount > 0 && (
              <button 
                onClick={() => navigate('/loans')}
                className="bg-brand-emerald/15 hover:bg-brand-emerald/25 text-brand-emerald border border-brand-emerald/20 px-3 py-1.5 rounded-xl uppercase tracking-wider transition"
              >
                {dailySummary.loansReadyToCloseCount} Loans Ready to Close ➜
              </button>
            )}
          </div>
        </div>
      )}

      {/* Anomalies Warning Badge */}
      {anomalies.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-brand-rose shrink-0 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-rose-900 dark:text-rose-200">System Audit Alert: {anomalies.length} Suspicious Warnings Flagged</p>
              <span className="text-[10px] text-rose-700 dark:text-slate-400 block mt-0.5">Gemini AI detected potential duplicate contacts or shared collateral documents.</span>
            </div>
          </div>
          <button 
            onClick={() => {
              alert(anomalies.map(a => `[${a.type}] ${a.description}`).join('\n\n'));
            }}
            className="px-3 py-1.5 rounded-lg bg-brand-rose/20 hover:bg-brand-rose text-[10px] font-bold text-white hover:text-white transition shrink-0"
          >
            Review Flags
          </button>
        </div>
      )}

      {/* Welcome & Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-text">Lending Dashboard</h1>
          <p className="text-xs text-brand-dim mt-1.5 font-medium">Real-time ledger overview, profits, and active agreements.</p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsCustomerModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-dim hover:text-brand-text hover:bg-brand-bg dark:hover:text-white dark:hover:bg-brand-border/40 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register Borrower</span>
          </button>
          
          <button 
            onClick={() => setIsLoanModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-brand-accent hover:bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-brand-accent/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Loan</span>
          </button>
        </div>
      </div>

      {/* Date Filter & EMI Calculator Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-brand-card border border-brand-border rounded-2xl p-4 shadow-sm">
        
        {/* Left: Date Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-brand-dim uppercase tracking-wider mr-2">Filter Range:</span>
          {['all', 'today', 'week', 'month', 'custom'].map((type) => (
            <button
              key={type}
              onClick={() => handleFilterTypeChange(type)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition border ${
                filterType === type
                  ? 'bg-brand-accent text-white border-brand-accent shadow-md shadow-brand-accent/15'
                  : 'bg-brand-bg hover:bg-brand-border/30 text-brand-dim border-brand-border'
              }`}
            >
              {type === 'all' ? 'All Time' : type === 'today' ? 'Today' : type === 'week' ? 'This Week' : type === 'month' ? 'This Month' : 'Custom'}
            </button>
          ))}

          {/* Custom Date Pickers */}
          {filterType === 'custom' && (
            <div className="flex items-center gap-2 ml-2 animate-fade-in">
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="bg-brand-bg border border-brand-border rounded-xl px-2.5 py-1 text-[10px] text-brand-text outline-none focus:border-brand-accent/50"
              />
              <span className="text-xs text-brand-dim font-bold">to</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="bg-brand-bg border border-brand-border rounded-xl px-2.5 py-1 text-[10px] text-brand-text outline-none focus:border-brand-accent/50"
              />
            </div>
          )}
        </div>

        {/* Right: EMI Calculator Trigger */}
        <button
          onClick={() => setIsEMICalculatorOpen(true)}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-bg/50 hover:bg-brand-border/30 border border-brand-border text-[10px] font-bold text-brand-dim hover:text-brand-text dark:hover:text-white transition uppercase tracking-wider"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Open EMI Calculator</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {(() => {
          const cardsData = {
            capital: {
              id: 'capital',
              label: "Total Capital Out (Asal + Byaj)",
              value: `₹${totalOutstandingCapital.toLocaleString('en-IN')}`,
              subtext: `₹${totalOutstandingPrincipal.toLocaleString('en-IN')} principal / ₹${totalOutstandingInterest.toLocaleString('en-IN')} interest`,
              icon: CircleDollarSign,
              glowType: "indigo"
            },
            profit: {
              id: 'profit',
              label: filterStartDate && filterEndDate ? "Profit in Period (Byaj)" : "Cumulative Profit (Byaj)",
              value: `₹${totalProfitEarned.toLocaleString('en-IN')}`,
              subtext: filterStartDate && filterEndDate ? "Interest collected in filtered range" : "Net interest payouts collected to date",
              icon: TrendingUp,
              glowType: "emerald"
            },
            borrowers: {
              id: 'borrowers',
              label: filterStartDate && filterEndDate ? "Loans Disbursed" : "Active Borrowers",
              value: activeBorrowersCount.toString(),
              subtext: filterStartDate && filterEndDate ? "Agreements started in range" : `${loans.filter(l => l.status === 'paid' || l.status === 'closed').length} files settled successfully`,
              icon: Handshake,
              glowType: "amber"
            },
            yield: {
              id: 'yield',
              label: filterStartDate && filterEndDate ? "Expected Collection" : "Expected Monthly Yield",
              value: `₹${Math.round(expectedMonthlyYield).toLocaleString('en-IN')}`,
              subtext: filterStartDate && filterEndDate ? "Total installments due in range" : "Estimated active interest accrual per month",
              icon: CalendarDays,
              glowType: "indigo"
            }
          };

          return widgetOrder.map((cardId, index) => {
            const card = cardsData[cardId];
            if (!card) return null;
            return (
              <div
                key={card.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="cursor-grab active:cursor-grabbing transition relative group select-none"
              >
                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 text-brand-dim/35 hover:text-white transition cursor-grab no-print">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <StatsCard 
                  label={card.label}
                  value={card.value}
                  subtext={card.subtext}
                  icon={card.icon}
                  glowType={card.glowType}
                />
              </div>
            );
          });
        })()}
      </div>

      {/* EOD Collection Summary */}
      {eodSummary && (
        <div className="glass-panel border border-brand-border rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-brand-dim uppercase tracking-wider">Today's Collection Expected</span>
            <p className="text-xl font-extrabold text-white">₹{eodSummary.expected?.toLocaleString('en-IN')}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-brand-emerald uppercase tracking-wider">Total Received (Cash/UPI/Bank)</span>
            <p className="text-xl font-extrabold text-brand-emerald">₹{eodSummary.collected?.toLocaleString('en-IN')}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-brand-rose uppercase tracking-wider">Pending Dues</span>
            <p className="text-xl font-extrabold text-brand-rose">₹{eodSummary.pending?.toLocaleString('en-IN')}</p>
          </div>
          <div className="space-y-1 bg-brand-bg/50 border border-brand-border px-4 py-3 rounded-xl">
            <div className="flex items-center justify-between text-[9px] font-bold text-brand-accent uppercase">
              <span>Collection Rate</span>
              <span>{eodSummary.collectionRate}%</span>
            </div>
            <div className="w-full bg-brand-border h-2 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-brand-accent transition-all"
                style={{ width: `${eodSummary.collectionRate}%` }}
              />
            </div>
          </div>
          <div className="md:col-span-4 border-t border-brand-border/40 pt-4 flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" />
            <p className="text-xs text-brand-dim font-medium italic leading-relaxed">
              <span className="text-white font-bold not-italic">AI Collection Analysis: </span>
              {eodSummary.aiExplanation}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Recent Transactions & Collateral */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Collections */}
          <div className="glass-panel rounded-2xl border border-brand-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">Recent Collections Ledger</h3>
              <button onClick={() => navigate('/transactions')} className="text-[11px] font-bold text-brand-accent hover:underline flex items-center space-x-0.5">
                <span>View Full Timeline</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center space-y-2">
                <TrendingUp className="w-8 h-8 text-brand-dim/30" />
                <p className="text-xs text-brand-dim">No transactions logged yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border text-[10px] uppercase font-bold text-brand-dim">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Borrower</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Allocation</th>
                      <th className="pb-3">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40 text-xs">
                    {transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-brand-border/10 transition">
                        <td className="py-3 text-brand-dim">
                          {new Date(tx.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="py-3 font-semibold text-white">
                          {tx.customerId?.name || 'Deleted Customer'}
                        </td>
                        <td className={`py-3 font-bold ${tx.paymentType === 'principal' ? 'text-brand-rose' : 'text-brand-emerald'}`}>
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            tx.paymentType === 'principal' 
                              ? 'bg-brand-rose/10 text-brand-rose border border-brand-rose/20' 
                              : 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20'
                          }`}>
                            {tx.paymentType === 'principal' ? 'Asal' : tx.paymentType === 'interest' ? 'Byaj' : 'Waterfall'}
                          </span>
                        </td>
                        <td className="py-3 text-brand-dim uppercase font-semibold text-[10px]">{tx.paymentMode || 'cash'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Collaterals Distribution */}
          <div className="glass-panel rounded-2xl border border-brand-border p-6 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">Girvi / Collaterals Distribution</h3>
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin"></div>
              </div>
            ) : loans.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-brand-dim text-xs">No active collateral items.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {['Gold', 'Silver', 'Vehicle', 'Land', 'Documents'].map((type) => {
                  const activeLns = loans.filter(l => l.customerId?.collateralType === type && (l.status === 'active' || l.status === 'overdue'));
                  const count = activeLns.length;
                  const totalVal = activeLns.reduce((acc, l) => acc + (l.customerId?.collateralValue || 0), 0);
                  const percentage = loans.length > 0 ? (count / loans.length) * 100 : 0;
                  const barColors = {
                    Gold: 'bg-amber-400',
                    Silver: 'bg-slate-300',
                    Vehicle: 'bg-indigo-400',
                    Land: 'bg-emerald-400',
                    Documents: 'bg-rose-400',
                  };

                  return (
                    <div key={type} className="bg-brand-bg/50 border border-brand-border/60 p-3.5 rounded-xl space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-white">{type} backed loans</span>
                        <span className="text-brand-dim">{count} active ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="w-full bg-brand-border h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${barColors[type] || 'bg-brand-accent'} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      {totalVal > 0 && (
                        <span className="text-[9px] text-brand-dim font-bold block">Estimated Collateral Value: ₹{totalVal.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: AI Assistant Chatbot */}
        <div className="space-y-6">
          <div className="glass-panel border-brand-accent/20 glow-indigo rounded-2xl border p-5 flex flex-col h-[525px]">
            
            {/* AI Header */}
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-brand-accent/15 flex items-center justify-center text-brand-accent">
                  <Bot className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Lending Assistant</h3>
                  <span className="text-[9px] text-brand-emerald font-semibold uppercase tracking-widest mt-0.5 block flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 animate-spin" /> Gemini 1.5 Flash
                  </span>
                </div>
              </div>
            </div>

            {/* Chat Body messages */}
            <div className="flex-1 overflow-y-auto p-2.5 my-3 space-y-3.5 rounded-xl bg-brand-bg border border-brand-border/60">
              {chatMessages.map((msg, i) => (
                <div key={i} className="space-y-1">
                  <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-brand-accent text-white rounded-tr-none'
                        : 'bg-brand-card border border-brand-border text-brand-text rounded-tl-none font-medium'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                  {msg.action === 'go_collection' && (
                    <button
                      onClick={() => navigate('/collection')}
                      className="text-[9px] bg-brand-accent/20 border border-brand-accent/30 px-2 py-1 rounded text-brand-accent font-bold hover:bg-brand-accent hover:text-white transition mt-1 block"
                    >
                      Open Collection Panel ➜
                    </button>
                  )}
                  {msg.action === 'go_cashbook' && (
                    <button
                      onClick={() => navigate('/cashbook')}
                      className="text-[9px] bg-brand-emerald/20 border border-brand-emerald/30 px-2 py-1 rounded text-brand-emerald font-bold hover:bg-brand-emerald hover:text-white transition mt-1 block"
                    >
                      Open Cash Book ➜
                    </button>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-brand-card border border-brand-border rounded-2xl rounded-tl-none p-3 text-xs text-brand-dim flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts Chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChat(p)}
                  disabled={chatLoading}
                  className="px-2.5 py-1.5 rounded-lg border border-brand-border text-[9px] font-bold text-brand-dim hover:text-white hover:border-brand-accent hover:bg-brand-accent/5 transition outline-none"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <div className="flex items-center space-x-2 bg-brand-bg border border-brand-border rounded-xl p-1">
              <input
                type="text"
                placeholder="Ask AI e.g. Kitna overdue chal raha hai?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-1 bg-transparent border-none text-xs text-white placeholder-brand-dim/50 outline-none pl-3.5 focus:ring-0 focus:outline-none"
                disabled={chatLoading}
              />
              <button
                onClick={() => handleSendChat()}
                disabled={chatLoading || !chatInput.trim()}
                className="w-8 h-8 rounded-lg bg-brand-accent hover:bg-indigo-600 disabled:opacity-40 flex items-center justify-center text-white transition outline-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Modals */}
      <NewCustomerModal 
        isOpen={isCustomerModalOpen} 
        onClose={() => setIsCustomerModalOpen(false)} 
        onRefresh={fetchDashboardData}
      />
      <NewLoanModal 
        isOpen={isLoanModalOpen} 
        onClose={() => setIsLoanModalOpen(false)} 
        onRefresh={fetchDashboardData}
      />
      <EMICalculator 
        isOpen={isEMICalculatorOpen}
        onClose={() => setIsEMICalculatorOpen(false)}
      />

    </div>
  );
}
