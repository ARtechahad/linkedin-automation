import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Globe2, 
  Video, 
  Plus, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  Sparkles,
  MapPin,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { TimezoneMeeting } from '../../types';
import { INITIAL_MEETINGS } from '../../data/salesBdData';

interface TimezoneSchedulerProps {
  onShowToast: (msg: string) => void;
}

interface WorldClockCity {
  city: string;
  country: string;
  timezone: string;
  flag: string;
}

const WORLD_CITIES: WorldClockCity[] = [
  { city: 'New York (EST)', country: 'USA', timezone: 'America/New_York', flag: '🇺🇸' },
  { city: 'San Francisco (PST)', country: 'USA', timezone: 'America/Los_Angeles', flag: '🇺🇸' },
  { city: 'London (GMT)', country: 'UK', timezone: 'Europe/London', flag: '🇬🇧' },
  { city: 'Dubai (GST)', country: 'UAE', timezone: 'Asia/Dubai', flag: '🇦🇪' },
  { city: 'Islamabad / Lahore (PKT)', country: 'Pakistan', timezone: 'Asia/Karachi', flag: '🇵🇰' }
];

export const TimezoneScheduler: React.FC<TimezoneSchedulerProps> = ({ onShowToast }) => {
  const [meetings, setMeetings] = useState<TimezoneMeeting[]>(INITIAL_MEETINGS);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // New Meeting State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [selectedClientTz, setSelectedClientTz] = useState('America/New_York');
  const [meetingDate, setMeetingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [meetingTime, setMeetingTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [agendaType, setAgendaType] = useState<TimezoneMeeting['agendaType']>('discovery');
  const [platform, setPlatform] = useState<TimezoneMeeting['platform']>('google_meet');
  const [agendaNotes, setAgendaNotes] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCityTime = (tz: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(currentTime);
    } catch {
      return 'N/A';
    }
  };

  const handleAddMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) {
      onShowToast('Please fill in Client Name and Email.');
      return;
    }

    const randomRoomId = Math.random().toString(36).substring(2, 9);
    const generatedUrl = platform === 'google_meet'
      ? `https://meet.google.com/${randomRoomId}-call`
      : platform === 'zoom'
      ? `https://zoom.us/j/${Math.floor(1000000000 + Math.random() * 9000000000)}`
      : `https://teams.microsoft.com/l/meetup-join/${randomRoomId}`;

    const newMeeting: TimezoneMeeting = {
      id: `mtg-${Date.now()}`,
      title: agendaType === 'discovery' 
        ? `Discovery & Technical Scoping with ${clientCompany || clientName}`
        : agendaType === 'sow_presentation'
        ? `SOW & Commercial Terms Review: ${clientCompany || clientName}`
        : agendaType === 'milestone_signoff'
        ? `Staging Milestone 8 QA Demo: ${clientCompany || clientName}`
        : `Technical Architecture Deep-Dive: ${clientCompany || clientName}`,
      clientName,
      clientEmail,
      clientCompany,
      clientTimezone: selectedClientTz,
      hostTimezone: 'Asia/Karachi',
      meetingDate,
      meetingTime,
      durationMinutes,
      agendaType,
      platform,
      meetingUrl: generatedUrl,
      agendaNotes: agendaNotes || 'Review project objectives, technical requirements, and sprint delivery schedule.',
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    setMeetings([newMeeting, ...meetings]);
    onShowToast(`Meeting scheduled with ${clientName}! Invite ready.`);
    setClientName('');
    setClientEmail('');
    setClientCompany('');
    setAgendaNotes('');
  };

  const downloadICS = (meeting: TimezoneMeeting) => {
    const startTimeClean = meeting.meetingDate.replace(/-/g, '') + 'T' + meeting.meetingTime.replace(/:/g, '') + '00';
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AgencyOps International//Meeting Scheduler//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${meeting.id}@agencyops.dev
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startTimeClean}
DURATION:PT${meeting.durationMinutes}M
SUMMARY:${meeting.title}
DESCRIPTION:${meeting.agendaNotes}\\n\\nJoin Video Room: ${meeting.meetingUrl}
LOCATION:${meeting.meetingUrl}
STATUS:CONFIRMED
ORGANIZER;CN=Principal Solutions Architect:mailto:operations@agencyops.dev
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;CN=${meeting.clientName}:mailto:${meeting.clientEmail}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${meeting.clientName.replace(/\s+/g, '_')}_invite.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Calendar (.ICS) invite downloaded.');
  };

  const copyMeetingInviteText = (meeting: TimezoneMeeting) => {
    const text = `Hi ${meeting.clientName},

Looking forward to speaking with you! Here are our confirmed call details:

📅 Date: ${meeting.meetingDate}
⏰ Time: ${meeting.meetingTime} (${meeting.clientTimezone} client local time)
⏱ Duration: ${meeting.durationMinutes} minutes
🎯 Agenda: ${meeting.title}
🔗 Video Link: ${meeting.meetingUrl}

Notes:
${meeting.agendaNotes}

Best regards,
Agency Engineering Operations`;

    navigator.clipboard.writeText(text);
    setCopiedId(meeting.id);
    setTimeout(() => setCopiedId(null), 2000);
    onShowToast('Meeting invitation email copied to clipboard.');
  };

  return (
    <div className="space-y-6">
      
      {/* Live World Clocks Telemetry Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {WORLD_CITIES.map(item => (
          <div 
            key={item.city} 
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>{item.flag}</span>
                <span className="truncate">{item.city}</span>
              </span>
            </div>
            <div className="text-base font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
              {formatCityTime(item.timezone)}
            </div>
            <span className="text-[10px] text-slate-400 truncate block mt-0.5">
              {item.timezone}
            </span>
          </div>
        ))}
      </div>

      {/* Main Container: Booking Form + Scheduled Agenda List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Booking Form (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Book Discovery / Scoping Meeting
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Automates time zone conversion &amp; Google Meet / Zoom invitations.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddMeeting} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="e.g. Alistair Ross"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Company / Brand
                </label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={e => setClientCompany(e.target.value)}
                  placeholder="e.g. AuraPay UK"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Client Email Address *
              </label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                placeholder="e.g. alistair@aurapay.co.uk"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Client Time Zone
                </label>
                <select
                  value={selectedClientTz}
                  onChange={e => setSelectedClientTz(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="America/New_York">🇺🇸 New York (EST / EDT)</option>
                  <option value="America/Chicago">🇺🇸 Chicago (CST / CDT)</option>
                  <option value="America/Los_Angeles">🇺🇸 San Francisco (PST / PDT)</option>
                  <option value="Europe/London">🇬🇧 London (GMT / BST)</option>
                  <option value="Europe/Berlin">🇩🇪 Berlin / Paris (CET)</option>
                  <option value="Asia/Dubai">🇦🇪 Dubai (GST, UTC+4)</option>
                  <option value="Australia/Sydney">🇦🇺 Sydney (AEST)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="google_meet">Google Meet</option>
                  <option value="zoom">Zoom Video</option>
                  <option value="teams">Microsoft Teams</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={e => setMeetingDate(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Time (24h)
                </label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={e => setMeetingTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value={15}>15m Quick</option>
                  <option value={30}>30m Standard</option>
                  <option value={45}>45m Scoping</option>
                  <option value={60}>60m Deep</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Meeting Objective / Agenda
              </label>
              <select
                value={agendaType}
                onChange={e => setAgendaType(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white mb-2"
              >
                <option value="discovery">Discovery &amp; Business Qualification (SOP Step 1)</option>
                <option value="technical_deepdive">Technical Architecture &amp; Database Scoping (SOP Step 2)</option>
                <option value="sow_presentation">Statement of Work (SOW) &amp; 50/50 Deposit (SOP Step 4-5)</option>
                <option value="milestone_signoff">Staging QA Review &amp; Balance Transfer Gate (SOP Step 8)</option>
              </select>

              <textarea
                rows={2}
                value={agendaNotes}
                onChange={e => setAgendaNotes(e.target.value)}
                placeholder="Specific agenda notes or client pain points to address..."
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Call &amp; Generate Invites</span>
            </button>
          </form>
        </div>

        {/* Scheduled Meetings List (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Upcoming Discovery &amp; Commercial Reviews ({meetings.length})</span>
            </h4>
          </div>

          <div className="space-y-3">
            {meetings.map(mtg => (
              <div
                key={mtg.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs space-y-3 hover:border-indigo-500/40 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {mtg.platform === 'google_meet' ? 'Google Meet' : mtg.platform === 'zoom' ? 'Zoom' : 'Teams'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {mtg.durationMinutes} mins
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Confirmed</span>
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {mtg.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Client: <strong>{mtg.clientName}</strong> ({mtg.clientCompany || 'Direct Client'}) • {mtg.clientEmail}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono block">
                      {mtg.meetingDate}
                    </span>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-bold block">
                      {mtg.meetingTime} ({mtg.clientTimezone.split('/')[1] || mtg.clientTimezone})
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                  {mtg.agendaNotes}
                </p>

                {/* Actions: Video Link, ICS Download, Copy Email */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5 text-xs flex-wrap gap-2">
                  <a
                    href={mtg.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Call Room</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyMeetingInviteText(mtg)}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedId === mtg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === mtg.id ? 'Copied' : 'Copy Email'}</span>
                    </button>
                    <button
                      onClick={() => downloadICS(mtg)}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>.ICS Invite</span>
                    </button>
                    <button
                      onClick={() => setMeetings(meetings.filter(m => m.id !== mtg.id))}
                      className="text-slate-400 hover:text-rose-500 p-1 transition cursor-pointer"
                      title="Cancel meeting"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
