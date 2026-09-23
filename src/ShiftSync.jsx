import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  Globe,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  Share2,
  Check,
  HelpCircle,
  LogOut,
  ArrowRight,
  UserPlus,
  Compass,
  X,
} from 'lucide-react';

const TIMEZONE_OPTIONS = [
  { label: 'UTC (Universal Coordinated)', value: 'UTC', offset: 0 },
  { label: 'IST (India Standard - UTC+5:30)', value: 'IST', offset: 5.5 },
  { label: 'EST / EDT (US Eastern - UTC-5)', value: 'EST', offset: -5 },
  { label: 'PST / PDT (US Pacific - UTC-8)', value: 'PST', offset: -8 },
  { label: 'GMT / BST (London - UTC+0)', value: 'GMT', offset: 0 },
  { label: 'CET (Central European - UTC+1)', value: 'CET', offset: 1 },
  { label: 'SGT (Singapore - UTC+8)', value: 'SGT', offset: 8 },
  { label: 'JST (Japan Standard - UTC+9)', value: 'JST', offset: 9 },
  { label: 'AEST (Australian Eastern - UTC+10)', value: 'AEST', offset: 10 },
];

const PRESETS = {
  devDuo: [
    { id: 'p1', name: 'Aarav (Lead Dev)', timezone: 'IST', workStart: 10, workEnd: 19 },
    { id: 'p2', name: 'Jordan (Frontend US)', timezone: 'EST', workStart: 9, workEnd: 17 },
  ],
  globalSquad: [
    { id: 'p1', name: 'Tanvi (Full Stack)', timezone: 'IST', workStart: 10, workEnd: 19 },
    { id: 'p2', name: 'Elena (UX Designer)', timezone: 'CET', workStart: 9, workEnd: 17 },
    { id: 'p3', name: 'Marcus (Product PM)', timezone: 'PST', workStart: 8, workEnd: 16 },
  ],
};

const HOUR_CHOICES = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00`,
}));

const encodeTeamState = (data) => {
  try {
    return btoa(encodeURIComponent(JSON.stringify(data)));
  } catch (err) {
    return '';
  }
};

const decodeTeamState = (hash) => {
  try {
    const raw = hash.replace(/^#team=/, '');
    if (!raw) return null;
    const parsed = JSON.parse(decodeURIComponent(atob(raw)));
    return Array.isArray(parsed) ? parsed : null;
  } catch (err) {
    return null;
  }
};

const getDetectedTimezone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('India')) return 'IST';
    if (tz.includes('New_York') || tz.includes('Eastern')) return 'EST';
    if (tz.includes('Los_Angeles') || tz.includes('Pacific')) return 'PST';
    if (tz.includes('London') || tz.includes('GMT')) return 'GMT';
    if (tz.includes('Paris') || tz.includes('Berlin')) return 'CET';
    if (tz.includes('Singapore')) return 'SGT';
    if (tz.includes('Tokyo')) return 'JST';
    if (tz.includes('Sydney')) return 'AEST';
  } catch (e) {
    // fallback
  }
  return 'UTC';
};

export default function ShiftSync() {
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    const savedUser = localStorage.getItem('shiftsync_auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authTz, setAuthTz] = useState(getDetectedTimezone());
  const [authStart, setAuthStart] = useState(9);
  const [authEnd, setAuthEnd] = useState(18);

  const [members, setMembers] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#team=')) {
      const fromHash = decodeTeamState(window.location.hash);
      if (fromHash) return fromHash;
    }
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('shiftsync_team');
    return saved ? JSON.parse(saved) : [];
  });

  const [showTour, setShowTour] = useState(() => {
    if (typeof window === 'undefined') return true;
    const completed = localStorage.getItem('shiftsync_tour_completed');
    return completed !== 'true';
  });
  const [tourStep, setTourStep] = useState(1);

  const [anchorTimezone, setAnchorTimezone] = useState(() => currentUser?.timezone || 'UTC');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberTz, setNewMemberTz] = useState('EST');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (currentUser && typeof window !== 'undefined') {
      localStorage.setItem('shiftsync_team', JSON.stringify(members));
    }
  }, [members, currentUser]);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (!authName.trim()) return;

    const newUser = {
      id: 'user_' + Date.now(),
      name: authName.trim(),
      email: authEmail.trim() || 'user@shiftsync.local',
      timezone: authTz,
      workStart: Number(authStart),
      workEnd: Number(authEnd),
      joinedAt: new Date().toISOString(),
    };

    localStorage.setItem('shiftsync_auth_user', JSON.stringify(newUser));
    setCurrentUser(newUser);
    setAnchorTimezone(newUser.timezone);

    if (members.length === 0) {
      const selfMember = {
        id: newUser.id,
        name: `${newUser.name} (You)`,
        timezone: newUser.timezone,
        workStart: newUser.workStart,
        workEnd: newUser.workEnd,
        isSelf: true,
      };
      setMembers([selfMember]);
      localStorage.setItem('shiftsync_team', JSON.stringify([selfMember]));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('shiftsync_auth_user');
    setCurrentUser(null);
    setSelectedSlot(null);
  };

  const completeTour = () => {
    setShowTour(false);
    localStorage.setItem('shiftsync_tour_completed', 'true');
  };

  const restartTour = () => {
    setTourStep(1);
    setShowTour(true);
  };

  const loadDemoPreset = (presetKey) => {
    const presetData = PRESETS[presetKey] || PRESETS.devDuo;
    setMembers(presetData);
    localStorage.setItem('shiftsync_team', JSON.stringify(presetData));
  };

  const anchorOffset = useMemo(() => {
    return TIMEZONE_OPTIONS.find((t) => t.value === anchorTimezone)?.offset || 0;
  }, [anchorTimezone]);

  const getSlotStatus = (member, utcHour) => {
    const tzMeta = TIMEZONE_OPTIONS.find((t) => t.value === member.timezone) || { offset: 0 };
    let localHour = (utcHour + tzMeta.offset) % 24;
    if (localHour < 0) localHour += 24;

    if (localHour >= member.workStart && localHour < member.workEnd) {
      return { status: 'available', localHour, label: 'Available' };
    }

    const isEarlyEdge = localHour >= member.workStart - 2 && localHour < member.workStart && localHour >= 7;
    const isLateEdge = localHour >= member.workEnd && localHour < member.workEnd + 2 && localHour < 22;

    if (isEarlyEdge || isLateEdge) {
      return { status: 'flexible', localHour, label: 'Flexible' };
    }

    return { status: 'off', localHour, label: 'Off' };
  };

  const overlapAnalysis = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map((utcHour) => {
      let availableCount = 0;
      let flexibleCount = 0;

      members.forEach((m) => {
        const { status } = getSlotStatus(m, utcHour);
        if (status === 'available') availableCount++;
        else if (status === 'flexible') flexibleCount++;
      });

      const total = members.length;
      return {
        utcHour,
        availableCount,
        flexibleCount,
        isPerfect: total > 1 && availableCount === total,
        isViable: total > 1 && availableCount + flexibleCount === total,
      };
    });
  }, [members]);

  const sweetSpots = useMemo(() => {
    return overlapAnalysis.filter((h) => h.isPerfect || h.isViable);
  }, [overlapAnalysis]);

  const addMember = (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    setMembers([
      ...members,
      {
        id: 'm_' + Date.now(),
        name: newMemberName.trim(),
        timezone: newMemberTz,
        workStart: 9,
        workEnd: 18,
      },
    ]);
    setNewMemberName('');
  };

  const removeMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (selectedSlot !== null) setSelectedSlot(null);
  };

  const updateWorkHours = (id, field, value) => {
    const numVal = Number(value);
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;

        let newStart = m.workStart;
        let newEnd = m.workEnd;

        if (field === 'start') {
          newStart = numVal;
          if (newStart >= newEnd) newEnd = Math.min(23, newStart + 1);
        } else {
          newEnd = numVal;
          if (newEnd <= newStart) newStart = Math.max(0, newEnd - 1);
        }

        return { ...m, workStart: newStart, workEnd: newEnd };
      }),
    );
  };

  const copyShareableLink = async () => {
    const encoded = encodeTeamState(members);
    const origin = window.location.origin + window.location.pathname;
    const shareableUrl = `${origin}#team=${encoded}`;
    window.history.replaceState(null, '', `#team=${encoded}`);

    try {
      await navigator.clipboard.writeText(shareableUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch (err) {
      console.error(err);
    }
  };

  const getMeetingTimestamps = (utcHour) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start = new Date(
      Date.UTC(
        tomorrow.getUTCFullYear(),
        tomorrow.getUTCMonth(),
        tomorrow.getUTCDate(),
        utcHour,
        0,
        0,
      ),
    );
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return { start, end };
  };

  const formatICSDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const downloadICS = (utcHour) => {
    const { start, end } = getMeetingTimestamps(utcHour);
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ShiftSync//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:shiftsync-${Date.now()}@shiftsync.local`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      'SUMMARY:ShiftSync: Team Overlap & Handoff Sync',
      'DESCRIPTION:Coordinated via ShiftSync Availability Matrix.\nParticipants:\n' +
        members.map((m) => `- ${m.name} (${m.timezone}: ${m.workStart}:00-${m.workEnd}:00)`).join('\n'),
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shiftsync-overlap-${utcHour}00UTC.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openGoogleCalendar = (utcHour) => {
    const { start, end } = getMeetingTimestamps(utcHour);
    const startStr = formatICSDate(start);
    const endStr = formatICSDate(end);
    const title = encodeURIComponent('ShiftSync: Team Overlap & Handoff Sync');
    const details = encodeURIComponent(
      `Coordinated via ShiftSync.\nParticipants:\n` +
        members.map((m) => `• ${m.name} (${m.timezone}: ${m.workStart}:00-${m.workEnd}:00)`).join('\n'),
    );
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`,
      '_blank',
    );
  };

  if (!currentUser) {
    return (
      <div className="app-shell min-h-screen bg-[#F5F1EA] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-2">
              <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
                <path d="M 68 28 C 51 28, 38 41, 38 58 C 38 68, 44 76, 52 81 L 62 73 C 56 69, 52 64, 52 58 C 52 48, 60 41, 68 41 C 76 41, 82 46, 84 53 L 96 46 C 91 35, 80 28, 68 28 Z" fill="#52796F" />
                <path d="M 94 40 L 102 48 L 86 54 Z" fill="#52796F" />
                <path d="M 52 92 C 69 92, 82 79, 82 62 C 82 52, 76 44, 68 39 L 58 47 C 64 51, 68 56, 68 62 C 68 72, 60 79, 52 79 C 44 79, 38 74, 36 67 L 24 74 C 29 85, 40 92, 52 92 Z" fill="#C9A96E" />
                <path d="M 26 80 L 18 72 L 34 66 Z" fill="#C9A96E" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#52796F]">
              Shift<span className="text-[#C9A96E]">Sync</span>
            </h1>
            <p className="text-sm text-[#546E7A]">
              Coordinate distributed team overlaps across timezones without calculation errors.
            </p>
          </div>

          <div className="ceramic-card p-6 sm:p-8 space-y-6">
            <div className="space-y-1 border-b border-[#CAD8D0]/40 pb-4">
              <h2 className="text-lg font-bold text-[#263238] flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#52796F]" /> Set Up Your Profile
              </h2>
              <p className="text-xs text-[#546E7A]">
                Create your workspace profile so your schedules and teammates persist across sessions.
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#263238]">Your Full Name or Handle</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Chen (Lead Dev)"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-[#FCFBF8] border border-[#CAD8D0] rounded-xl px-4 py-2.5 text-xs text-[#263238] placeholder-[#90A4AE] focus:outline-none focus:border-[#52796F] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#263238]">Primary Timezone</label>
                  <select
                    value={authTz}
                    onChange={(e) => setAuthTz(e.target.value)}
                    className="w-full bg-[#FCFBF8] border border-[#CAD8D0] rounded-xl px-3.5 py-2.5 text-xs text-[#263238] focus:outline-none focus:border-[#52796F] font-mono"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#263238]">Optional Email / Tag</label>
                  <input
                    type="email"
                    placeholder="maya@company.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-[#FCFBF8] border border-[#CAD8D0] rounded-xl px-4 py-2.5 text-xs text-[#263238] placeholder-[#90A4AE] focus:outline-none focus:border-[#52796F]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#263238]">Your Usual Working Hours</label>
                <div className="flex items-center gap-2">
                  <select
                    value={authStart}
                    onChange={(e) => setAuthStart(Number(e.target.value))}
                    className="flex-1 bg-[#FCFBF8] border border-[#CAD8D0] rounded-xl px-3 py-2 text-xs font-mono text-[#263238] focus:outline-none focus:border-[#52796F]"
                  >
                    {HOUR_CHOICES.map((h) => (
                      <option key={`auth-start-${h.value}`} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-[#546E7A] font-medium">to</span>
                  <select
                    value={authEnd}
                    onChange={(e) => setAuthEnd(Number(e.target.value))}
                    className="flex-1 bg-[#FCFBF8] border border-[#CAD8D0] rounded-xl px-3 py-2 text-xs font-mono text-[#263238] focus:outline-none focus:border-[#52796F]"
                  >
                    {HOUR_CHOICES.map((h) => (
                      <option key={`auth-end-${h.value}`} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#52796F] hover:bg-[#43645C] text-white font-semibold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm mt-2"
              >
                <span>Enter Fresh Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="relative flex items-center justify-center pt-2">
              <div className="border-t border-[#CAD8D0]/60 w-full" />
              <span className="bg-white px-3 text-[11px] text-[#90A4AE] uppercase font-mono absolute">or</span>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  const demoUser = {
                    id: 'demo_user',
                    name: 'Demo Reviewer',
                    email: 'demo@shiftsync.local',
                    timezone: 'UTC',
                    workStart: 9,
                    workEnd: 18,
                  };
                  localStorage.setItem('shiftsync_auth_user', JSON.stringify(demoUser));
                  localStorage.setItem('shiftsync_team', JSON.stringify(PRESETS.devDuo));
                  setCurrentUser(demoUser);
                  setMembers(PRESETS.devDuo);
                }}
                className="text-xs font-semibold text-[#52796F] hover:text-[#43645C] underline underline-offset-4"
              >
                Explore Live Demo Sandbox (Pre-populated)
              </button>
            </div>
          </div>

          <div className="text-center text-[11px] text-[#78909C]">
            Zero backend tracking • 100% Client-Side execution • LocalStorage protected
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen bg-[#F5F1EA] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="ceramic-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 120 120" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <path d="M 68 28 C 51 28, 38 41, 38 58 C 38 68, 44 76, 52 81 L 62 73 C 56 69, 52 64, 52 58 C 52 48, 60 41, 68 41 C 76 41, 82 46, 84 53 L 96 46 C 91 35, 80 28, 68 28 Z" fill="#52796F" />
                <path d="M 94 40 L 102 48 L 86 54 Z" fill="#52796F" />
                <path d="M 52 92 C 69 92, 82 79, 82 62 C 82 52, 76 44, 68 39 L 58 47 C 64 51, 68 56, 68 62 C 68 72, 60 79, 52 79 C 44 79, 38 74, 36 67 L 24 74 C 29 85, 40 92, 52 92 Z" fill="#C9A96E" />
                <path d="M 26 80 L 18 72 L 34 66 Z" fill="#C9A96E" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-3xl font-bold tracking-tight text-[#52796F]">
                  Shift<span className="text-[#C9A96E]">Sync</span>
                </span>
                <span className="text-[10px] bg-[#CAD8D0]/40 text-[#2D4C44] border border-[#CAD8D0] px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider font-semibold">
                  Workspace
                </span>
              </div>
              <p className="text-xs text-[#546E7A] mt-0.5">
                Signed in as <span className="font-semibold text-[#263238]">{currentUser.name}</span> ({currentUser.timezone})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={restartTour}
              className="text-xs px-3 py-2 rounded-xl border border-[#CAD8D0] bg-white hover:bg-[#F8F6F1] text-[#263238] font-medium transition flex items-center gap-1.5"
              title="Show interactive quick-start guide"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#52796F]" />
              <span>Guide</span>
            </button>

            <button
              onClick={copyShareableLink}
              className={`text-xs px-3.5 py-2 rounded-xl border font-semibold transition flex items-center gap-2 shadow-xs ${
                isCopied
                  ? 'bg-[#52796F] text-white border-[#52796F]'
                  : 'bg-white hover:bg-[#F8F6F1] text-[#263238] border-[#CAD8D0]'
              }`}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5 text-[#52796F]" />}
              <span>{isCopied ? 'Link Copied!' : 'Share Matrix'}</span>
            </button>

            <div className="flex items-center gap-2 bg-white border border-[#CAD8D0] px-3.5 py-2 rounded-xl">
              <Globe className="w-4 h-4 text-[#52796F]" />
              <label htmlFor="anchor-select" className="text-xs text-[#546E7A] font-medium">Anchor:</label>
              <select
                id="anchor-select"
                value={anchorTimezone}
                onChange={(e) => setAnchorTimezone(e.target.value)}
                className="bg-transparent text-xs font-mono font-semibold text-[#263238] focus:outline-none cursor-pointer"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.value} ({tz.offset >= 0 ? `+${tz.offset}` : tz.offset})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs p-2.5 rounded-xl border border-[#CAD8D0] bg-white hover:bg-rose-50 hover:text-rose-700 text-[#546E7A] transition"
              title="Log out of session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {showTour && (
          <section className="bg-white border-2 border-[#52796F]/30 rounded-2xl p-5 sm:p-6 shadow-md relative animate-slot-reveal">
            <button
              onClick={completeTour}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#90A4AE] hover:text-[#263238] hover:bg-[#F8F6F1] transition"
              title="Dismiss guide"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#CAD8D0]/40 pb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#52796F] uppercase bg-[#EDF3F0] px-2.5 py-0.5 rounded-full">
                  Quick Training • Step {tourStep} of 3
                </span>
                <h3 className="text-base font-bold text-[#263238]">
                  {tourStep === 1 && '1. Add Remote Contributors'}
                  {tourStep === 2 && '2. Review the Visual 24-Hour Timeline'}
                  {tourStep === 3 && '3. One-Click Meeting Overlap Sync'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {tourStep > 1 && (
                  <button
                    onClick={() => setTourStep(tourStep - 1)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#CAD8D0] text-[#263238] font-semibold hover:bg-[#F8F6F1]"
                  >
                    Back
                  </button>
                )}
                {tourStep < 3 ? (
                  <button
                    onClick={() => setTourStep(tourStep + 1)}
                    className="text-xs px-4 py-1.5 rounded-lg bg-[#52796F] text-white font-semibold hover:bg-[#43645C] flex items-center gap-1"
                  >
                    Next Step <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={completeTour}
                    className="text-xs px-4 py-1.5 rounded-lg bg-[#52796F] text-white font-semibold hover:bg-[#43645C] flex items-center gap-1"
                  >
                    Got It, Let's Start! <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 text-xs text-[#546E7A] leading-relaxed">
              {tourStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-[#F8F6F1] rounded-xl border border-[#CAD8D0]/50 space-y-1">
                    <span className="font-bold text-[#263238]">Fresh Canvas</span>
                    <p>Your team starts clean with just your own profile. You can add engineers, designers, or contractors using the form below.</p>
                  </div>
                  <div className="p-3 bg-[#F8F6F1] rounded-xl border border-[#CAD8D0]/50 space-y-1">
                    <span className="font-bold text-[#263238]">Automatic Time Offset</span>
                    <p>Pick each contributor's home timezone (e.g. PST, CET, IST). ShiftSync converts all time calculations to universal UTC under the hood.</p>
                  </div>
                  <div className="p-3 bg-[#F8F6F1] rounded-xl border border-[#CAD8D0]/50 space-y-1">
                    <span className="font-bold text-[#263238]">Need a Quick Demo?</span>
                    <p>Click the <strong>Presets</strong> buttons below at any time to instantly populate a sample multi-national squad.</p>
                  </div>
                </div>
              )}

              {tourStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-[#F8F6F1] rounded-xl border border-[#CAD8D0]/50 space-y-1">
                    <span className="font-bold text-[#263238] flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#52796F]" /> Core Hours (Deep Sage)
                    </span>
                    <p>Represents the contributor's normal daily working hours (e.g. 10:00 to 19:00). Highest priority availability.</p>
                  </div>
                  <div className="p-3 bg-[#F8F6F1] rounded-xl border border-[#CAD8D0]/50 space-y-1">
                    <span className="font-bold text-[#263238] flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#C9A96E]" /> Flexible Edge (Champagne)
                    </span>
                    <p>Early mornings (after 7 AM) or evenings (before 10 PM) where members can accommodate emergency syncs or handoffs.</p>
                  </div>
                  <div className="p-3 bg-[#F8F6F1] rounded-xl border border-[#CAD8D0]/50 space-y-1">
                    <span className="font-bold text-[#263238] flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#EFECE4]" /> Off-Hours / Sleep
                    </span>
                    <p>Time reserved for rest. ShiftSync ensures you never accidentally schedule someone during deep sleep.</p>
                  </div>
                </div>
              )}

              {tourStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-[#F8F6F1] rounded-xl border border-[#CAD8D0]/50 space-y-1">
                    <span className="font-bold text-[#263238]">Automated Overlap Detection</span>
                    <p>The top ribbon continuously synthesizes overlapping hours across all active members, highlighting the exact mutual meeting windows.</p>
                  </div>
                  <div className="p-3 bg-[#F8F6F1] rounded-xl border border-[#CAD8D0]/50 space-y-1">
                    <span className="font-bold text-[#263238]">Instant Calendar Invites</span>
                    <p>Click any green or amber slot chip to generate an RFC 5545 <strong>.ics calendar file</strong> or launch pre-filled <strong>Google Calendar</strong> events.</p>
                  </div>
                  <div className="p-3 bg-[#F8F6F1] rounded-xl border border-[#CAD8D0]/50 space-y-1">
                    <span className="font-bold text-[#263238]">Zero-Backend Sharing</span>
                    <p>Click <strong>Share Matrix</strong> to copy a Base64-compressed link containing your entire team state to send to coworkers.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="ceramic-card p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#52796F]" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#263238]">
                  Optimal Overlap Windows ({sweetSpots.length} Found)
                </h2>
              </div>
              <p className="text-xs text-[#546E7A]">
                Mutual waking and working periods calculated across all profiles.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {members.length < 2 ? (
                <span className="text-xs text-[#546E7A] bg-[#F8F6F1] border border-[#CAD8D0] px-3.5 py-1.5 rounded-lg font-mono">
                  Add at least 2 team members below to detect mutual overlap slots.
                </span>
              ) : sweetSpots.length === 0 ? (
                <span className="text-xs text-[#8C3E42] bg-[#FAF5EB] px-3.5 py-1.5 rounded-lg font-mono border border-[#C9A96E]/50">
                  No direct overlap detected. Try expanding flexible shift boundaries below.
                </span>
              ) : (
                sweetSpots.map(({ utcHour, isPerfect }, idx) => {
                  const displayHour = Math.floor((utcHour + anchorOffset + 24) % 24);
                  const isSelected = selectedSlot === utcHour;
                  return (
                    <button
                      key={utcHour}
                      onClick={() => setSelectedSlot(utcHour)}
                      style={{ animationDelay: isMounted ? `${idx * 45}ms` : '0ms' }}
                      className={`text-xs px-3.5 py-2 rounded-xl font-mono transition flex items-center gap-2 border animate-slot-reveal ${
                        isSelected
                          ? 'bg-[#263238] text-white border-[#263238] shadow-sm'
                          : isPerfect
                            ? 'slot-shimmer text-[#2D4C44] border-[#CAD8D0] hover:bg-[#EDF3F0]'
                            : 'slot-shimmer-flex text-[#8C6A2E] border-[#E8D7B8] hover:bg-[#FAF5EB]'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isPerfect ? 'bg-[#52796F]' : 'bg-[#C9A96E]'}`} />
                      {String(displayHour).padStart(2, '0')}:00 {anchorTimezone}
                      <span className="text-[10px] opacity-75 font-sans">({isPerfect ? '100%' : 'Flex'})</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {selectedSlot !== null && (
            <div className="mt-5 pt-4 border-t border-[#CAD8D0]/40 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FCFBF8] p-4 rounded-xl border border-[#CAD8D0]/60">
              <div className="text-xs text-[#546E7A]">
                Active Selection:{' '}
                <span className="font-mono text-[#263238] font-bold text-sm">
                  {String(Math.floor((selectedSlot + anchorOffset + 24) % 24)).padStart(2, '0')}:00 {anchorTimezone}
                </span>{' '}
                <span className="font-mono text-[#78909C]">(UTC {String(selectedSlot).padStart(2, '0')}:00)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadICS(selectedSlot)}
                  className="inline-flex items-center gap-1.5 text-xs bg-white hover:bg-[#F8F6F1] text-[#263238] px-3.5 py-2 rounded-lg transition border border-[#CAD8D0] font-semibold"
                >
                  <Download className="w-3.5 h-3.5 text-[#52796F]" />
                  Download .ics
                </button>
                <button
                  onClick={() => openGoogleCalendar(selectedSlot)}
                  className="inline-flex items-center gap-1.5 text-xs bg-[#52796F] hover:bg-[#43645C] text-white px-3.5 py-2 rounded-lg transition font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Google Calendar
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="ceramic-card overflow-hidden">
          <div className="p-5 border-b border-[#CAD8D0]/40 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#263238] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#52796F]" /> Team Working Matrix
              </h2>
              <span className="text-[11px] text-[#546E7A] font-mono">
                ({members.length} {members.length === 1 ? 'member' : 'members'})
              </span>
            </div>

            <div className="flex items-center gap-5 text-xs text-[#546E7A] font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#52796F]" /> Core Hours
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#C9A96E]" /> Flexible Edge
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#EFECE4]" /> Off-Hours
              </div>
            </div>
          </div>

          <div className="matrix-scroll-wrapper p-6">
            <div className="min-w-[940px] space-y-3.5">
              <div className="timeline-row">
                <div className="text-[11px] font-mono text-[#78909C] uppercase tracking-wider pl-1 font-semibold">
                  Timeline ({anchorTimezone})
                </div>
                <div className="matrix-grid-24">
                  {Array.from({ length: 24 }, (_, i) => {
                    const localTime = Math.floor((i + anchorOffset + 24) % 24);
                    const isOverlap = overlapAnalysis[i]?.isPerfect;
                    const isViable = overlapAnalysis[i]?.isViable;
                    return (
                      <div
                        key={i}
                        className={`text-center font-mono text-[11px] py-1.5 rounded cursor-pointer transition select-none ${
                          selectedSlot === i
                            ? 'bg-[#263238] text-white font-semibold'
                            : isOverlap
                              ? 'text-[#2D4C44] bg-[#EDF3F0] font-semibold border border-[#CAD8D0]'
                              : isViable
                                ? 'text-[#8C6A2E] bg-[#FAF5EB] font-semibold border border-[#E8D7B8]'
                                : 'text-[#78909C] hover:text-[#263238]'
                        }`}
                        onClick={() => setSelectedSlot(i)}
                      >
                        {String(localTime).padStart(2, '0')}
                      </div>
                    );
                  })}
                </div>
              </div>

              {members.length === 0 ? (
                <div className="p-8 text-center bg-[#FCFBF8] rounded-xl border border-dashed border-[#CAD8D0] space-y-3">
                  <UserPlus className="w-8 h-8 text-[#52796F] mx-auto opacity-70" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#263238]">No contributors in your matrix yet.</p>
                    <p className="text-xs text-[#546E7A] max-w-md mx-auto">
                      Add your remote teammates below, or load a sample preset to test cross-timezone overlap detection.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      onClick={() => loadDemoPreset('devDuo')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#52796F] text-white hover:bg-[#43645C] transition"
                    >
                      Load Demo Duo
                    </button>
                    <button
                      onClick={() => loadDemoPreset('globalSquad')}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-[#CAD8D0] text-[#263238] hover:bg-[#F8F6F1] transition"
                    >
                      Load Global Squad
                    </button>
                  </div>
                </div>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="timeline-row group">
                    <div className="ceramic-card-subtle p-3 flex items-center justify-between gap-2 border border-[#CAD8D0]/50">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-semibold text-[#263238] truncate flex items-center gap-1.5">
                            {member.name}
                            {member.isSelf && (
                              <span className="text-[9px] bg-[#52796F] text-white px-1.5 py-0.2 rounded font-mono font-bold">
                                YOU
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-[#2D4C44] bg-[#EDF3F0] px-1.5 py-0.5 rounded border border-[#CAD8D0]">
                            {member.timezone}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#546E7A]">
                          <SlidersHorizontal className="w-3 h-3 text-[#78909C]" />
                          <select
                            value={member.workStart}
                            onChange={(e) => updateWorkHours(member.id, 'start', e.target.value)}
                            className="bg-white border border-[#CAD8D0] rounded px-1.5 py-0.5 text-[11px] font-mono text-[#263238] focus:outline-none cursor-pointer"
                          >
                            {HOUR_CHOICES.map((h) => (
                              <option key={`start-${h.value}`} value={h.value}>
                                {h.label}
                              </option>
                            ))}
                          </select>
                          <span className="text-[#78909C] text-[10px]">to</span>
                          <select
                            value={member.workEnd}
                            onChange={(e) => updateWorkHours(member.id, 'end', e.target.value)}
                            className="bg-white border border-[#CAD8D0] rounded px-1.5 py-0.5 text-[11px] font-mono text-[#263238] focus:outline-none cursor-pointer"
                          >
                            {HOUR_CHOICES.map((h) => (
                              <option key={`end-${h.value}`} value={h.value}>
                                {h.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => removeMember(member.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#78909C] hover:text-[#8C3E42] p-1.5 rounded transition self-start"
                        title="Remove contributor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="matrix-grid-24 h-10 items-center">
                      {Array.from({ length: 24 }, (_, utcHour) => {
                        const { status, localHour } = getSlotStatus(member, utcHour);
                        const isSelected = selectedSlot === utcHour;
                        const isOverlapSlot = overlapAnalysis[utcHour]?.isPerfect;
                        const isViableSlot = overlapAnalysis[utcHour]?.isViable;

                        let statusClass = 'slot-off';
                        if (status === 'available') {
                          statusClass = isOverlapSlot ? 'slot-available slot-shimmer' : 'slot-available';
                        } else if (status === 'flexible') {
                          statusClass = isViableSlot ? 'slot-flexible slot-shimmer-flex' : 'slot-flexible';
                        }

                        return (
                          <div
                            key={utcHour}
                            onClick={() => setSelectedSlot(utcHour)}
                            style={{ animationDelay: isMounted ? `${utcHour * 20}ms` : '0ms' }}
                            title={`${member.name}: ${String(Math.floor(localHour)).padStart(2, '0')}:00 (${status})`}
                            className={`matrix-slot animate-slot-reveal ${statusClass} ${isSelected ? 'slot-selected' : ''}`}
                          >
                            {status !== 'off' ? String(Math.floor(localHour)) : ''}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="ceramic-card p-6 lg:col-span-2">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#263238] mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#52796F]" /> Add Remote Contributor
            </h2>
            <form onSubmit={addMember} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Name or Role (e.g. Liam - DevOps)..."
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="bg-[#FCFBF8] border border-[#CAD8D0] rounded-xl px-4 py-2.5 text-xs text-[#263238] placeholder-[#78909C] focus:outline-none focus:border-[#52796F] focus:bg-white"
              />
              <select
                value={newMemberTz}
                onChange={(e) => setNewMemberTz(e.target.value)}
                className="bg-[#FCFBF8] border border-[#CAD8D0] rounded-xl px-4 py-2.5 text-xs text-[#263238] focus:outline-none focus:border-[#52796F] focus:bg-white font-mono"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 bg-[#F8F6F1] border border-[#CAD8D0] rounded-xl px-3 py-1.5">
                <span className="text-[10px] text-[#546E7A] uppercase font-mono">Shift:</span>
                <span className="text-xs font-mono font-bold text-[#52796F]">09:00 - 18:00</span>
              </div>
              <button
                type="submit"
                className="bg-[#52796F] hover:bg-[#43645C] text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Member
              </button>
            </form>
          </section>

          <section className="ceramic-card p-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#263238] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9A96E]" /> Quick Demo Templates
              </span>
              <p className="text-xs text-[#546E7A]">
                Need to quickly demonstrate or simulate handoffs? Click a template to inject pre-configured schedules:
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => loadDemoPreset('devDuo')}
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-[#FCFBF8] border border-[#CAD8D0] text-[#263238] hover:border-[#52796F] hover:text-[#52796F] font-semibold transition text-center"
              >
                Dev Duo (US + IST)
              </button>
              <button
                onClick={() => loadDemoPreset('globalSquad')}
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-[#FCFBF8] border border-[#CAD8D0] text-[#263238] hover:border-[#52796F] hover:text-[#52796F] font-semibold transition text-center"
              >
                Global Trio (PST/CET/IST)
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}