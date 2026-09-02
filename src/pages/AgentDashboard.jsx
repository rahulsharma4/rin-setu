import React, { useState, useEffect } from 'react';
import { MapPin, Search, Phone, CreditCard, LogOut, Navigation, CheckCircle2 } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { createPortal } from 'react-dom';

export default function AgentDashboard() {
  const { admin, logout } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      // Agents only need to see active customers or everyone
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = (customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount('');
    setGeoError('');
    setIsLocating(false);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) return alert('Enter a valid amount');
    
    setIsLocating(true);
    setGeoError('');
    
    if (!navigator.geolocation) {
      setGeoError('GPS not supported on this device');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          setPaymentSaving(true);
          await api.post('/transactions/agent-collection', {
            customerId: selectedCustomer._id,
            amount: Number(paymentAmount),
            geo_location: {
              lat: latitude,
              lng: longitude,
              timestamp: new Date()
            }
          });
          alert('Collection Recorded Successfully!');
          setSelectedCustomer(null);
          // refresh data if needed
        } catch (err) {
          alert(err.response?.data?.message || 'Failed to record collection');
        } finally {
          setPaymentSaving(false);
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        setGeoError('GPS Permission denied. Please allow location access to record collection.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="flex flex-col h-screen bg-brand-bg font-sans text-brand-text dark:text-white">
      {/* Header */}
      <header className="bg-brand-card border-b border-brand-border p-4 flex justify-between items-center z-10 shadow-lg">
        <div>
          <h1 className="text-sm font-black tracking-widest text-white uppercase flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-brand-accent" />
            <span>Agent Portal</span>
          </h1>
          <p className="text-[10px] text-brand-dim mt-0.5">Logged in as {admin?.name}</p>
        </div>
        <button onClick={logout} className="p-2 bg-brand-rose/10 text-brand-rose rounded-xl hover:bg-brand-rose hover:text-white transition">
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-dim" />
          <input 
            type="text" 
            placeholder="Search borrower by name or phone..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-brand-card/50 border border-brand-border rounded-2xl pl-10 pr-4 py-3 text-xs focus:ring-0 focus:border-brand-accent/50 outline-none transition"
          />
        </div>

        {loading ? (
          <div className="text-center text-xs text-brand-dim py-10">Loading customers...</div>
        ) : (
          <div className="space-y-3 pb-24">
            {filtered.map(c => (
              <div key={c._id} className="bg-brand-card border border-brand-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="font-bold text-white text-xs">{c.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Phone className="w-3 h-3 text-brand-dim" />
                    <span className="text-[10px] text-brand-dim font-mono">{c.phone}</span>
                  </div>
                  {c.riskScore && (
                     <span className={`inline-block mt-2 px-1.5 py-0.5 text-[8px] font-bold uppercase rounded ${c.riskScore === 'Red' ? 'bg-brand-rose/20 text-brand-rose' : c.riskScore === 'Yellow' ? 'bg-amber-500/20 text-amber-500' : 'bg-brand-emerald/20 text-brand-emerald'}`}>
                       Risk: {c.riskScore}
                     </span>
                  )}
                </div>
                <button 
                  onClick={() => handleCollect(c)}
                  className="bg-brand-accent text-white px-4 py-2 rounded-xl text-[10px] font-bold shadow-lg shadow-brand-accent/20 flex items-center space-x-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Collect</span>
                </button>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center py-10 text-xs text-brand-dim">No customers found.</div>}
          </div>
        )}
      </main>

      {/* Collection Modal */}
      {selectedCustomer && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full sm:max-w-md bg-brand-card border-t sm:border border-brand-border rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-sm font-bold text-white">Record Collection</h2>
                <p className="text-[10px] text-brand-dim">Borrower: <span className="font-bold text-white">{selectedCustomer.name}</span></p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-brand-bg text-brand-dim hover:text-white">✕</button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wider">Amount Collected (Cash)</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-white font-bold text-xl">₹</span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 rounded-2xl pl-10 pr-4 py-3.5 text-xl font-bold text-white outline-none"
                    required
                  />
                </div>
              </div>

              {geoError && (
                <div className="p-3 rounded-xl bg-brand-rose/10 border border-brand-rose/20 text-brand-rose text-[10px] font-medium leading-relaxed">
                  ⚠️ {geoError}
                </div>
              )}

              <button 
                type="submit"
                disabled={isLocating || paymentSaving}
                className="w-full bg-brand-accent hover:bg-brand-accent/90 disabled:bg-brand-accent/50 text-white font-extrabold text-xs py-4 rounded-2xl transition shadow-xl shadow-brand-accent/20 flex items-center justify-center space-x-2"
              >
                {isLocating ? (
                  <>
                    <Navigation className="w-4 h-4 animate-ping" />
                    <span>Fetching GPS Location...</span>
                  </>
                ) : paymentSaving ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Mark GPS</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
