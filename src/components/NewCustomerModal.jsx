import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, ShieldAlert, Edit, Upload, FileCheck, Trash2, Paperclip, CheckCircle, AlertTriangle } from 'lucide-react';
import { customerAPI } from '../api';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function NewCustomerModal({ isOpen, onClose, onRefresh, editingCustomer = null }) {
  const { token } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    occupation: '',
    aadharNumber: '',
    panNumber: '',
    bankAccountNumber: '',
    guarantorName: '',
    guarantorPhone: '',
    guarantorAddress: '',
    guarantorIdDoc: '',
    collateralType: 'None',
    collateralDescription: '',
    collateralValue: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Upload States
  const [uploading, setUploading] = useState(false);
  
  // Real-time uploaded docs (in edit mode)
  const [uploadedDocs, setUploadedDocs] = useState([]);

  // Pending docs queue (in creation/edit mode upload queue)
  const [tempFiles, setTempFiles] = useState([]);

  // Local document viewer state
  const [viewingDoc, setViewingDoc] = useState(null);

  // Sync state if editingCustomer changes
  useEffect(() => {
    if (editingCustomer) {
      setFormData({
        name: editingCustomer.name || '',
        phone: editingCustomer.phone || '',
        address: editingCustomer.address || '',
        occupation: editingCustomer.occupation || '',
        aadharNumber: editingCustomer.aadharNumber || '',
        panNumber: editingCustomer.panNumber || '',
        bankAccountNumber: editingCustomer.bankAccountNumber || '',
        guarantorName: editingCustomer.guarantorName || '',
        guarantorPhone: editingCustomer.guarantorPhone || '',
        guarantorAddress: editingCustomer.guarantorAddress || '',
        guarantorIdDoc: editingCustomer.guarantorIdDoc || '',
        collateralType: editingCustomer.collateralType || 'None',
        collateralDescription: editingCustomer.collateralDescription || '',
        collateralValue: editingCustomer.collateralValue || '',
      });
      setUploadedDocs(editingCustomer.documents || []);
    } else {
      setFormData({
        name: '',
        phone: '',
        address: '',
        occupation: '',
        aadharNumber: '',
        panNumber: '',
        bankAccountNumber: '',
        guarantorName: '',
        guarantorPhone: '',
        guarantorAddress: '',
        guarantorIdDoc: '',
        collateralType: 'None',
        collateralDescription: '',
        collateralValue: '',
      });
      setUploadedDocs([]);
    }
    setTempFiles([]);
    setError('');
    setViewingDoc(null);
  }, [editingCustomer, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle multiple file selections
  const handleFileChange = (e) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    
    const newTemps = filesArray.map(file => ({
      file,
      label: file.name.split('.')[0] || file.name,
      tempId: Math.random() + Date.now()
    }));
    
    setTempFiles(prev => [...prev, ...newTemps]);
    e.target.value = ''; // Reset input selection
  };

  const handleRemoveTempFile = (tempId) => {
    setTempFiles(prev => prev.filter(f => f.tempId !== tempId));
  };

  const handleUpdateTempLabel = (tempId, newLabel) => {
    setTempFiles(prev => prev.map(f => f.tempId === tempId ? { ...f, label: newLabel } : f));
  };

  // Trigger instant upload in edit mode
  const handleUploadTempQueue = async () => {
    if (tempFiles.length === 0) return;
    setUploading(true);
    setError('');

    const activeToken = token || localStorage.getItem('byaj_admin_token');

    try {
      const newlyUploaded = [];
      for (const temp of tempFiles) {
        const fd = new FormData();
        fd.append('file', temp.file);
        fd.append('label', temp.label);

        const res = await axios.post(
          `http://localhost:5001/api/customers/${editingCustomer._id}/documents`,
          fd,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${activeToken}`
            }
          }
        );
        newlyUploaded.push(res.data.document);
      }
      setUploadedDocs(prev => [...prev, ...newlyUploaded]);
      setTempFiles([]);
      alert('Selected documents uploaded successfully!');
    } catch (err) {
      setError('Failed to upload some documents. Check auth credentials.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    const activeToken = token || localStorage.getItem('byaj_admin_token');
    
    try {
      await axios.delete(
        `http://localhost:5001/api/customers/${editingCustomer._id}/documents/${docId}`,
        {
          headers: { Authorization: `Bearer ${activeToken}` }
        }
      );
      setUploadedDocs(prev => prev.filter(d => d._id !== docId));
    } catch {
      alert('Failed to delete document.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setError('Name and Phone Number are required.');
      return;
    }

    setLoading(true);
    setError('');
    const activeToken = token || localStorage.getItem('byaj_admin_token');

    try {
      const payload = {
        ...formData,
        collateralValue: formData.collateralValue ? parseFloat(formData.collateralValue) : 0,
      };

      let customerId = '';
      if (editingCustomer && editingCustomer._id) {
        await customerAPI.update(editingCustomer._id, payload);
        customerId = editingCustomer._id;
        
        // Also upload any pending queue in edit mode if submit is clicked
        if (tempFiles.length > 0) {
          for (const temp of tempFiles) {
            const fd = new FormData();
            fd.append('file', temp.file);
            fd.append('label', temp.label);
            await axios.post(
              `http://localhost:5001/api/customers/${customerId}/documents`,
              fd,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  Authorization: `Bearer ${activeToken}`
                }
              }
            );
          }
        }
      } else {
        const newCustomer = await customerAPI.create(payload);
        customerId = newCustomer._id;

        // Upload queued documents sequentially
        if (tempFiles.length > 0) {
          for (const temp of tempFiles) {
            const fd = new FormData();
            fd.append('file', temp.file);
            fd.append('label', temp.label);
            await axios.post(
              `http://localhost:5001/api/customers/${customerId}/documents`,
              fd,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  Authorization: `Bearer ${activeToken}`
                }
              }
            );
          }
        }
      }

      onRefresh();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer profile.');
    } finally {
      setLoading(false);
    }
  };

  const isEditMode = !!editingCustomer;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-8 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      
      {/* Modal Card */}
      <div className="w-full max-w-2xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl animate-slide-up my-auto overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
              {isEditMode ? <Edit className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <h2 className="text-base font-bold text-white">
              {isEditMode ? 'Edit Borrower Profile' : 'Register Borrower Profile'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-brand-dim hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center space-x-2 p-3.5 bg-brand-rose/10 border border-brand-rose/20 rounded-xl text-brand-rose text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Primary Info */}
            <div className="md:col-span-2 border-b border-brand-border/40 pb-2">
              <h3 className="text-[10px] font-bold text-brand-accent uppercase tracking-wider">1. Borrower Personal Information</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Borrower Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Phone Number *</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543219"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Occupation / Job</label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                placeholder="e.g. Shopkeeper / Business"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Residential Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Civil Lines, Jaipur"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
              />
            </div>

            {/* KYC Inputs */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Aadhaar Number (UIDAI)</label>
              <input
                type="text"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleChange}
                placeholder="12-digit Aadhaar Number"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">PAN Number</label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
                placeholder="10-digit PAN ID"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Bank Account Number</label>
              <input
                type="text"
                name="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={handleChange}
                placeholder="Acc No / IFSC Code or Bank Name"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
              />
            </div>

            {/* Guarantor Info */}
            <div className="md:col-span-2 border-b border-brand-border/40 pb-2 pt-2">
              <h3 className="text-[10px] font-bold text-brand-emerald uppercase tracking-wider">2. Guarantor Details</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Guarantor Name</label>
              <input
                type="text"
                name="guarantorName"
                value={formData.guarantorName}
                onChange={handleChange}
                placeholder="e.g. Suresh Sharma"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Guarantor Phone</label>
              <input
                type="text"
                name="guarantorPhone"
                value={formData.guarantorPhone}
                onChange={handleChange}
                placeholder="e.g. 9876543211"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Guarantor Address</label>
              <input
                type="text"
                name="guarantorAddress"
                value={formData.guarantorAddress}
                onChange={handleChange}
                placeholder="Guarantor residential address"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Guarantor Identification Doc</label>
              <input
                type="text"
                name="guarantorIdDoc"
                value={formData.guarantorIdDoc}
                onChange={handleChange}
                placeholder="Aadhaar / Voter ID Number"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
              />
            </div>

            {/* Collaterals Info */}
            <div className="md:col-span-2 border-b border-brand-border/40 pb-2 pt-2">
              <h3 className="text-[10px] font-bold text-brand-amber uppercase tracking-wider">3. Collateral Assets (Girvi)</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Girvi Item (Collateral)</label>
              <select
                name="collateralType"
                value={formData.collateralType}
                onChange={handleChange}
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white outline-none transition"
              >
                <option value="None">None</option>
                <option value="Gold">Gold (Sona)</option>
                <option value="Silver">Silver (Chandi)</option>
                <option value="Vehicle">Vehicle (Gadi)</option>
                <option value="Land">Land / Property Plot</option>
                <option value="Documents">Files / Sign Papers</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Collateral Est. Value (Rupiya)</label>
              <input
                type="number"
                name="collateralValue"
                value={formData.collateralValue}
                onChange={handleChange}
                placeholder="e.g. 150000"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
                disabled={formData.collateralType === 'None'}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-brand-dim uppercase tracking-wide">Collateral Description</label>
              <input
                type="text"
                name="collateralDescription"
                value={formData.collateralDescription}
                onChange={handleChange}
                placeholder="e.g. Gold necklace (22 grams, Hallmarked)"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent/50 focus:ring-0 rounded-xl px-4 py-2.5 text-xs text-brand-text dark:text-white placeholder-brand-dim/50 outline-none transition"
                disabled={formData.collateralType === 'None'}
              />
            </div>

            {/* Document Uploader Area */}
            <div className="md:col-span-2 border-t border-brand-border/40 pt-4 space-y-4">
              <div className="flex items-center space-x-1.5">
                <Paperclip className="w-4 h-4 text-brand-accent" />
                <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">
                  KYC Document Manager
                </h4>
              </div>

              {/* Upload Input Fields */}
              <div className="bg-brand-bg/50 border border-brand-border p-4 rounded-xl space-y-3">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-brand-dim uppercase block">Select Files (You can select multiple files at once)</label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="text-xs text-brand-dim file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-brand-border file:text-white file:cursor-pointer"
                  />
                </div>
                
                {isEditMode && tempFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUploadTempQueue}
                    disabled={uploading}
                    className="w-full py-2 bg-brand-accent hover:bg-indigo-600 disabled:opacity-40 rounded-xl text-xs font-bold text-white transition flex items-center justify-center space-x-1"
                  >
                    <span>{uploading ? 'Uploading Attached Files...' : 'Upload Attached Files'}</span>
                  </button>
                )}
              </div>

              {/* Uploaded Documents List (Shows files saved in database) */}
              {uploadedDocs.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-brand-emerald uppercase flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verified Active Documents ({uploadedDocs.length})
                  </span>
                  <div className="space-y-1.5">
                    {uploadedDocs.map(doc => (
                      <div key={doc._id} className="flex justify-between items-center bg-brand-bg/30 border border-brand-border/50 px-3.5 py-2 rounded-xl text-xs">
                        <div className="flex items-center space-x-2.5 truncate">
                          <FileCheck className="w-4.5 h-4.5 text-brand-emerald shrink-0" />
                          <span className="text-white font-medium truncate max-w-[200px]" title={doc.label}>{doc.label}</span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setViewingDoc({ label: doc.label, fileUrl: doc.fileUrl })}
                            className="px-2.5 py-1 rounded bg-brand-accent/20 hover:bg-brand-accent text-[10px] font-bold text-white transition"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc._id)}
                            className="p-1 rounded bg-brand-rose/10 text-brand-rose hover:bg-brand-rose hover:text-white transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Queued Documents List (Shows selected files pending save) */}
              {tempFiles.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-brand-amber uppercase tracking-wider block">
                    {isEditMode ? 'Pending upload queue' : 'Queued attachments (will save on register)'}
                  </span>
                  <div className="space-y-1.5">
                    {tempFiles.map(temp => (
                      <div key={temp.tempId} className="bg-brand-bg/30 border border-brand-border/50 px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                          <Upload className="w-4 h-4 text-brand-dim shrink-0" />
                          <input
                            type="text"
                            value={temp.label}
                            onChange={(e) => handleUpdateTempLabel(temp.tempId, e.target.value)}
                            className="bg-transparent border-b border-brand-border focus:border-brand-accent/50 outline-none text-xs text-brand-text dark:text-white py-0.5 w-full focus:ring-0"
                            placeholder="Enter document label..."
                            title="Edit label before saving"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTempFile(temp.tempId)}
                          className="p-1.5 rounded-lg bg-brand-rose/10 text-brand-rose hover:bg-brand-rose hover:text-white transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
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
              {loading ? 'Processing Profile & Documents...' : isEditMode ? 'Update Profile' : 'Register Borrower'}
            </button>
          </div>
        </form>

      </div>

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

    </div>,
    document.body
  );
}
