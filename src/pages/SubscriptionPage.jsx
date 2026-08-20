import React, { useState, useEffect } from 'react';
import api from '../api';
import { Loader2, ShieldCheck, AlertTriangle, Check, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SubscriptionPage() {
  const { logout } = useAuth();
  const [status, setStatus] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewLoadingPlanId, setRenewLoadingPlanId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const [statusRes, plansRes] = await Promise.all([
        api.get('subscriptions/status'),
        api.get('subscriptions/plans')
      ]);
      setStatus(statusRes.data);
      setPlans(plansRes.data);
    } catch (err) {
      console.error(err);
      setError('Subscription details load karne me prashna hua.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRenew = async (planId) => {
    try {
      setRenewLoadingPlanId(planId);
      setError('');
      setSuccess('');

      const res = await api.post('subscriptions/renew', { planId });

      // If plan has been auto-activated (e.g. key secret missing/dummy in dev or ₹0 plan)
      if (res.data.success) {
        setSuccess(res.data.message);
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
        return;
      }

      // Live Razorpay payment order received
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError('Razorpay Checkout failed to load. Internet check karein.');
        return;
      }

      const options = {
        key: res.data.keyId,
        amount: res.data.amount * 100, // paise
        currency: res.data.currency,
        name: 'RinSetu CRM SaaS',
        description: `Subscription: ${res.data.planName}`,
        order_id: res.data.orderId,
        prefill: {
          name: res.data.userName,
          email: res.data.userEmail,
        },
        theme: {
          color: '#6366f1', // Indigo accent
        },
        handler: async function (paymentResponse) {
          try {
            setLoading(true);
            const verifyRes = await api.post('subscriptions/verify-payment', {
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpaySignature: paymentResponse.razorpay_signature,
              planId: planId
            });

            if (verifyRes.data.success) {
              setSuccess('Payment Verified! Account subscription extended successfully. 🎉');
              setTimeout(() => {
                window.location.href = '/';
              }, 2000);
            }
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || 'Payment signature verification failed.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setRenewLoadingPlanId(null);
          }
        }
      };

      const rzpWindow = new window.Razorpay(options);
      rzpWindow.open();

    } catch (err) {
      setError(err.response?.data?.message || 'Recharge process start karne me error.');
    } finally {
      setRenewLoadingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-[100vh] bg-brand-bg flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        <p className="text-sm text-brand-dim font-medium">Verifying subscription status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-brand-border/40">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-text dark:text-white tracking-tight">RinSetu Billing Center</h1>
            <p className="text-xs text-brand-dim mt-1">Manage your Lender Admin subscription plans and invoices.</p>
          </div>
          <div className="flex items-center space-x-2.5">
            {status?.subscriptionStatus !== 'expired' && (
              <button
                type="button"
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-brand-accent hover:bg-indigo-600 text-white text-xs font-extrabold rounded-xl transition shadow-lg shadow-brand-accent/20"
              >
                Go back to Dashboard
              </button>
            )}
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 px-4 py-2 border border-brand-border bg-brand-card rounded-xl hover:bg-brand-rose/15 hover:border-brand-rose/30 text-brand-dim hover:text-brand-rose text-xs font-semibold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Global Success / Error banners */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold px-6 py-4 rounded-2xl flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-brand-emerald text-sm font-semibold px-6 py-4 rounded-2xl flex items-center space-x-3">
            <ShieldCheck className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        {/* Current status card */}
        {status && (
          <div className={`p-6 border rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            status.isFreeAccess ? 'bg-brand-emerald/10 border-brand-emerald/30 text-brand-emerald' :
            status.subscriptionStatus === 'expired' ? 'bg-brand-rose/10 border-brand-rose/30 text-brand-rose animate-pulse' :
            status.subscriptionStatus === 'suspended' ? 'bg-brand-rose/10 border-brand-rose/30 text-brand-rose' :
            status.subscriptionStatus === 'trial' ? 'bg-brand-amber/10 border-brand-amber/30 text-brand-amber' :
            'bg-brand-emerald/10 border-brand-emerald/30 text-brand-emerald'
          }`}>
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-bold tracking-wider opacity-85 block">Current Subscription Status</span>
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                {status.isFreeAccess ? (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Free Unlimited Access (Approved by Admin)</span>
                  </>
                ) : status.subscriptionStatus === 'expired' ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-brand-rose" />
                    <span>Subscription Expired! Blocked Access</span>
                  </>
                ) : status.subscriptionStatus === 'trial' ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-brand-amber animate-bounce" />
                    <span>Free Trial Active ({status.trialDaysLeft} Days Remaining)</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Active Subscription ({status.renewalDaysLeft} Days Remaining)</span>
                  </>
                )}
              </h2>
              <p className="text-[10px] opacity-75 font-medium">
                {status.isFreeAccess ? 'Permanent billing override is active. You will never be charged.' :
                 status.subscriptionStatus === 'expired' ? 'CRM functions are locked. Select a monthly plan below to restore access.' :
                 `Next automatic billing recharge date: ${new Date(status.renewalDate).toLocaleDateString('en-IN')}`}
              </p>
            </div>
            
            <div className="text-right">
              <span className="text-xs font-bold block opacity-75">Active Plan</span>
              <span className="text-md font-black block">{status.plan?.name}</span>
            </div>
          </div>
        )}

        {/* Pricing Grid */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-md font-extrabold text-brand-text dark:text-white uppercase tracking-wider">Select a Subscription Plan</h3>
            <p className="text-xs text-brand-dim font-medium">Pay monthly to unlock full money lending ledger calculations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {plans.length === 0 ? (
              <p className="text-xs text-brand-dim py-8 text-center col-span-2">No pricing plans are configured on this platform. Please contact Superadmin.</p>
            ) : (
              plans.map(p => {
                const isCurrentPlan = status?.plan?._id === p._id;
                const price = status?.customPrice !== undefined && status?.customPrice !== null ? status.customPrice : p.price;

                return (
                  <div key={p._id} className={`p-6 border rounded-2xl bg-brand-card shadow-2xl relative flex flex-col justify-between space-y-6 ${
                    isCurrentPlan ? 'border-brand-accent ring-2 ring-brand-accent/20' : 'border-brand-border/60'
                  }`}>
                    {isCurrentPlan && (
                      <span className="absolute top-0 right-6 -translate-y-1/2 bg-brand-accent text-white text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                        Active Plan
                      </span>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h4 className="text-md font-extrabold text-brand-text dark:text-white">{p.name}</h4>
                        <p className="text-2xl font-black text-brand-text dark:text-white">
                          ₹{price}
                          <span className="text-[11px] text-brand-dim font-medium font-normal"> / {p.durationDays} Days</span>
                        </p>
                      </div>

                      <div className="text-[10px] text-brand-dim font-medium">
                        Limit: {p.maxBorrowers === -1 ? 'Unlimited Borrower Records' : `${p.maxBorrowers} Active Borrowers`}
                      </div>

                      <ul className="text-xs text-brand-dim space-y-2 pt-4 border-t border-brand-border/30">
                        {p.features?.map((f, i) => (
                          <li key={i} className="flex items-center space-x-2 font-medium">
                            <Check className="w-4 h-4 text-brand-emerald shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      disabled={renewLoadingPlanId !== null || status?.isFreeAccess}
                      onClick={() => handleRenew(p._id)}
                      className={`w-full py-2.5 rounded-xl text-xs font-extrabold shadow-lg transition flex items-center justify-center space-x-1.5 ${
                        isCurrentPlan 
                          ? 'bg-brand-emerald hover:bg-emerald-600 text-white shadow-brand-emerald/25'
                          : 'bg-brand-accent hover:bg-indigo-600 text-white shadow-brand-accent/25'
                      }`}
                    >
                      {renewLoadingPlanId === p._id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Initiating Checkout...</span>
                        </>
                      ) : (
                        <span>{isCurrentPlan ? 'Extend / Renew Plan' : 'Buy / Switch Plan'}</span>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="max-w-4xl mx-auto w-full text-center text-[10px] text-brand-dim pt-8 border-t border-brand-border/20 mt-12">
        &copy; {new Date().getFullYear()} RinSetu Money Lending Platform. All rights reserved. Secured by Razorpay.
      </div>
    </div>
  );
}
