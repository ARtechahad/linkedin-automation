import React, { useState } from 'react';
import { 
  Star, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Award
} from 'lucide-react';
import { ReviewCampaign, ReviewTargetPlatform } from '../../types';
import { INITIAL_REVIEWS } from '../../data/salesBdData';

interface ReviewHarvesterProps {
  onShowToast: (msg: string) => void;
}

export const ReviewHarvester: React.FC<ReviewHarvesterProps> = ({ onShowToast }) => {
  const [reviews, setReviews] = useState<ReviewCampaign[]>(INITIAL_REVIEWS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // New review request state
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [platform, setPlatform] = useState<ReviewTargetPlatform>('clutch');
  const [feedbackSnippet, setFeedbackSnippet] = useState(
    'Delivered on staging with zero QA bugs. The 50/50 payment milestone and transparent weekly demo audits gave us complete peace of mind.'
  );

  const copyOutreachEmail = (rev: ReviewCampaign) => {
    const email = `Subject: Milestone Completion & Feedback for ${rev.clientCompany}

Hi ${rev.clientName},

It has been an absolute pleasure delivering this development sprint for ${rev.clientCompany}! Now that the staging environment has passed QA and your live domain migration is complete, could you take 60 seconds to share your experience on our verified profile?

To make it as effortless as possible, here is a quick review link:
👉 ${rev.reviewLink}

Feel free to write anything you'd like, or use this quick reference:
"${rev.preDraftedFeedback}"

Thank you for trusting our engineering team!

Best regards,
Agency Engineering Operations`;

    navigator.clipboard.writeText(email);
    setCopiedId(rev.id);
    setTimeout(() => setCopiedId(null), 2000);
    onShowToast('Review request email template copied to clipboard!');
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) {
      onShowToast('Please specify Client Name and Email.');
      return;
    }

    const newRev: ReviewCampaign = {
      id: `rev-${Date.now()}`,
      clientName,
      clientCompany: clientCompany || clientName,
      clientEmail,
      platform,
      status: 'ready_to_send',
      reviewLink: platform === 'clutch' 
        ? 'https://clutch.co/review/submit?agency=agencyops' 
        : 'https://g.page/r/your-agency-review',
      targetRating: 5,
      preDraftedFeedback: feedbackSnippet
    };

    setReviews([newRev, ...reviews]);
    setIsAdding(false);
    setClientName('');
    setClientCompany('');
    setClientEmail('');
    onShowToast('New 5-star review outreach ready to send.');
  };

  const handleUpdateStatus = (id: string, status: ReviewCampaign['status']) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    onShowToast(`Review campaign status updated to ${status}.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Automated Clutch &amp; Google Review Harvester</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trigger automated review prompts following live domain transfer (SOP Rule 11: Feedback &amp; Retention).
            </p>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'Cancel' : 'Request New Review'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold block mb-0.5">
              Verified 5★ Ratings
            </span>
            <span className="text-xl font-extrabold font-mono text-amber-700 dark:text-amber-300">
              4.9 / 5.0
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Clutch &amp; Google rank</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
              Pending Outreach
            </span>
            <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
              {reviews.filter(r => r.status === 'ready_to_send').length}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Ready to email</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block mb-0.5">
              Published Reviews
            </span>
            <span className="text-xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
              {reviews.filter(r => r.status === 'reviewed').length}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Active testimonials</span>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40">
            <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold block mb-0.5">
              Conversion Boost
            </span>
            <span className="text-xl font-extrabold font-mono text-indigo-700 dark:text-indigo-300">
              +42%
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">Inbound deal win rate</span>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleCreateRequest} className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 shadow-xs space-y-3 text-xs">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
            Draft Post-Launch Review Request
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client Name
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="e.g. Julian Vance"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company
              </label>
              <input
                type="text"
                value={clientCompany}
                onChange={e => setClientCompany(e.target.value)}
                placeholder="e.g. Vance Capital"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client Email
              </label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                placeholder="e.g. julian@vancecap.com"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Review Platform
              </label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="clutch">Clutch.co Leader Review</option>
                <option value="google_review">Google Business Review</option>
                <option value="trustpilot">Trustpilot</option>
                <option value="linkedin_recommendation">LinkedIn Recommendation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pre-Drafted 5-Star Recommendation (Easy for client to approve)
            </label>
            <textarea
              rows={2}
              value={feedbackSnippet}
              onChange={e => setFeedbackSnippet(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Save Campaign
            </button>
          </div>
        </form>
      )}

      {/* Reviews Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map(rev => (
          <div
            key={rev.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  {rev.platform === 'clutch' ? 'Clutch.co Review' : 'Google Business'}
                </span>
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {rev.clientCompany} ({rev.clientName})
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {rev.clientEmail}
                </p>
              </div>

              {rev.receivedReviewSnippet ? (
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">
                    ★ Published Client Review:
                  </span>
                  <p className="italic">&ldquo;{rev.receivedReviewSnippet}&rdquo;</p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Pre-Drafted Template for Client:
                  </span>
                  <p className="italic">&ldquo;{rev.preDraftedFeedback}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs">
              <select
                value={rev.status}
                onChange={e => handleUpdateStatus(rev.id, e.target.value as any)}
                className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="ready_to_send">Ready to Send</option>
                <option value="sent">Sent to Client</option>
                <option value="reviewed">5-Star Received</option>
                <option value="followup_needed">Follow-up Needed</option>
              </select>

              <div className="flex items-center gap-2">
                <a
                  href={rev.reviewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Review URL</span>
                </a>
                <button
                  onClick={() => copyOutreachEmail(rev)}
                  className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedId === rev.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === rev.id ? 'Copied' : 'Copy Email'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
