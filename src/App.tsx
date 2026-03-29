/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  ChevronDown, 
  Plus, 
  Upload, 
  CheckCircle2, 
  Info,
  RefreshCw,
  X,
  AlertTriangle
} from 'lucide-react';
import { ONBOARDING_STEPS, Step } from './types.ts';
import { KYCCopilot } from './components/KYCCopilot.tsx';

const InputField = ({ label, placeholder, value, onChange, type = "text", disabled = false, optional = false }: any) => (
  <div className="mb-6">
    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
      {label} {optional && <span className="lowercase font-normal">(optional)</span>}
    </label>
    <input
      type={type}
      disabled={disabled}
      className="w-full bg-white border border-border-muted rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-border-active transition-colors disabled:opacity-50"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);

const SelectField = ({ label, placeholder, options = [], value, onChange }: any) => (
  <div className="mb-6">
    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
      {label}
    </label>
    <div className="relative">
      <select 
        value={value !== undefined ? value : ""}
        onChange={onChange || (() => {})}
        className="w-full bg-white border border-border-muted rounded-lg px-4 py-3 text-sm appearance-none focus:outline-none focus:border-border-active transition-colors"
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt: any) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
    </div>
  </div>
);

const FileUpload = ({ label, subtext }: any) => (
  <div className="mb-6">
    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
      {label}
    </label>
    <div className="flex items-center gap-4 bg-white border border-border-muted rounded-lg p-2">
      <label className="bg-accent-blue hover:bg-accent-blue-hover text-white px-4 py-2 rounded text-xs font-medium cursor-pointer transition-colors">
        Choose file
        <input type="file" className="hidden" />
      </label>
      <span className="text-xs text-text-muted">No file chosen</span>
    </div>
    {subtext && <p className="text-[10px] text-text-muted mt-2">{subtext}</p>}
  </div>
);

const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-border-muted"
      >
        <div className="flex items-center gap-3 mb-4 text-amber-500">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-text-muted hover:bg-slate-50 border border-border-muted transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [currentStepId, setCurrentStepId] = useState('merchant-pan-ckyc');
  const [mode, setMode] = useState<'test' | 'prod'>('test');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: 'navigation' | 'copilot' | 'next'; pendingId?: string }>({
    isOpen: false,
    type: 'navigation'
  });
  
  // Prefilled Merchant Data
  const [merchantData, setMerchantData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    mobile: '9876543210',
    businessName: 'JD Enterprises',
    entityType: 'Private Limited'
  });

  // PAN Data (to be extracted)
  const [panData, setPanData] = useState({
    panNumber: '',
    panHolderName: '',
    dob: ''
  });

  const [isUploadingPan, setIsUploadingPan] = useState(false);
  
  // CKYC State
  const [ckycData, setCkycData] = useState({
    consent: false,
    otp: '',
    otpSent: false,
    isVerifying: false,
    isVerified: false
  });

  // Business Details Step State
  const [businessData, setBusinessData] = useState({
    category: '',
    subCategory: '',
    type: '',
    volume: '',
    website: '',
    websiteVerified: false,
    isVerifyingWebsite: false,
    bankProofVerified: false,
    isUploadingBankProof: false
  });

  // Signatory Details Step State
  const [signatoryData, setSignatoryData] = useState({
    name: '',
    pan: '',
    email: '',
    contactType: 'Signing Authority',
    isAuthorised: 'Yes',
    panProof: null as any,
    addressProof: null as any,
    isExtracting: false,
    digiLockerConsent: false,
    digiLockerLink: '',
    isGeneratingDigiLocker: false,
    isDigiLockerVerified: false,
    sameAsMerchant: false
  });

  // Address Step State
  const [addressData, setAddressData] = useState({
    registered: { line: '', city: '', state: '', pincode: '' },
    communication: { line: '', city: '', state: '', pincode: '', sameAsRegistered: true }
  });

  // UBO Details Step State
  const [uboData, setUboData] = useState({
    sameAsSignatory: false,
    name: '',
    pan: '',
    email: '',
    dob: '',
    isVerified: false
  });

  // Business Members Step State
  const [businessMemberData, setBusinessMemberData] = useState({
    sameAsSignatory: false,
    name: '',
    pan: '',
    pincode: '',
    dob: '',
    designation: '',
    isVerified: false
  });
  
  const currentStepIndex = ONBOARDING_STEPS.findIndex(s => s.id === currentStepId);
  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  
  const handleNext = () => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setConfirmModal({
        isOpen: true,
        type: 'next',
        pendingId: ONBOARDING_STEPS[currentStepIndex + 1].id
      });
    }
  };

  const confirmNext = () => {
    if (confirmModal.pendingId) {
      setCompletedStepIds(prev => [...new Set([...prev, currentStepId])]);
      setCurrentStepId(confirmModal.pendingId);
      setConfirmModal({ isOpen: false, type: 'next' });
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setConfirmModal({
        isOpen: true,
        type: 'navigation',
        pendingId: ONBOARDING_STEPS[currentStepIndex - 1].id
      });
    }
  };

  const handleStepClick = (stepId: string) => {
    if (stepId === currentStepId) return;
    setConfirmModal({
      isOpen: true,
      type: 'navigation',
      pendingId: stepId
    });
  };

  const confirmNavigation = () => {
    if (confirmModal.pendingId) {
      setCurrentStepId(confirmModal.pendingId);
      setConfirmModal({ isOpen: false, type: 'navigation' });
    }
  };

  const handleCloseCopilot = () => {
    setConfirmModal({
      isOpen: true,
      type: 'copilot'
    });
  };

  const confirmCloseCopilot = () => {
    setIsCopilotOpen(false);
    setConfirmModal({ isOpen: false, type: 'copilot' });
  };

  const handleExtractPan = () => {
    setIsUploadingPan(true);
    // Simulate OCR extraction
    setTimeout(() => {
      setPanData({
        panNumber: 'ABCDE1234F',
        panHolderName: 'JOHN DOE',
        dob: '1990-01-01'
      });
      setIsUploadingPan(false);
    }, 1500);
  };

  const handleSendOtp = () => {
    if (!ckycData.consent) {
      alert("Please provide consent for CKYC verification.");
      return;
    }
    setCkycData(prev => ({ ...prev, otpSent: true }));
    alert("OTP sent to your registered mobile number.");
  };

  const handleVerifyOtp = () => {
    if (ckycData.otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }
    setCkycData(prev => ({ ...prev, isVerifying: true }));
    // Simulate OTP verification
    setTimeout(() => {
      setCkycData(prev => ({ ...prev, isVerifying: false, isVerified: true }));
      // Prefill addresses from CKYC
      setAddressData({
        registered: {
          line: '123, Tech Park, Whitefield',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560066'
        },
        communication: {
          line: '123, Tech Park, Whitefield',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560066',
          sameAsRegistered: true
        }
      });
      alert("CKYC Verification Successful! Address details pre-filled.");
    }, 1500);
  };

  const handleWebsiteChange = (url: string) => {
    setBusinessData(prev => ({ ...prev, website: url, websiteVerified: false }));
    if (url.includes('.') && url.length > 5) {
      setBusinessData(prev => ({ ...prev, isVerifyingWebsite: true }));
      // Simulate instant verification
      setTimeout(() => {
        setBusinessData(prev => ({ ...prev, isVerifyingWebsite: false, websiteVerified: true }));
      }, 1200);
    }
  };

  const handleUploadBankProof = () => {
    setBusinessData(prev => ({ ...prev, isUploadingBankProof: true }));
    // Simulate bank proof verification
    setTimeout(() => {
      setBusinessData(prev => ({ ...prev, isUploadingBankProof: false, bankProofVerified: true }));
    }, 2000);
  };

  const handleExtractSignatory = () => {
    setSignatoryData(prev => ({ ...prev, isExtracting: true }));
    // Simulate extraction from documents
    setTimeout(() => {
      setSignatoryData(prev => ({
        ...prev,
        name: 'Jane Smith',
        pan: 'FGHJK5678L',
        email: 'jane.smith@jdent.com',
        isExtracting: false
      }));
      alert("Signatory details extracted successfully!");
    }, 1800);
  };

  const handleConfirmUbo = () => {
    setUboData(prev => ({
      ...prev,
      name: signatoryData.name || 'Jane Smith',
      pan: signatoryData.pan || 'FGHJK5678L',
      email: signatoryData.email || 'jane.smith@jdent.com',
      isVerified: true
    }));
  };

  const handleConfirmMembers = () => {
    setBusinessMemberData(prev => ({
      ...prev,
      name: signatoryData.name || 'Jane Smith',
      pan: signatoryData.pan || 'FGHJK5678L',
      pincode: addressData.registered.pincode || '560066',
      isVerified: true
    }));
  };

  const handleSignatorySameAsMerchant = (checked: boolean) => {
    setSignatoryData(prev => ({
      ...prev,
      sameAsMerchant: checked,
      name: checked ? merchantData.name : '',
      email: checked ? merchantData.email : '',
    }));
  };

  const handleUboSameAsSignatory = (checked: boolean) => {
    setUboData(prev => ({
      ...prev,
      sameAsSignatory: checked,
      name: checked ? signatoryData.name : '',
      pan: checked ? signatoryData.pan : '',
      email: checked ? signatoryData.email : '',
    }));
  };

  const handleMemberSameAsSignatory = (checked: boolean) => {
    setBusinessMemberData(prev => ({
      ...prev,
      sameAsSignatory: checked,
      name: checked ? signatoryData.name : '',
      pan: checked ? signatoryData.pan : '',
      pincode: checked ? addressData.registered.pincode : '',
    }));
  };

  const handleGenerateDigiLockerLink = () => {
    if (!signatoryData.digiLockerConsent) {
      alert("Please provide consent for DigiLocker authorization.");
      return;
    }
    setSignatoryData(prev => ({ ...prev, isGeneratingDigiLocker: true }));
    // Simulate link generation
    setTimeout(() => {
      setSignatoryData(prev => ({
        ...prev,
        isGeneratingDigiLocker: false,
        digiLockerLink: 'https://digilocker.gov.in/auth/authorize?client_id=PAYU_ONBOARDING&state=xyz123',
        isDigiLockerVerified: true
      }));
      alert("DigiLocker authorization link generated!");
    }, 1500);
  };

  const renderForm = () => {
    switch (currentStepId) {
      case 'auth':
        return (
          <>
            <InputField label="Client ID" placeholder="Enter your client ID" />
            <InputField label="Client Secret" placeholder="Enter your client secret" type="password" />
            <button 
              onClick={handleNext}
              className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white py-3 rounded-lg font-medium transition-colors mt-4"
            >
              Authenticate
            </button>
          </>
        );
      case 'merchant-pan-ckyc':
        return (
          <>
            <div className="space-y-8">
              {/* Merchant Info Section */}
              <section>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-border-muted pb-2">Merchant Information</h3>
                <InputField 
                  label="Merchant Name" 
                  placeholder="Enter merchant name" 
                  value={merchantData.name}
                  onChange={(e: any) => setMerchantData({...merchantData, name: e.target.value})}
                />
                <InputField 
                  label="Email" 
                  placeholder="merchant@example.com" 
                  value={merchantData.email}
                  onChange={(e: any) => setMerchantData({...merchantData, email: e.target.value})}
                />
                <InputField 
                  label="Mobile (10 digits)" 
                  placeholder="9876543210" 
                  value={merchantData.mobile}
                  onChange={(e: any) => setMerchantData({...merchantData, mobile: e.target.value})}
                />
                <InputField 
                  label="Business Name" 
                  placeholder="Enter business name" 
                  value={merchantData.businessName}
                  onChange={(e: any) => setMerchantData({...merchantData, businessName: e.target.value})}
                />
                <SelectField 
                  label="Entity Type" 
                  placeholder="Select entity type" 
                  value={merchantData.entityType}
                  onChange={(e: any) => setMerchantData({...merchantData, entityType: e.target.value})}
                  options={['Proprietorship', 'Partnership', 'Private Limited', 'Public Limited']} 
                />
                <InputField label="Product" placeholder="PayUbiz" disabled value="PayUbiz" />
              </section>

              {/* PAN Details Section */}
              <section>
                <div className="flex items-center justify-between mb-4 border-b border-border-muted pb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">PAN Details</h3>
                  <div className="flex items-center gap-2">
                    <label className="bg-white hover:bg-slate-50 text-text-muted px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-border-muted transition-colors flex items-center gap-2 shadow-sm">
                      <Upload className="w-3 h-3" />
                      {isUploadingPan ? 'Extracting...' : 'Upload & Extract'}
                      <input type="file" className="hidden" onChange={handleExtractPan} disabled={isUploadingPan} />
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3 items-start">
                  <Info className="w-5 h-5 text-accent-blue shrink-0 mt-0.5" />
                  <p className="text-xs text-accent-blue leading-relaxed font-medium">
                    Upload your PAN card for automatic extraction or fill details manually.
                  </p>
                </div>

                <InputField 
                  label="PAN Number" 
                  placeholder="ABCDE1234F" 
                  value={panData.panNumber}
                  onChange={(e: any) => setPanData({...panData, panNumber: e.target.value})}
                />
                <InputField 
                  label="PAN Holder Name" 
                  placeholder="Full name as on PAN" 
                  value={panData.panHolderName}
                  onChange={(e: any) => setPanData({...panData, panHolderName: e.target.value})}
                />
                <InputField 
                  label="Date of Birth / Incorporation" 
                  placeholder="YYYY-MM-DD" 
                  value={panData.dob}
                  onChange={(e: any) => setPanData({...panData, dob: e.target.value})}
                />
              </section>

              {/* CKYC Verification Section */}
              <section>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-border-muted pb-2">CKYC Verification</h3>
                
                <div className="bg-slate-50 border border-border-muted rounded-lg p-4 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={ckycData.consent}
                      onChange={(e) => setCkycData(prev => ({ ...prev, consent: e.target.checked }))}
                      className="mt-1 w-4 h-4 rounded border-border-muted bg-white text-accent-blue focus:ring-0" 
                    />
                    <span className="text-xs text-text-muted leading-relaxed">
                      I hereby provide my consent to fetch my CKYC details using my PAN and Mobile number for the purpose of merchant onboarding.
                    </span>
                  </label>
                </div>

                {!ckycData.otpSent ? (
                  <button 
                    onClick={handleSendOtp}
                    disabled={!ckycData.consent}
                    className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm ${
                      ckycData.consent 
                        ? 'bg-accent-blue hover:bg-accent-blue-hover text-white' 
                        : 'bg-slate-100 text-text-muted border border-border-muted cursor-not-allowed'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    Send OTP for CKYC
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <InputField 
                        label="Enter OTP" 
                        placeholder="6-digit OTP" 
                        value={ckycData.otp}
                        onChange={(e: any) => setCkycData(prev => ({ ...prev, otp: e.target.value }))}
                        disabled={ckycData.isVerified}
                      />
                      {ckycData.isVerified && (
                        <div className="absolute right-3 top-[34px] flex items-center gap-1 text-accent-green">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase">Verified</span>
                        </div>
                      )}
                    </div>
                    
                    {!ckycData.isVerified && (
                      <button 
                        onClick={handleVerifyOtp}
                        disabled={ckycData.isVerifying}
                        className="w-full bg-accent-green hover:bg-accent-green/80 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {ckycData.isVerifying ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify OTP'
                        )}
                      </button>
                    )}
                  </div>
                )}
              </section>
            </div>

            <button 
              onClick={handleNext}
              disabled={!ckycData.isVerified}
              className={`w-full py-3 rounded-lg font-medium transition-colors mt-8 shadow-md ${
                ckycData.isVerified
                  ? 'bg-accent-blue hover:bg-accent-blue-hover text-white'
                  : 'bg-slate-100 text-text-muted border border-border-muted cursor-not-allowed'
              }`}
            >
              {ckycData.isVerified ? 'Continue to Business Details' : 'Complete CKYC to Continue'}
            </button>
          </>
        );
      case 'ckyc':
        return null; // Merged into merchant-pan-ckyc
      case 'business-details':
        return (
          <>
            <div className="space-y-8">
              <section>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-border-muted pb-2">Business Information</h3>
                <SelectField label="Business Category" placeholder="Select category" options={['E-commerce', 'Retail', 'Services']} />
                <SelectField label="Business Sub-category" placeholder="Select sub-category" />
                <InputField label="Business Type" placeholder="e.g., Online, Offline, Both" />
                <InputField label="Monthly Expected Volume" placeholder="e.g., 500000" />
              </section>

              <section>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-border-muted pb-2">Website & Verification</h3>
                <div className="relative">
                  <InputField 
                    label="Website URL" 
                    placeholder="https://example.com" 
                    value={businessData.website}
                    onChange={(e: any) => handleWebsiteChange(e.target.value)}
                  />
                  {businessData.isVerifyingWebsite && (
                    <div className="absolute right-3 top-[34px] flex items-center gap-2 text-accent-blue">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span className="text-[10px] font-bold uppercase">Verifying...</span>
                    </div>
                  )}
                  {businessData.websiteVerified && (
                    <div className="absolute right-3 top-[34px] flex items-center gap-1 text-accent-green">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase">Website Verified</span>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-border-muted pb-2">Bank Proof</h3>
                <div className="bg-slate-50 border border-border-muted rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-bold text-slate-900">Bank Account Proof</h4>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider bg-slate-200 px-2 py-1 rounded">Required</span>
                  </div>
                  <SelectField label="Document Type" placeholder="Select document type" options={['Cancelled Cheque', 'Bank Statement', 'Passbook']} />
                  
                  {businessData.bankProofVerified ? (
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex gap-3 items-center">
                      <CheckCircle2 className="w-5 h-5 text-accent-green shrink-0" />
                      <p className="text-xs text-accent-green font-medium">
                        Bank cheque verified successfully!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <FileUpload label="Upload Document" subtext="JPG, PNG, or PDF — Max 5 MB" />
                      <button 
                        onClick={handleUploadBankProof}
                        disabled={businessData.isUploadingBankProof}
                        className="w-full bg-white border border-border-muted hover:border-slate-400 text-text-muted py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        {businessData.isUploadingBankProof ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3" /> Upload & Verify
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <button 
              onClick={handleNext}
              className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white py-3 rounded-lg font-medium transition-colors mt-8"
            >
              Update Business & Verification Details
            </button>
          </>
        );
      case 'bank-details':
        return null; // Removed
      case 'bank-proof':
        return null; // Merged into business-details
      case 'website-details':
        return null; // Merged into business-details
      case 'signatory-details':
        return (
          <>
            <div className="space-y-8">
              {/* Same as Merchant Checkbox */}
              <div className="bg-slate-50 border border-border-muted rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={signatoryData.sameAsMerchant}
                    onChange={(e) => handleSignatorySameAsMerchant(e.target.checked)}
                    className="w-4 h-4 rounded border-border-muted bg-white text-accent-blue focus:ring-0" 
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Same as Merchant Details
                  </span>
                </label>
              </div>

              {/* Document Extraction Section */}
              <section>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3 items-start">
                  <Info className="w-5 h-5 text-accent-blue shrink-0 mt-0.5" />
                  <p className="text-xs text-accent-blue leading-relaxed font-medium">
                    Upload PAN and Address Proof of the signing authority to pre-fill details.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 border border-border-muted rounded-xl p-4">
                    <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">PAN Proof</h4>
                    <FileUpload label="Upload PAN" subtext="Max 2 MB" />
                  </div>
                  <div className="bg-slate-50 border border-border-muted rounded-xl p-4">
                    <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Address Proof</h4>
                    <FileUpload label="Upload Address Proof" subtext="Max 2 MB" />
                  </div>
                </div>

                <button 
                  onClick={handleExtractSignatory}
                  disabled={signatoryData.isExtracting}
                  className="w-full bg-white border border-border-muted hover:border-slate-400 text-text-muted py-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {signatoryData.isExtracting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Extracting Details...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" /> Extract from Documents
                    </>
                  )}
                </button>
              </section>

              {/* Signatory Details Section */}
              <section>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-border-muted pb-2">Signatory Information</h3>
                <div className="space-y-4">
                  <SelectField 
                    label="Authorised Signatory" 
                    placeholder="No" 
                    options={['Yes', 'No']} 
                    value={signatoryData.isAuthorised}
                    onChange={(e: any) => setSignatoryData({...signatoryData, isAuthorised: e.target.value})}
                  />
                  <InputField 
                    label="Name" 
                    placeholder="Full name" 
                    value={signatoryData.name}
                    onChange={(e: any) => setSignatoryData({...signatoryData, name: e.target.value})}
                  />
                  <InputField 
                    label="PAN Card Number" 
                    placeholder="ABCDE1234F" 
                    value={signatoryData.pan}
                    onChange={(e: any) => setSignatoryData({...signatoryData, pan: e.target.value})}
                  />
                  <InputField 
                    label="Email" 
                    placeholder="signatory@example.com" 
                    value={signatoryData.email}
                    onChange={(e: any) => setSignatoryData({...signatoryData, email: e.target.value})}
                  />
                  <InputField 
                    label="Contact Detail Type" 
                    placeholder="Signing Authority" 
                    value={signatoryData.contactType}
                    onChange={(e: any) => setSignatoryData({...signatoryData, contactType: e.target.value})}
                  />
                </div>
              </section>

              {/* DigiLocker Section */}
              <section>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-border-muted pb-2">DigiLocker Authorization</h3>
                
                <div className="bg-slate-50 border border-border-muted rounded-lg p-4 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={signatoryData.digiLockerConsent}
                      onChange={(e) => setSignatoryData(prev => ({ ...prev, digiLockerConsent: e.target.checked }))}
                      className="mt-1 w-4 h-4 rounded border-border-muted bg-white text-accent-blue focus:ring-0" 
                    />
                    <span className="text-xs text-text-muted leading-relaxed">
                      I hereby authorize PayU to fetch my documents from DigiLocker for the purpose of identity verification and onboarding.
                    </span>
                  </label>
                </div>

                {!signatoryData.isDigiLockerVerified ? (
                  <button 
                    onClick={handleGenerateDigiLockerLink}
                    disabled={!signatoryData.digiLockerConsent || signatoryData.isGeneratingDigiLocker}
                    className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm ${
                      signatoryData.digiLockerConsent 
                        ? 'bg-accent-blue hover:bg-accent-blue-hover text-white' 
                        : 'bg-slate-100 text-text-muted border border-border-muted cursor-not-allowed'
                    }`}
                  >
                    {signatoryData.isGeneratingDigiLocker ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Link...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Generate DigiLocker Link
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex gap-3 items-center">
                      <CheckCircle2 className="w-5 h-5 text-accent-green shrink-0" />
                      <div>
                        <p className="text-xs text-accent-green font-bold">DigiLocker Authorization Successful!</p>
                        <p className="text-[10px] text-slate-500 mt-1 truncate">{signatoryData.digiLockerLink}</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <button 
              onClick={handleNext}
              disabled={!signatoryData.isDigiLockerVerified}
              className={`w-full py-3 rounded-lg font-medium transition-colors mt-8 shadow-md ${
                signatoryData.isDigiLockerVerified
                  ? 'bg-accent-blue hover:bg-accent-blue-hover text-white'
                  : 'bg-slate-100 text-text-muted border border-border-muted cursor-not-allowed'
              }`}
            >
              {signatoryData.isDigiLockerVerified ? 'Continue to Addresses' : 'Complete DigiLocker to Continue'}
            </button>
          </>
        );
      case 'digilocker':
        return null; // Merged into signatory-details
      case 'addresses':
        return (
          <>
            <div className="mb-8">
              <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-4">Registered Address</h3>
              <InputField 
                label="Address Line" 
                placeholder="Street address" 
                value={addressData.registered.line}
                onChange={(e: any) => setAddressData({
                  ...addressData, 
                  registered: { ...addressData.registered, line: e.target.value }
                })}
              />
              <div className="grid grid-cols-3 gap-4">
                <InputField 
                  label="City" 
                  placeholder="City" 
                  value={addressData.registered.city}
                  onChange={(e: any) => setAddressData({
                    ...addressData, 
                    registered: { ...addressData.registered, city: e.target.value }
                  })}
                />
                <InputField 
                  label="State" 
                  placeholder="State" 
                  value={addressData.registered.state}
                  onChange={(e: any) => setAddressData({
                    ...addressData, 
                    registered: { ...addressData.registered, state: e.target.value }
                  })}
                />
                <InputField 
                  label="Pincode" 
                  placeholder="123456" 
                  value={addressData.registered.pincode}
                  onChange={(e: any) => setAddressData({
                    ...addressData, 
                    registered: { ...addressData.registered, pincode: e.target.value }
                  })}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Communication Address</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={addressData.communication.sameAsRegistered}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAddressData({
                        ...addressData,
                        communication: {
                          ...addressData.communication,
                          sameAsRegistered: checked,
                          line: checked ? addressData.registered.line : '',
                          city: checked ? addressData.registered.city : '',
                          state: checked ? addressData.registered.state : '',
                          pincode: checked ? addressData.registered.pincode : '',
                        }
                      });
                    }}
                    className="w-4 h-4 rounded border-border-muted bg-[#161b22] text-accent-blue focus:ring-0" 
                  />
                  <span className="text-[10px] text-text-muted uppercase font-bold">Same as registered</span>
                </label>
              </div>
              <InputField 
                label="Address Line" 
                placeholder="Street address" 
                value={addressData.communication.line}
                onChange={(e: any) => setAddressData({
                  ...addressData, 
                  communication: { ...addressData.communication, line: e.target.value, sameAsRegistered: false }
                })}
              />
              <div className="grid grid-cols-3 gap-4">
                <InputField 
                  label="City" 
                  placeholder="City" 
                  value={addressData.communication.city}
                  onChange={(e: any) => setAddressData({
                    ...addressData, 
                    communication: { ...addressData.communication, city: e.target.value, sameAsRegistered: false }
                  })}
                />
                <InputField 
                  label="State" 
                  placeholder="State" 
                  value={addressData.communication.state}
                  onChange={(e: any) => setAddressData({
                    ...addressData, 
                    communication: { ...addressData.communication, state: e.target.value, sameAsRegistered: false }
                  })}
                />
                <InputField 
                  label="Pincode" 
                  placeholder="123456" 
                  value={addressData.communication.pincode}
                  onChange={(e: any) => setAddressData({
                    ...addressData, 
                    communication: { ...addressData.communication, pincode: e.target.value, sameAsRegistered: false }
                  })}
                />
              </div>
            </div>
            <button 
              onClick={handleNext}
              className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white py-3 rounded-lg font-medium transition-colors mt-4"
            >
              Update Addresses
            </button>
          </>
        );
      case 'vkyc':
        return (
          <>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3 items-start">
              <Info className="w-5 h-5 text-accent-blue shrink-0 mt-0.5" />
              <p className="text-xs text-accent-blue leading-relaxed font-medium">
                Video KYC is optional. You may skip this step.
              </p>
            </div>
            <InputField label="Merchant ID" placeholder="Auto-populated" disabled />
            <div className="flex gap-4 mt-4">
              <button 
                onClick={handleNext}
                className="flex-1 bg-accent-blue hover:bg-accent-blue-hover text-white py-3 rounded-lg font-medium transition-colors shadow-sm"
              >
                Create VKYC Profile
              </button>
              <button 
                onClick={handleNext}
                className="px-8 bg-white border border-border-muted hover:border-slate-400 text-text-muted py-3 rounded-lg font-medium transition-colors shadow-sm"
              >
                Skip
              </button>
            </div>
          </>
        );
      case 'ubo-details':
        return (
          <>
            {uboData.isVerified && (
              <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Copilot Draft Ready</p>
                    <p className="text-[10px] text-text-muted">I've prepared these details based on your documents. Please review.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-accent-blue/10 px-2 py-1 rounded text-[10px] font-bold text-accent-blue uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </div>
              </div>
            )}
            <div className="bg-slate-50 border border-border-muted rounded-lg p-4 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={uboData.sameAsSignatory}
                  onChange={(e) => handleUboSameAsSignatory(e.target.checked)}
                  className="w-4 h-4 rounded border-border-muted bg-white text-accent-blue focus:ring-0" 
                />
                <span className="text-xs text-slate-700 font-medium">
                  Same as Signatory Details
                </span>
              </label>
            </div>

            <div className="flex gap-2 mb-6">
              <button className="bg-accent-blue text-white px-4 py-2 rounded text-xs font-bold shadow-sm">UBO 1 *</button>
              <button className="bg-white text-text-muted px-4 py-2 rounded text-xs font-medium border border-border-muted hover:bg-slate-50 transition-colors shadow-sm">UBO 2 *</button>
              <button className="bg-white text-text-muted w-8 h-8 rounded flex items-center justify-center border border-border-muted hover:border-slate-400 transition-colors shadow-sm">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <InputField 
              label="Beneficiary Name" 
              placeholder="Full name" 
              value={uboData.name}
              onChange={(e: any) => setUboData({...uboData, name: e.target.value, sameAsSignatory: false})}
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="PAN Number" 
                placeholder="ABCDE1234F" 
                value={uboData.pan}
                onChange={(e: any) => setUboData({...uboData, pan: e.target.value, sameAsSignatory: false})}
              />
              <InputField label="Ownership %" placeholder="e.g., 25" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="Date of Birth" 
                placeholder="YYYY-MM-DD" 
                value={uboData.dob}
                onChange={(e: any) => setUboData({...uboData, dob: e.target.value, sameAsSignatory: false})}
              />
              <InputField label="Nationality" placeholder="IN" value="IN" />
            </div>
            <InputField 
              label="Email" 
              placeholder="ubo@example.com" 
              optional 
              value={uboData.email}
              onChange={(e: any) => setUboData({...uboData, email: e.target.value, sameAsSignatory: false})}
            />
            <InputField label="Address" placeholder="Address line" />
            <InputField label="Pincode" placeholder="123456" />
            <button 
              onClick={handleNext}
              className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white py-3 rounded-lg font-medium transition-colors mt-4"
            >
              Update UBO Details
            </button>
          </>
        );
      case 'business-members':
        return (
          <>
            {businessMemberData.isVerified && (
              <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Copilot Draft Ready</p>
                    <p className="text-[10px] text-text-muted">I've prepared the member list from your documents. Please review.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-accent-blue/10 px-2 py-1 rounded text-[10px] font-bold text-accent-blue uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </div>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3 items-start">
              <Info className="w-5 h-5 text-accent-blue shrink-0 mt-0.5" />
              <p className="text-xs text-accent-blue leading-relaxed font-medium">
                At least 1 Director and 1 KMP (e.g. CEO/CFO/Senior Management) are required.
              </p>
            </div>

            <div className="bg-slate-50 border border-border-muted rounded-lg p-4 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={businessMemberData.sameAsSignatory}
                  onChange={(e) => handleMemberSameAsSignatory(e.target.checked)}
                  className="w-4 h-4 rounded border-border-muted bg-white text-accent-blue focus:ring-0" 
                />
                <span className="text-xs text-slate-700 font-medium">
                  Same as Signatory Details
                </span>
              </label>
            </div>

            <div className="flex gap-2 mb-6">
              <button className="bg-accent-blue text-white px-4 py-2 rounded text-xs font-bold shadow-sm">Member 1 *</button>
              <button className="bg-white text-text-muted px-4 py-2 rounded text-xs font-medium border border-border-muted hover:bg-slate-50 transition-colors shadow-sm">Member 2 *</button>
              <button className="bg-white text-text-muted w-8 h-8 rounded flex items-center justify-center border border-border-muted hover:border-slate-400 transition-colors shadow-sm">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <InputField 
              label="Name" 
              placeholder="Member name" 
              value={businessMemberData.name}
              onChange={(e: any) => setBusinessMemberData({...businessMemberData, name: e.target.value, sameAsSignatory: false})}
            />
            <SelectField 
              label="Designation" 
              placeholder="Select designation" 
              options={['Director', 'CEO', 'CFO', 'Partner']} 
              value={businessMemberData.designation}
              onChange={(e: any) => setBusinessMemberData({...businessMemberData, designation: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Date of Joining" placeholder="MM/YYYY" />
              <InputField 
                label="Date of Birth" 
                placeholder="DD/MM/YYYY" 
                value={businessMemberData.dob}
                onChange={(e: any) => setBusinessMemberData({...businessMemberData, dob: e.target.value, sameAsSignatory: false})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField 
                label="PAN Number" 
                placeholder="ABCDE1234F" 
                value={businessMemberData.pan}
                onChange={(e: any) => setBusinessMemberData({...businessMemberData, pan: e.target.value, sameAsSignatory: false})}
              />
              <InputField 
                label="Pincode" 
                placeholder="123456" 
                value={businessMemberData.pincode}
                onChange={(e: any) => setBusinessMemberData({...businessMemberData, pincode: e.target.value, sameAsSignatory: false})}
              />
            </div>
            <button 
              onClick={handleNext}
              className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white py-3 rounded-lg font-medium transition-colors mt-4"
            >
              Submit Business Members
            </button>
          </>
        );
      case 'upload-kyc':
        const docs = [
          { title: 'Certificate of Incorporation', required: true },
          { title: 'Board Resolution', required: true },
          { title: 'GST Certificate', required: true },
          { title: 'MOA / AOA', required: true },
          { title: 'Utility Bill (Business Address)', required: true },
          { title: 'Partnership Deed', required: false },
        ];
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3 items-start">
              <Info className="w-5 h-5 text-accent-blue shrink-0 mt-0.5" />
              <p className="text-xs text-accent-blue leading-relaxed font-medium">
                Some documents (PAN, Address Proof, Bank Proof) have already been collected in previous steps. Please upload the remaining business documents.
              </p>
            </div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-text-muted">Upload each document individually</p>
              <button className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-wider hover:text-slate-900 transition-colors">
                <RefreshCw className="w-3 h-3" /> Refresh Docs
              </button>
            </div>
            {docs.map((doc, i) => (
              <div key={i} className="bg-slate-50 border border-border-muted rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-sm font-bold text-slate-900">{doc.title}</h4>
                  {doc.required && <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider bg-slate-200 px-2 py-1 rounded">Required</span>}
                </div>
                <SelectField label="Document Type" placeholder="Select type" />
                <FileUpload label="File" />
                <button className="w-full bg-white border border-border-muted hover:border-slate-400 text-text-muted py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <Upload className="w-3 h-3" /> Upload
                </button>
              </div>
            ))}
            <button 
              onClick={handleNext}
              className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white py-3 rounded-lg font-medium transition-colors mt-4"
            >
              Finish Uploading
            </button>
          </div>
        );
      case 'approval':
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-blue-50 border border-accent-blue/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <RefreshCw className="w-10 h-10 text-accent-blue animate-spin" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900">Application Under Review</h3>
            <p className="text-text-muted text-sm max-w-md mb-8">
              Your documents and details are being verified by our compliance team. This usually takes 24-48 hours. You will be notified once approved.
            </p>
            <div className="bg-slate-50 border border-border-muted rounded-xl p-6 w-full max-w-md shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-text-muted font-medium">Verification Progress</span>
                <span className="text-xs font-bold text-accent-blue">85%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-accent-blue h-full w-[85%] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]" />
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-left">
                  <CheckCircle2 className="w-4 h-4 text-accent-green" />
                  <span className="text-xs text-slate-700 font-medium">Identity Verification</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <CheckCircle2 className="w-4 h-4 text-accent-green" />
                  <span className="text-xs text-slate-700 font-medium">Business Proof Verification</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <RefreshCw className="w-4 h-4 text-accent-blue animate-spin" />
                  <span className="text-xs text-slate-700 font-medium">Compliance Review</span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleNext}
              className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white py-3 rounded-lg font-medium transition-colors mt-8 shadow-md"
            >
              Simulate Approval (Continue)
            </button>
          </div>
        );
      case 'esign':
        return (
          <>
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-6 flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-accent-green shrink-0 mt-0.5" />
              <p className="text-xs text-accent-green leading-relaxed font-medium">
                Your application has been approved! Please review and e-sign the service agreement to complete the onboarding.
              </p>
            </div>
            <InputField label="Merchant UUID" placeholder="Auto-populated" value="PAYU-MERCH-8823-1102" disabled />
            <div className="bg-slate-50 border border-border-muted rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-900">Service Agreement.pdf</h4>
                <button className="text-accent-blue text-xs font-bold hover:underline">View Document</button>
              </div>
              <p className="text-[10px] text-text-muted leading-relaxed">
                By clicking the button below, you agree to the terms and conditions outlined in the service agreement. You will be redirected to our e-sign partner to complete the process.
              </p>
            </div>
            <button 
              onClick={() => alert('Redirecting to E-Sign partner...')}
              className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white py-3 rounded-lg font-medium transition-colors shadow-md"
            >
              Proceed to E-Sign
            </button>
          </>
        );
      default:
        return <div className="text-text-muted text-center py-20">Step content coming soon...</div>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg-dark">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-sidebar border-r border-border-muted flex flex-col shrink-0">
        <div className="p-6">
          <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-6">Onboarding Steps</h2>
          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-120px)] pr-2">
            {ONBOARDING_STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all group ${
                  currentStepId === step.id 
                    ? 'bg-white text-slate-900 border border-border-muted shadow-sm' 
                    : 'text-text-muted hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border ${
                  completedStepIds.includes(step.id)
                    ? 'bg-accent-green border-accent-green text-white'
                    : currentStepId === step.id 
                      ? 'border-accent-blue text-accent-blue' 
                      : 'border-border-muted group-hover:border-text-muted'
                }`}>
                  {completedStepIds.includes(step.id) ? <CheckCircle2 className="w-3 h-3" /> : step.number}
                </span>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-medium truncate max-w-[140px]">{step.title}</span>
                  {step.optional && <span className="text-[9px] text-accent-blue">Optional</span>}
                </div>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-bg-dark">
        {/* Header */}
        <header className="h-16 border-b border-border-muted flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-accent-blue p-1.5 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Sequence</h1>
              <span className="bg-slate-200 text-text-muted text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Onboarding</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button 
              onClick={() => setIsCopilotOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue px-4 py-1.5 rounded-lg text-xs font-bold border border-accent-blue/30 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 fill-accent-blue" />
              Try Copilot
            </motion.button>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-border-muted">
            <button 
              onClick={() => setMode('test')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                mode === 'test' ? 'bg-white text-accent-blue shadow-sm' : 'text-text-muted hover:text-slate-900'
              }`}
            >
              Test Mode
            </button>
            <button 
              onClick={() => setMode('prod')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                mode === 'prod' ? 'bg-white text-slate-900 shadow-sm' : 'text-text-muted hover:text-slate-900'
              }`}
            >
              Prod Mode
            </button>
          </div>
        </div>
      </header>

        {/* Form Area */}
        <div className="flex-1 overflow-y-auto p-12">
          <div className="max-w-2xl mx-auto">
            {/* Progress Overview */}
            <div className="mb-12 bg-white border border-border-muted rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Onboarding Progress</h3>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium mt-1">
                    {completedStepIds.length} of {ONBOARDING_STEPS.length} steps completed
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-accent-blue">
                    {Math.round((completedStepIds.length / ONBOARDING_STEPS.length) * 100)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedStepIds.length / ONBOARDING_STEPS.length) * 100}%` }}
                  className="bg-accent-blue h-full rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                />
              </div>
              
              {!isCopilotOpen && completedStepIds.length < ONBOARDING_STEPS.length && (
                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent-blue/10 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-accent-blue fill-accent-blue" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Let us do this for you?</p>
                      <p className="text-[10px] text-text-muted">Let our AI Copilot handle the heavy lifting for you.</p>
                    </div>
                  </div>
                  <motion.button 
                    onClick={() => setIsCopilotOpen(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    animate={{ 
                      boxShadow: [
                        "0 4px 6px -1px rgba(37,99,235, 0.1), 0 2px 4px -1px rgba(37,99,235, 0.06)",
                        "0 10px 15px -3px rgba(37,99,235, 0.3), 0 4px 6px -2px rgba(37,99,235, 0.05)",
                        "0 4px 6px -1px rgba(37,99,235, 0.1), 0 2px 4px -1px rgba(37,99,235, 0.06)"
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="bg-accent-blue hover:bg-accent-blue-hover text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    Try Copilot
                  </motion.button>
                </div>
              )}
            </div>

            <div className="mb-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Step {currentStep.number}</span>
                {currentStep.method && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    currentStep.method === 'POST' ? 'bg-accent-blue/20 text-accent-blue' : 
                    currentStep.method === 'PUT' ? 'bg-[#f2cc60]/20 text-[#f2cc60]' : 
                    'bg-green-500/20 text-green-500'
                  }`}>
                    {currentStep.method}
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-bold mb-2 text-slate-900">{currentStep.title}</h2>
              {currentStep.endpoint && (
                <p className="text-sm font-mono text-text-muted">{currentStep.endpoint}</p>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-bg-card border border-border-muted rounded-2xl p-8 shadow-2xl"
              >
                {renderForm()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <KYCCopilot 
        isOpen={isCopilotOpen} 
        onClose={handleCloseCopilot}
        currentStepId={currentStepId}
        onStepChange={handleStepClick}
        merchantData={merchantData}
        panData={panData}
        ckycData={ckycData}
        businessData={businessData}
        signatoryData={signatoryData}
        addressData={addressData}
        uboData={uboData}
        businessMemberData={businessMemberData}
        onExtractPan={handleExtractPan}
        onSendOtp={handleSendOtp}
        onVerifyOtp={handleVerifyOtp}
        onExtractSignatory={handleExtractSignatory}
        onGenerateDigiLocker={handleGenerateDigiLockerLink}
        onConfirmUbo={handleConfirmUbo}
        onConfirmMembers={handleConfirmMembers}
        onStepComplete={(stepId) => setCompletedStepIds(prev => [...new Set([...prev, stepId])])}
      />

      {/* Floating Badge */}
      <div className="fixed bottom-4 left-4 bg-white border border-border-muted rounded-lg px-3 py-1.5 flex items-center gap-2 text-[10px] font-medium text-text-muted shadow-lg">
        <span>Edit with</span>
        <div className="flex items-center gap-1 text-slate-900">
          <div className="w-3 h-3 bg-orange-500 rounded-full" />
          <span>Lovable</span>
        </div>
        <X className="w-3 h-3 ml-2 cursor-pointer" />
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.type === 'copilot' ? 'Close Copilot?' : 
          confirmModal.type === 'next' ? 'Proceed to Next Step?' : 
          'Change Step?'
        }
        message={
          confirmModal.type === 'copilot' ? 'Are you sure you want to close the Copilot? Your current progress in the chat will be saved, but the automation will pause.' : 
          confirmModal.type === 'next' ? 'Are you sure you want to complete this step and move to the next one?' : 
          'Are you sure you want to leave this step? Any unsaved changes might be lost.'
        }
        onConfirm={
          confirmModal.type === 'copilot' ? confirmCloseCopilot : 
          confirmModal.type === 'next' ? confirmNext : 
          confirmNavigation
        }
        onCancel={() => setConfirmModal({ isOpen: false, type: 'navigation' })}
      />
    </div>
  );
}
