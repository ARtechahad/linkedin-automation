import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Download, 
  Copy, 
  Check, 
  X, 
  PenTool, 
  Building2, 
  DollarSign, 
  Calendar, 
  Sparkles,
  Printer,
  FileCheck2,
  Lock
} from 'lucide-react';
import { GeneratedContract, ContractType, ProjectLead } from '../../types';

interface ContractGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveContract: (contract: GeneratedContract) => void;
  initialLead?: ProjectLead | null;
}

export const ContractGeneratorModal: React.FC<ContractGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSaveContract,
  initialLead
}) => {
  const [contractType, setContractType] = useState<ContractType>('sow');
  const [clientName, setClientName] = useState(initialLead?.clientName || 'Julian Vance');
  const [clientCompany, setClientCompany] = useState(initialLead?.clientCompany || 'Vance Capital Partners LLC');
  const [clientEmail, setClientEmail] = useState(initialLead?.clientEmail || 'julian@vancecap.com');
  const [totalAmount, setTotalAmount] = useState<number>(initialLead?.finalPrice || 14500);
  const [timelineWeeks, setTimelineWeeks] = useState<number>(6);
  const [projectScope, setProjectScope] = useState<string>(
    initialLead?.purpose || 'Custom high-performance web application development, including UI/UX design system, secure backend API architecture, and cloud deployment.'
  );
  const [deliverablesText, setDeliverablesText] = useState<string>(
    '1. High-fidelity Figma wireframes and interactive prototype\n2. Next.js / React frontend with responsive mobile styling\n3. Secure Node.js / Express backend with strict API key protection\n4. Isolated staging deployment on internal agency domain for client QA review\n5. Final domain migration, DNS propagation, and SSL hardening upon verified 50% balance settlement'
  );
  const [ipTerms, setIpTerms] = useState<string>(
    '100% intellectual property rights, full Git repository commit history, and production assets transfer irrevocably to Client upon final 50% milestone clearance.'
  );
  const [warrantyDays, setWarrantyDays] = useState<number>(90);

  // E-Signature state
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('type');
  const [typedSignature, setTypedSignature] = useState(initialLead?.clientName || 'Julian Vance');
  const [signedByRole, setSignedByRole] = useState('Authorized Client Signatory');
  const [isSigned, setIsSigned] = useState(false);
  const [copied, setCopied] = useState(false);

  // Canvas for drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (initialLead) {
      setClientName(initialLead.clientName);
      setClientCompany(initialLead.clientCompany || '');
      setClientEmail(initialLead.clientEmail);
      setTotalAmount(initialLead.finalPrice || 14500);
      setTypedSignature(initialLead.clientName);
      if (initialLead.purpose) {
        setProjectScope(initialLead.purpose);
      }
    }
  }, [initialLead]);

  if (!isOpen) return null;

  const advanceAmount = Number((totalAmount * 0.5).toFixed(2));
  const balanceAmount = Number((totalAmount * 0.5).toFixed(2));

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#4f46e5';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleGenerateAndSave = () => {
    let signatureData = '';
    if (signatureMode === 'draw' && canvasRef.current) {
      signatureData = canvasRef.current.toDataURL();
    } else {
      signatureData = typedSignature;
    }

    const deliverablesArray = deliverablesText
      .split('\n')
      .map(d => d.replace(/^[0-9]+[.)\s]*/, '').trim())
      .filter(d => d.length > 0);

    const newContract: GeneratedContract = {
      id: `cnt-${Date.now()}`,
      type: contractType,
      title: contractType === 'sow' 
        ? `Statement of Work: ${clientCompany || clientName}`
        : contractType === 'nda'
        ? `Mutual Non-Disclosure Agreement: ${clientCompany || clientName}`
        : `Master Services Agreement: ${clientCompany || clientName}`,
      clientName,
      clientCompany,
      clientEmail,
      projectScope,
      deliverables: deliverablesArray,
      timelineWeeks,
      totalAmount,
      advanceDepositPercent: 50,
      balanceDepositPercent: 50,
      ipOwnershipTerms: ipTerms,
      warrantyDays,
      status: isSigned ? 'signed' : 'draft',
      signedByClientName: isSigned ? (signatureMode === 'type' ? typedSignature : clientName) : undefined,
      signedAt: isSigned ? new Date().toISOString() : undefined,
      clientSignatureDataUrl: isSigned ? signatureData : undefined,
      agencySignatory: 'CEO & Principal Software Architect',
      createdAt: new Date().toISOString(),
      linkedProjectId: initialLead?.id
    };

    onSaveContract(newContract);
    onClose();
  };

  const generateFullLegalText = () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `================================================================================
AGREEMENT TYPE: ${contractType.toUpperCase()} - INTERNATIONAL SERVICES CONTRACT
DATE: ${today}
CLIENT: ${clientName} (${clientCompany}) | Email: ${clientEmail}
DEVELOPMENT AGENCY: International Engineering & Operations House
================================================================================

1. PROJECT SCOPE & OBJECTIVE
${projectScope}

2. CORE DELIVERABLES
${deliverablesText}

3. TIMELINE & SPRINT SCHEDULE
Estimated Development Duration: ${timelineWeeks} weeks from advance deposit receipt.

4. COMMERCIAL TERMS & STRICT SOP PAYMENT MILESTONES
- Total Contract Fee: $${totalAmount.toLocaleString()} USD
- Milestone 1 (50% Advance Deposit): $${advanceAmount.toLocaleString()} USD (Required to authorize sprint kickoff)
- Milestone 2 (50% Final Balance): $${balanceAmount.toLocaleString()} USD (Due strictly upon client review & approval on staging)
- SOP RULE 8 ENFORCEMENT: Live domain DNS transfer and production server credentials handover will remain locked until the remaining 50% balance payment is verified and cleared.

5. INTELLECTUAL PROPERTY & CODE ASSIGNMENT
${ipTerms}

6. WARRANTY & POST-LAUNCH SUPPORT
Agency provides a ${warrantyDays}-day warranty period commencing upon live domain transfer to rectify any functional bugs in agreed deliverables at zero additional cost.

================================================================================
SIGNATURE & ACCEPTANCE
Status: ${isSigned ? 'EXECUTED & LEGALLY BINDING' : 'PENDING CLIENT SIGNATURE'}
Client Signatory: ${isSigned ? (signatureMode === 'type' ? typedSignature : clientName) : '[Awaiting Signature]'}
Title / Role: ${signedByRole}
Date: ${isSigned ? today : '[Pending]'}
Agency Signatory: CEO & Principal Software Architect
================================================================================`;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateFullLegalText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${contractType.toUpperCase()} - ${clientCompany}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            h1 { font-size: 24px; color: #0f172a; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
            h2 { font-size: 16px; color: #4338ca; margin-top: 24px; }
            pre { background: #f8fafc; padding: 16px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; font-size: 13px; }
            .badge { display: inline-block; padding: 4px 12px; background: #e0e7ff; color: #3730a3; border-radius: 9999px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="badge">AgencyOps Legal Document</div>
          <h1>${contractType.toUpperCase()}: ${clientCompany}</h1>
          <pre>${generateFullLegalText()}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Instant Contract & SOW Generator</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-300 dark:border-emerald-800">
                  E-Signature Ready
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate international Statements of Work (SOW) & NDAs with strict 50/50 milestone locks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Agreement Type Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              1. Document Agreement Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'sow', title: 'Statement of Work (SOW)', desc: 'Milestone scope, deliverables & 50/50 transfer gate' },
                { id: 'nda', title: 'Mutual NDA', desc: 'Strict two-way non-disclosure & confidential IP protection' },
                { id: 'msa', title: 'Master Services (MSA)', desc: 'Umbrella commercial agreement for ongoing retainers' }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setContractType(item.id as ContractType)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    contractType === item.id
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Client & Commercial Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client Signatory Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => {
                  setClientName(e.target.value);
                  setTypedSignature(e.target.value);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Julian Vance"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company / Organization
              </label>
              <input
                type="text"
                value={clientCompany}
                onChange={e => setClientCompany(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Vance Capital Partners LLC"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client Email Address
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. client@company.com"
              />
            </div>
          </div>

          {/* Pricing & Milestone Structure */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>Commercial Valuation &amp; Milestone Lock</span>
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                SOP Rule 5 &amp; 8 Enforced
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Total Project Price (USD)
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={e => setTotalAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-bold font-mono rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  50% Advance (Deposit)
                </label>
                <div className="px-3 py-1.5 text-xs font-bold font-mono rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300">
                  ${advanceAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  50% Balance (Transfer Lock)
                </label>
                <div className="px-3 py-1.5 text-xs font-bold font-mono rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300">
                  ${balanceAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Timeline (Weeks)
                </label>
                <input
                  type="number"
                  value={timelineWeeks}
                  onChange={e => setTimelineWeeks(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-bold font-mono rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Scope & Deliverables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Project Scope &amp; Architecture Description
              </label>
              <textarea
                rows={4}
                value={projectScope}
                onChange={e => setProjectScope(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deliverables Breakdown (One per line)
              </label>
              <textarea
                rows={4}
                value={deliverablesText}
                onChange={e => setDeliverablesText(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* IP Ownership & Warranty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Intellectual Property (IP) Assignment Clause
              </label>
              <input
                type="text"
                value={ipTerms}
                onChange={e => setIpTerms(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Post-Launch Bug Warranty (Days)
              </label>
              <input
                type="number"
                value={warrantyDays}
                onChange={e => setWarrantyDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Interactive E-Signature Pad */}
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Client E-Signature &amp; Legal Execution
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSignatureMode('type')}
                  className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer ${
                    signatureMode === 'type'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  Type Signature
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMode('draw')}
                  className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer ${
                    signatureMode === 'draw'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  Draw Signature
                </button>
              </div>
            </div>

            {signatureMode === 'type' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Signatory Full Name
                  </label>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={e => setTypedSignature(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-700 text-center">
                  <span className="text-[10px] uppercase text-slate-400 block mb-1">Digital Preview</span>
                  <span className="text-2xl font-serif italic text-indigo-700 dark:text-indigo-300 font-bold tracking-wide">
                    {typedSignature || 'Signature Preview'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden flex flex-col items-center">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={100}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="cursor-crosshair w-full max-w-[500px] h-[100px] touch-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-xs text-slate-500 hover:text-rose-500 font-semibold cursor-pointer"
                  >
                    Clear Drawing
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={isSigned}
                  onChange={e => setIsSigned(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span>Attach authorized digital sign-off and lock contract terms</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Signatory Role: {signedByRole}
              </span>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Legal Text'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF Export</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerateAndSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{isSigned ? 'Save & Execute Agreement' : 'Save as Draft SOW'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
