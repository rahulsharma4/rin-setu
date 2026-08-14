import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, HandCoins, AlertTriangle, RefreshCw, ArrowUpRight } from 'lucide-react';
import { reportsAPI } from '../api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const summary = await reportsAPI.getSummary();
      setData(summary);
    } catch (err) {
      console.error('Reports fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-24 text-brand-dim text-sm">
        Reports load nahi ho sake. Backend check karein.
      </div>
    );
  }

  const { overview, monthlyChart, topBorrowers } = data;

  const maxCollected = Math.max(...monthlyChart.map(m => m.collected), 1);

  const kpiCards = [
    { label: 'Total Capital Disbursed', value: `₹${overview.totalDisbursed?.toLocaleString('en-IN')}`, sub: `${overview.totalLoans} total loans`, color: 'indigo', icon: HandCoins },
    { label: 'Total Repayments Received', value: `₹${overview.totalCollected?.toLocaleString('en-IN')}`, sub: `${overview.collectionRate}% collection rate`, color: 'emerald', icon: TrendingUp },
    { label: 'Total Overdue Amount', value: `₹${overview.totalOverdueAmount?.toLocaleString('en-IN')}`, sub: `${overview.overdueLoans} overdue loan files`, color: 'rose', icon: AlertTriangle },
    { label: 'Active Borrowers', value: `${overview.totalCustomers}`, sub: `${overview.activeLoans} active, ${overview.paidLoans} settled`, color: 'amber', icon: Users },
  ];

  const colorMap = {
    indigo: 'text-brand-accent bg-brand-accent/10',
    emerald: 'text-brand-emerald bg-brand-emerald/10',
    rose: 'text-brand-rose bg-brand-rose/10',
    amber: 'text-brand-amber bg-brand-amber/10',
  };

  const barColor = {
    indigo: 'bg-brand-accent',
    emerald: 'bg-brand-emerald',
    rose: 'bg-brand-rose',
    amber: 'bg-brand-amber',
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-text">Business Reports</h1>
          <p className="text-xs text-brand-dim mt-1.5 font-medium">Portfolio analytics, collection trends aur top borrowers.</p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-brand-border text-xs font-semibold text-brand-dim hover:text-brand-text hover:bg-brand-bg dark:hover:text-white dark:hover:bg-brand-border/40 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`glass-panel border border-brand-border rounded-2xl p-5 space-y-3 glow-${card.color}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[card.color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">{card.label}</p>
                <p className="text-xl font-extrabold text-brand-text mt-1">{card.value}</p>
                <p className="text-[10px] text-brand-dim mt-0.5">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Collection Chart */}
        <div className="lg:col-span-2 glass-panel border border-brand-border rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wide">Monthly Collection Trend (Last 6 Months)</h3>
            <TrendingUp className="w-4 h-4 text-brand-emerald" />
          </div>

          {monthlyChart.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-brand-dim text-xs">No collections logged yet.</div>
          ) : (
            <div className="h-72 w-full text-xs font-semibold">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyChart}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                    formatter={(value) => [`₹${Math.round(value).toLocaleString('en-IN')}`, undefined]}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                  <Bar name="Principal Portion (मूलधन)" dataKey="principal" fill="#f43f5e" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar name="Interest Portion (ब्याज)" dataKey="interest" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Borrowers by Outstanding */}
        <div className="glass-panel border border-brand-border rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wide">Top Outstanding Files</h3>
            <AlertTriangle className="w-4 h-4 text-brand-rose" />
          </div>

          {topBorrowers.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-brand-dim text-xs text-center">
              Koi outstanding balance nahi hai. Sab clear hai! 🎉
            </div>
          ) : (
            <div className="space-y-3">
              {topBorrowers.map((borrower, idx) => (
                <div key={borrower.loanId} className="flex items-center justify-between p-3 bg-brand-bg/50 border border-brand-border/60 rounded-xl hover:border-brand-border transition">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                      idx === 0 ? 'bg-brand-rose/10 text-brand-rose' : idx === 1 ? 'bg-brand-amber/10 text-brand-amber' : 'bg-brand-border text-brand-dim'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-brand-text truncate">{borrower.customerName}</p>
                      <p className="text-[9px] text-brand-dim">{borrower.customerPhone}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-brand-rose">₹{Math.round(borrower.outstanding).toLocaleString('en-IN')}</p>
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                      borrower.status === 'overdue' ? 'bg-brand-rose/10 text-brand-rose' : 'bg-brand-accent/10 text-brand-accent'
                    }`}>
                      {borrower.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loan Status Summary */}
      <div className="glass-panel border border-brand-border rounded-2xl p-6">
        <h3 className="text-sm font-bold text-brand-text uppercase tracking-wide mb-2">Loan Portfolio Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
          {/* Pie Chart */}
          <div className="h-48 flex justify-center">
            {overview.totalLoans > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Settled Agreements', value: overview.paidLoans || 0 },
                      { name: 'Active Agreements', value: overview.activeLoans || 0 },
                      { name: 'Overdue Accounts', value: overview.overdueLoans || 0 }
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#6366f1" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ fontSize: '11px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-brand-dim flex items-center justify-center">No portfolio data available</div>
            )}
          </div>

          {/* Details & Legend */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold pb-2 border-b border-brand-border/40">
              <span className="text-brand-dim">Collection Recovery Rate:</span>
              <span className="text-brand-emerald font-extrabold text-sm">{overview.collectionRate}%</span>
            </div>
            <div className="space-y-2.5 text-[11px] font-semibold text-brand-dim">
              <div className="flex justify-between items-center bg-brand-bg/30 p-2 rounded-xl border border-brand-border/40">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald inline-block" />
                  <span>Settled Agreements (Paid)</span>
                </span>
                <span className="text-brand-text font-bold">{overview.paidLoans} files</span>
              </div>
              <div className="flex justify-between items-center bg-brand-bg/30 p-2 rounded-xl border border-brand-border/40">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-accent inline-block" />
                  <span>Active Agreements</span>
                </span>
                <span className="text-brand-text font-bold">{overview.activeLoans} files</span>
              </div>
              <div className="flex justify-between items-center bg-brand-bg/30 p-2 rounded-xl border border-brand-border/40">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-rose inline-block" />
                  <span>Overdue Accounts</span>
                </span>
                <span className="text-brand-text font-bold">{overview.overdueLoans} files</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
