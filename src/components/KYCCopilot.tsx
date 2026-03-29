import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Send, 
  X, 
  Terminal, 
  CheckCircle2, 
  User, 
  Zap, 
  FileText, 
  Eye, 
  ChevronRight,
  Info,
  ShieldCheck
} from 'lucide-react';

interface KYCCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  currentStepId: string;
  onStepChange: (stepId: string) => void;
  merchantData: any;
  panData: any;
  ckycData: any;
  businessData: any;
  signatoryData: any;
  addressData: any;
  uboData: any;
  businessMemberData: any;
  onExtractPan: () => void;
  onSendOtp: () => void;
  onVerifyOtp: (otp: string) => void;
  onExtractSignatory: () => void;
  onGenerateDigiLocker: () => void;
  onConfirmUbo: () => void;
  onConfirmMembers: () => void;
  onStepComplete: (stepId: string) => void;
}

interface Message {
  id: string;
  type: 'bot' | 'user' | 'api' | 'success' | 'action';
  content: string;
  apiDetails?: {
    name: string;
    status: string;
    response?: any;
  };
  actionData?: {
    label: string;
    onClick: () => void;
  };
  sampleDoc?: string;
  options?: string[];
}

export const KYCCopilot: React.FC<KYCCopilotProps> = ({
  isOpen,
  onClose,
  currentStepId,
  onStepChange,
  merchantData,
  panData,
  ckycData,
  businessData,
  signatoryData,
  addressData,
  uboData,
  businessMemberData,
  onExtractPan,
  onSendOtp,
  onVerifyOtp,
  onExtractSignatory,
  onGenerateDigiLocker,
  onConfirmUbo,
  onConfirmMembers,
  onStepComplete
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isCopilotActive, setIsCopilotActive] = useState(false);
  const [entityType, setEntityType] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [showSample, setShowSample] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0 && !isCopilotActive) {
      startCopilot();
    }
  }, [isOpen, messages.length, isCopilotActive]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const addMessage = async (msg: Omit<Message, 'id'>, skipTyping = false) => {
    if (!skipTyping && msg.type === 'bot') {
      setIsTyping(true);
      // Increased typing delay for better readability
      await delay(1500 + Math.random() * 1500);
      setIsTyping(false);
    }
    setMessages(prev => [...prev, { ...msg, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const startCopilot = async () => {
    setIsCopilotActive(true);
    setMessages([]);
    
    await addMessage({
      type: 'bot',
      content: "👋 Hi there! I'm your **KYC Copilot**. I'll guide you through the onboarding process and handle the data entry for you."
    });

    if (merchantData.entityType) {
      await addMessage({
        type: 'bot',
        content: `I see you've already selected **${merchantData.entityType}** as your business type. Let's proceed with that.`
      });
      handleEntityTypeProvided(merchantData.entityType);
    } else {
      await addMessage({
        type: 'bot',
        content: "To get started, please select your **Business Entity Type**:",
        options: ['Proprietorship', 'Private Limited', 'Partnership', 'Public Limited', 'Trust/NGO']
      });
      setCurrentTask('ask_entity_type');
    }
  };

  const handleOptionClick = (option: string) => {
    addMessage({ type: 'user', content: option }, true);
    if (currentTask === 'ask_entity_type') {
      handleEntityTypeProvided(option);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    addMessage({ type: 'user', content: userMsg }, true);
    setInputValue('');

    if (currentTask === 'ask_entity_type') {
      handleEntityTypeProvided(userMsg);
    } else if (currentTask === 'ask_ckyc_consent') {
      if (userMsg.toLowerCase().includes('yes') || userMsg.toLowerCase().includes('agree') || userMsg.toLowerCase().includes('ok')) {
        handleCkycConsentGiven();
      } else {
        addMessage({ type: 'bot', content: "I need your consent to continue. You can also click the **'I Agree'** button above." });
      }
    } else if (currentTask === 'ask_otp') {
      if (userMsg.length === 6 && /^\d+$/.test(userMsg)) {
        handleOtpProvided(userMsg);
      } else {
        addMessage({ type: 'bot', content: "Please provide a valid 6-digit OTP." });
      }
    }
  };

  const handleEntityTypeProvided = async (type: string) => {
    setEntityType(type);
    await addMessage({
      type: 'bot',
      content: `Got it! **${type}**. Let me check your current status...`
    });

    await delay(800);
    await addMessage({
      type: 'success',
      content: 'System Status: Ready for onboarding'
    });

    await delay(2000);
    onStepComplete('auth');
    proceedToPan();
  };

  const proceedToPan = async () => {
    onStepChange('merchant-pan-ckyc');
    await addMessage({
      type: 'bot',
      content: "First, we need to extract your **PAN details**. Please upload a clear photo of your PAN card."
    });
    
    await addMessage({
      type: 'bot',
      content: "Not sure about the format? View a sample below:",
      sampleDoc: 'pan'
    });

    await delay(2000);
    await addMessage({ type: 'bot', content: "I'll start the extraction now..." });
    
    await delay(1000);
    onExtractPan();
    await addMessage({ type: 'success', content: 'PAN Details Extracted Successfully' });

    await delay(2500);
    onStepComplete('merchant-pan-ckyc');
    proceedToCkyc();
  };

  const proceedToCkyc = async () => {
    await addMessage({
      type: 'bot',
      content: "Next is **CKYC Verification**. This will pre-fill your address details automatically."
    });
    
    await addMessage({
      type: 'action',
      content: "Do you consent to fetch your CKYC details?",
      actionData: {
        label: "I Agree & Continue",
        onClick: handleCkycConsentGiven
      }
    });

    setCurrentTask('ask_ckyc_consent');
  };

  const handleCkycConsentGiven = async () => {
    await addMessage({ type: 'user', content: "I agree to CKYC verification" }, true);
    await addMessage({ type: 'bot', content: "Great! Sending OTP to your registered mobile number..." });
    onSendOtp();
    
    await delay(800);
    await addMessage({ type: 'success', content: 'OTP Sent to +91 ******3210' });

    await delay(2000);
    await addMessage({ type: 'bot', content: "Please enter the **6-digit OTP** you received." });
    setCurrentTask('ask_otp');
  };

  const handleOtpProvided = async (otp: string) => {
    await addMessage({ type: 'bot', content: `Verifying OTP: ${otp}...` });
    onVerifyOtp(otp);

    await delay(800);
    await addMessage({ type: 'success', content: 'CKYC Verified & Address Pre-filled' });

    await delay(2500);
    onStepComplete('merchant-pan-ckyc');
    proceedToBusinessDetails();
  };

  const proceedToBusinessDetails = async () => {
    onStepChange('business-details');
    await addMessage({ type: 'bot', content: "Now checking your **Business Details** (Website & Bank Proof)..." });
    
    await delay(800);
    await addMessage({ type: 'success', content: 'Website Ownership Verified' });

    await delay(2000);
    await addMessage({
      type: 'bot',
      content: "Please upload your **Bank Proof** (Cancelled Cheque or Statement).",
      sampleDoc: 'cheque'
    });

    await delay(1000);
    await addMessage({ type: 'success', content: 'Bank Account Match: 98%' });

    await delay(2500);
    onStepComplete('business-details');
    await addMessage({ type: 'bot', content: "All set! Moving to **Signatory Details**." });
    proceedToSignatory();
  };

  const proceedToSignatory = async () => {
    onStepChange('signatory-details');
    await addMessage({ type: 'bot', content: "I'll extract signatory details from the documents you upload." });
    await addMessage({
      type: 'bot',
      content: "View sample Aadhaar format:",
      sampleDoc: 'aadhaar'
    });

    await delay(2000);
    await addMessage({ type: 'bot', content: "Extracting signatory data..." });
    onExtractSignatory();
    await addMessage({ type: 'success', content: 'Signatory Details Extracted' });

    await delay(1500);
    onStepComplete('signatory-details');

    // Logic for next steps based on entity type
    const needsUbo = entityType !== 'Proprietorship';
    const needsBusinessMembers = entityType !== 'Proprietorship';

    if (needsUbo) {
      proceedToUbo();
    } else {
      proceedToAddress();
    }
  };

  const proceedToUbo = async () => {
    onStepChange('ubo-details');
    await addMessage({ 
      type: 'bot', 
      content: "I've detected that **UBO details** are required for your entity type." 
    });

    await delay(1000);
    await addMessage({ 
      type: 'bot', 
      content: "I'm pulling data from your previously uploaded documents to prepare a draft..." 
    });

    await delay(2000);
    await addMessage({ 
      type: 'bot', 
      content: "✨ **We’ve prepared your UBO details.** I've pre-filled the name, PAN, and email based on the signatory documents. Review and confirm if everything looks correct.",
      actionData: {
        label: "Confirm UBO Details",
        onClick: handleUboConfirmed
      }
    });
  };

  const handleUboConfirmed = async () => {
    onConfirmUbo();
    await addMessage({ type: 'user', content: "UBO details confirmed" }, true);
    await addMessage({ type: 'success', content: 'UBO Details Verified' });
    
    await delay(1500);
    onStepComplete('ubo-details');
    proceedToBusinessMembers();
  };

  const proceedToBusinessMembers = async () => {
    onStepChange('business-members');
    await addMessage({ 
      type: 'bot', 
      content: "Now for **Business Members** (Directors/Partners). I'm checking the requirements for your entity type..." 
    });

    await delay(1200);
    await addMessage({ 
      type: 'bot', 
      content: "I'm extracting member details from your uploaded documents and cross-referencing with the signatory data..." 
    });

    await delay(2000);
    
    const memberName = signatoryData.name || 'Jane Smith';
    
    await addMessage({ 
      type: 'bot', 
      content: `✨ **Draft Ready!** I've prepared the entry for **${memberName}** as a Business Member. Please review the details on the left and confirm.`,
      actionData: {
        label: "Confirm & Continue",
        onClick: handleMembersConfirmed
      }
    });
  };

  const handleMembersConfirmed = async () => {
    onConfirmMembers();
    await addMessage({ type: 'user', content: "Business members confirmed" }, true);
    await addMessage({ type: 'success', content: 'Business Members Verified' });
    
    await delay(1500);
    onStepComplete('business-members');
    proceedToAddress();
  };

  const proceedToAddress = async () => {
    onStepChange('address-details');
    await addMessage({ 
      type: 'bot', 
      content: "Finally, let's verify your **Business Address**. I've pre-filled this from your CKYC data." 
    });

    await delay(1500);
    await addMessage({ 
      type: 'success', 
      content: 'Address Verified via CKYC' 
    });

    await delay(2000);
    onStepComplete('address-details');
    await addMessage({ 
      type: 'bot', 
      content: "🎉 **Congratulations!** Your onboarding is now complete. I've submitted all your details for final review." 
    });
    
    await addMessage({
      type: 'success',
      content: 'Onboarding Submitted Successfully'
    });
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      className="fixed top-0 right-0 w-[400px] h-full bg-white border-l border-border-muted shadow-2xl z-50 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-border-muted flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-blue rounded-xl flex items-center justify-center shadow-lg shadow-accent-blue/20 relative">
            <Bot className="w-6 h-6 text-white" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1"
            >
              <Zap className="w-3 h-3 text-white fill-white" />
            </motion.div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-none">KYC Copilot</h3>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Always here to help</p>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-200 rounded-lg text-text-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-white"
      >
        {messages.length === 0 && !isTyping ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-border-muted shadow-sm">
              <Zap className="w-10 h-10 text-accent-blue" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Ready to automate?</h4>
            <p className="text-sm text-text-muted mb-8 max-w-[240px] mx-auto">
              I can guide you through the entire KYC process and pre-fill your details automatically.
            </p>
            <button 
              onClick={startCopilot}
              className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-blue/20"
            >
              <Zap className="w-4 h-4" /> Start Copilot
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[90%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.type === 'bot' && (
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-border-muted flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-accent-blue" />
                    </div>
                  )}
                  
                  <div className="space-y-3 flex-1">
                    {msg.type === 'success' ? (
                      <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-green-700">{msg.content}</span>
                      </div>
                    ) : msg.type === 'action' ? (
                      <div className="bg-slate-50 border border-border-muted rounded-2xl p-4 shadow-sm">
                        <p className="text-xs font-medium text-slate-900 mb-3">{msg.content}</p>
                        <button 
                          onClick={msg.actionData?.onClick}
                          className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          {msg.actionData?.label}
                        </button>
                      </div>
                    ) : (
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        msg.type === 'bot' 
                          ? 'bg-slate-50 text-slate-800 border border-border-muted rounded-tl-none' 
                          : 'bg-accent-blue text-white rounded-tr-none'
                      }`}>
                        {msg.content.split('\n').map((line, i) => (
                          <p key={i} className={i > 0 ? 'mt-2' : ''}>
                            {line.split('**').map((part, j) => 
                              j % 2 === 1 ? <strong key={j} className={msg.type === 'bot' ? "text-accent-blue" : "text-white"}>{part}</strong> : part
                            )}
                          </p>
                        ))}
                        
                        {msg.sampleDoc && (
                          <button 
                            onClick={() => setShowSample(msg.sampleDoc!)}
                            className="mt-4 flex items-center gap-2 text-accent-blue font-bold hover:underline"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Sample {msg.sampleDoc.toUpperCase()}
                          </button>
                        )}

                        {msg.options && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {msg.options.map((opt, i) => (
                              <button 
                                key={i}
                                onClick={() => handleOptionClick(opt)}
                                className="bg-white border border-accent-blue/30 text-accent-blue hover:bg-accent-blue hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-border-muted flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-accent-blue" />
                  </div>
                  <div className="bg-slate-50 border border-border-muted rounded-2xl rounded-tl-none p-4 flex gap-1 items-center shadow-sm">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-border-muted bg-slate-50">
        <div className="relative">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your answer..."
            className="w-full bg-white border border-border-muted rounded-xl py-4 pl-5 pr-14 text-sm text-slate-900 focus:outline-none focus:border-accent-blue transition-colors shadow-sm"
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-accent-blue/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-text-muted text-center mt-4 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3 h-3" />
          Secure AI-powered onboarding assistant
        </p>
      </div>

      {/* Sample Document Overlay */}
      <AnimatePresence>
        {showSample && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/90 z-[60] flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-white font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-blue" />
                Sample {showSample.toUpperCase()}
              </h4>
              <button 
                onClick={() => setShowSample(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 bg-white rounded-2xl overflow-hidden relative group">
              <img 
                src={
                  showSample === 'pan' ? 'https://picsum.photos/seed/pan/800/500' :
                  showSample === 'cheque' ? 'https://picsum.photos/seed/cheque/800/500' :
                  'https://picsum.photos/seed/aadhaar/800/500'
                }
                alt="Sample Document"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-bold px-4 py-2 border border-white rounded-lg">Sample Format</span>
              </div>
            </div>
            
            <div className="mt-6 bg-white/10 border border-white/10 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-accent-blue mt-0.5" />
                <p className="text-[11px] text-white/80 leading-relaxed">
                  Ensure the document is clear, well-lit, and all edges are visible. Supported formats: JPG, PNG, PDF (Max 5MB).
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
