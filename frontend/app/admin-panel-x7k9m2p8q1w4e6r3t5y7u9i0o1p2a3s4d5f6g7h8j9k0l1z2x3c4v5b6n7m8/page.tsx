'use client';
/* eslint-disable indent */

import { useState, useEffect } from 'react';
import { adminApi, AdminStats } from '@/lib/admin-api';
import { Report, ReportStats } from '@/lib/report-api';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'dictionaries'>('overview');
  const [userSort, setUserSort] = useState<'sessions' | 'learned' | 'dictionaries'>('sessions');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState<'pending' | 'in_progress' | 'resolved'>('pending');
  const [dictionaries, setDictionaries] = useState<{ items: any[]; total: number } | null>(null);
  const [isLoadingDictionaries, setIsLoadingDictionaries] = useState(false);

  // Helper to load all admin data
  const loadAdminData = async (u: string, p: string) => {
    const [data, reportData, reportStatsData] = await Promise.all([
      adminApi.getStats(u, p),
      adminApi.getReports(u, p, { limit: 20 }),
      adminApi.getReportStats(u, p)
    ]);
    setStats(data);
    setReports(reportData.reports);
    setReportStats(reportStatsData);
    setIsAuthenticated(true);
  };

  const loadDictionaries = async (u: string, p: string) => {
    setIsLoadingDictionaries(true);
    try {
      const data = await adminApi.getDictionaries(u, p, { limit: 100 });
      setDictionaries(data);
    } catch (e) {
      setError('Failed to load dictionaries');
    } finally {
      setIsLoadingDictionaries(false);
    }
  };

  // Persist admin auth across refresh
  useEffect(() => {
    const raw = sessionStorage.getItem('wc_admin_basic');
    if (raw) {
      try {
        const { u, p } = JSON.parse(raw) as { u: string; p: string };
        setUsername(u);
        setPassword(p);
        loadAdminData(u, p).catch(() => {
          // if failed, clear persisted creds
          sessionStorage.removeItem('wc_admin_basic');
        }).finally(() => setIsInitializing(false));
      } catch {
        setIsInitializing(false);
      }
    } else {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'dictionaries' && isAuthenticated && username && password) {
      loadDictionaries(username, password);
    }
  }, [activeTab, isAuthenticated, username, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loadAdminData(username, password);
      sessionStorage.setItem('wc_admin_basic', JSON.stringify({ u: username, p: password }));
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Panel</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WordCraft Admin Panel</h1>
              <div className="flex space-x-1 mt-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'reports'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Reports
                </button>
                <button
                  onClick={() => setActiveTab('dictionaries')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'dictionaries'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dictionaries
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAuthenticated(false)}
                className="text-red-600 hover:text-red-800"
              >
                Sign Out
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!username || !password) return;
                    const data = await adminApi.getStats(username, password);
                    setStats(data);
                  } catch {
                  }
                }}
                className="px-3 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
              >
                Refresh Stats
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
            {/* Overview Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{formatNumber(stats.overview.totalUsers)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">New Today</h3>
            <p className="text-3xl font-bold text-green-600">{formatNumber(stats.overview.newUsersToday)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Today</h3>
            <p className="text-3xl font-bold text-indigo-600">{formatNumber(stats.overview.activeUsersToday)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sessions Today</h3>
            <p className="text-3xl font-bold text-orange-600">{formatNumber(stats.overview.sessionsToday)}</p>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">User Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>New this week:</span>
                <span className="font-semibold">{formatNumber(stats.overview.newUsersThisWeek)}</span>
              </div>
              <div className="flex justify-between">
                <span>New this month:</span>
                <span className="font-semibold">{formatNumber(stats.overview.newUsersThisMonth)}</span>
              </div>
              <div className="flex justify-between">
                <span>Active this week:</span>
                <span className="font-semibold">{formatNumber(stats.overview.activeUsersThisWeek)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total sessions:</span>
                <span className="font-semibold">{formatNumber(stats.overview.totalSessions)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total hints:</span>
                <span className="font-semibold">{formatNumber(stats.overview.totalHints)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Content Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Public dictionaries:</span>
                <span className="font-semibold">{formatNumber(stats.overview.publicDictionaries)}</span>
              </div>
              <div className="flex justify-between">
                <span>Private dictionaries:</span>
                <span className="font-semibold">{formatNumber(stats.overview.privateDictionaries)}</span>
              </div>
              <div className="flex justify-between">
                <span>Created this week:</span>
                <span className="font-semibold">{formatNumber(stats.overview.dictionariesThisWeek)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total words:</span>
                <span className="font-semibold">{formatNumber(stats.overview.totalWords)}</span>
              </div>
              <div className="flex justify-between">
                <span>Learned words:</span>
                <span className="font-semibold">{formatNumber(stats.overview.learnedWords)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trends (Mini Charts) */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Usage Trends (last 30 days)</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(() => {
              const days = stats.dailyStats;
              // Compute series
              const maxUsers = Math.max(1, ...days.map(d => d.newUsers));
              const minUsers = Math.min(...days.map(d => d.newUsers));
              const maxSessions = Math.max(1, ...days.map(d => d.newSessions));
              const minSessions = Math.min(...days.map(d => d.newSessions));
              // Total users per day (approx): start from current total and walk backwards
              const totalNow = stats.overview.totalUsers;
              const newUsersArray = days.map(d => d.newUsers);
              const totalsReversed: number[] = [];
              let running = totalNow;
              for (let i = newUsersArray.length - 1; i >= 0; i--) {
                totalsReversed.push(running);
                running = Math.max(0, running - newUsersArray[i]);
              }
              const totalSeries = totalsReversed.reverse();
              const maxTotal = Math.max(1, ...totalSeries);
              const minTotal = Math.min(...totalSeries);

              const barBase = 'flex-1 bg-gradient-to-t rounded-sm group relative';
              const axis = 'flex items-end gap-1 h-28';
              const axisWithY = 'grid grid-cols-[2.5rem_1fr] gap-2';
              const YTicks = ({ max }: { max: number }) => (
                <div className="flex flex-col justify-between text-[10px] text-gray-400 pr-1 select-none">
                  <span>{formatNumber(max)}</span>
                  <span>{formatNumber(Math.round(max / 2))}</span>
                  <span>0</span>
                </div>
              );
              return (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">New Users</span>
                      <span className="text-xs text-gray-500">min {formatNumber(minUsers)} · max {formatNumber(maxUsers)}</span>
                    </div>
                    <div className={`${axisWithY}`}>
                      <YTicks max={maxUsers} />
                      <div className={`${axis}`} aria-label="New users bar chart">
                        {days.map((d) => (
                          <div key={`u-${d.date}`} className="w-[3px] sm:w-[4px] h-full flex items-end" style={{height: '100%'}}>
                            <div
                              className={`${barBase} from-blue-300 to-blue-600`}
                              style={{ height: `${Math.max(2, Math.round((d.newUsers / maxUsers) * 100))}%` }}
                              title={`${d.date}: ${d.newUsers}`}
                            >
                              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] bg-black/80 text-white px-1 py-0.5 rounded">
                                {formatNumber(d.newUsers)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* X-axis labels anchored under specific bars */}
                      <div className="col-start-2 mt-1 select-none w-full">
                        {(() => {
                          const n = Math.max(2, days.length);
                          const tickIdxs = new Set([0, Math.floor((n - 1) * 0.25), Math.floor((n - 1) * 0.5), Math.floor((n - 1) * 0.75), n - 1]);
                          const fmt = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          return (
                            <div className="flex items-start gap-1">
                              {days.map((d, i) => (
                                <div key={`ux-${i}`} className="w-[3px] sm:w-[4px] text-center">
                                  {tickIdxs.has(i) && (
                                    <span className="block text-[10px] text-gray-400 translate-x-[-50%] sm:translate-x-[-50%] relative left-1/2">
                                      {fmt(d.date)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Sessions</span>
                      <span className="text-xs text-gray-500">min {formatNumber(minSessions)} · max {formatNumber(maxSessions)}</span>
                    </div>
                    <div className={`${axisWithY}`}>
                      <YTicks max={maxSessions} />
                      <div className={`${axis}`} aria-label="Sessions bar chart">
                        {days.map((d) => (
                          <div key={`s-${d.date}`} className="w-[3px] sm:w-[4px] h-full flex items-end" style={{height: '100%'}}>
                            <div
                              className={`${barBase} from-orange-300 to-orange-600`}
                              style={{ height: `${Math.max(2, Math.round((d.newSessions / maxSessions) * 100))}%` }}
                              title={`${d.date}: ${d.newSessions}`}
                            >
                              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] bg-black/80 text-white px-1 py-0.5 rounded">
                                {formatNumber(d.newSessions)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* X-axis labels anchored under specific bars */}
                      <div className="col-start-2 mt-1 select-none w-full">
                        {(() => {
                          const n = Math.max(2, days.length);
                          const tickIdxs = new Set([0, Math.floor((n - 1) * 0.25), Math.floor((n - 1) * 0.5), Math.floor((n - 1) * 0.75), n - 1]);
                          const fmt = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          return (
                            <div className="flex items-start gap-1">
                              {days.map((d, i) => (
                                <div key={`sx-${i}`} className="w-[3px] sm:w-[4px] text-center">
                                  {tickIdxs.has(i) && (
                                    <span className="block text-[10px] text-gray-400 translate-x-[-50%] sm:translate-x-[-50%] relative left-1/2">
                                      {fmt(d.date)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Total Users</span>
                      <span className="text-xs text-gray-500">min {formatNumber(minTotal)} · max {formatNumber(maxTotal)}</span>
                    </div>
                    <div className={`${axisWithY}`}>
                      <YTicks max={maxTotal} />
                      <div className={`${axis}`} aria-label="Total users bar chart">
                        {totalSeries.map((val, idx) => (
                          <div key={`t-${days[idx].date}`} className="w-[3px] sm:w-[4px] h-full flex items-end" style={{height: '100%'}}>
                            <div
                              className={`${barBase} from-emerald-300 to-emerald-600`}
                              style={{ height: `${Math.max(2, Math.round((val / maxTotal) * 100))}%` }}
                              title={`${days[idx].date}: ${val}`}
                            >
                              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] bg-black/80 text-white px-1 py-0.5 rounded">
                                {formatNumber(val)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* X-axis labels anchored under specific bars */}
                      <div className="col-start-2 mt-1 select-none w-full">
                        {(() => {
                          const n = Math.max(2, days.length);
                          const tickIdxs = new Set([0, Math.floor((n - 1) * 0.25), Math.floor((n - 1) * 0.5), Math.floor((n - 1) * 0.75), n - 1]);
                          const fmt = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          return (
                            <div className="flex items-start gap-1">
                              {days.map((d, i) => (
                                <div key={`tx-${i}`} className="w-[3px] sm:w-[4px] text-center">
                                  {tickIdxs.has(i) && (
                                    <span className="block text-[10px] text-gray-400 translate-x-[-50%] sm:translate-x-[-50%] relative left-1/2">
                                      {fmt(d.date)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Per-mode Statistics */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Mode Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['letters','pair','input'].map((m) => (
              <div key={m}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">{m}</span>
                  <span className="text-xs text-gray-500">total {formatNumber(stats.modeStats?.totals?.[m] || 0)}</span>
                </div>
                <div className="grid grid-cols-[2.5rem_1fr] gap-2">
                  <div className="flex flex-col justify-between text-[10px] text-gray-400 pr-1 select-none">
                    {(() => {
                      const series = stats.modeStats?.series?.[m] || [];
                      const max = Math.max(1, ...series.map(s => s.sessions));
                      return (<>
                        <span>{formatNumber(max)}</span>
                        <span>{formatNumber(Math.round(max/2))}</span>
                        <span>0</span>
                      </>);
                    })()}
                  </div>
                  <div className="flex items-end gap-1 h-28">
                    {(() => {
                      const series = stats.modeStats?.series?.[m] || [];
                      const max = Math.max(1, ...series.map(s => s.sessions));
                      return series.map((s, idx) => (
                        <div key={`${m}-${s.date}`} className="w-[3px] sm:w-[4px] h-full flex items-end">
                          <div
                            className={`flex-1 bg-gradient-to-t rounded-sm group relative ${m==='letters'?'from-violet-300 to-violet-600': m==='pair'?'from-cyan-300 to-cyan-600':'from-pink-300 to-pink-600'}`}
                            style={{ height: `${Math.max(2, Math.round((s.sessions / max) * 100))}%` }}
                            title={`${s.date}: ${s.sessions}`}
                          >
                            <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] bg-black/80 text-white px-1 py-0.5 rounded">
                              {formatNumber(s.sessions)}
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  {/* X-axis labels anchored under specific bars */}
                  <div className="col-start-2 mt-1 select-none w-full">
                    {(() => {
                      const series = stats.modeStats?.series?.[m] || [];
                      const n = Math.max(2, series.length);
                      const tickIdxs = new Set([0, Math.floor((n - 1) * 0.25), Math.floor((n - 1) * 0.5), Math.floor((n - 1) * 0.75), n - 1]);
                      const fmt = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      return (
                        <div className="flex items-start gap-1">
                          {series.map((s, i) => (
                            <div key={`mx-${m}-${i}`} className="w-[3px] sm:w-[4px] text-center">
                              {tickIdxs.has(i) && (
                                <span className="block text-[10px] text-gray-400 translate-x-[-50%] sm:translate-x-[-50%] relative left-1/2">
                                  {fmt(s.date)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Top Users</h3>
            <div className="text-sm text-gray-500">Sort by: <span className="font-medium capitalize">{userSort}</span></div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th onClick={() => setUserSort('learned')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none">Words Learned</th>
                  <th onClick={() => setUserSort('sessions')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none">Sessions</th>
                  <th onClick={() => setUserSort('dictionaries')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none">Dictionaries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...stats.topUsers]
                  .sort((a, b) => {
                    if (userSort === 'sessions') return (b._count.sessions || 0) - (a._count.sessions || 0);
                    if (userSort === 'dictionaries') return (b._count.dictionaries || 0) - (a._count.dictionaries || 0);
                    // learned: prefer learnedTrueCount if present, fallback to stats.learnedCount
                    const la = (a.learnedTrueCount ?? a.stats?.learnedCount ?? 0);
                    const lb = (b.learnedTrueCount ?? b.stats?.learnedCount ?? 0);
                    return lb - la;
                  })
                  .map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.nickname || user.email}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(user.learnedTrueCount ?? user.stats?.learnedCount ?? 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(user._count.sessions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(user._count.dictionaries)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Dictionaries */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Popular Dictionaries</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Words</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.topDictionaries.map((dict) => (
                  <tr key={dict.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{dict.name}</div>
                        {dict.description && (
                          <div className="text-sm text-gray-500">{dict.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dict.createdBy.nickname || 'Аноним'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(dict.likes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(dict._count.words)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(dict._count.sessions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(dict.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Language Statistics */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Language Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.languageStats.map((lang) => (
              <div key={lang.id} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900">{lang.name} ({lang.code})</h4>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Words in database:</span>
                    <span className="font-medium">{formatNumber(lang._count.words)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Learned by users:</span>
                    <span className="font-medium">{formatNumber(lang._count.userLearnedWords)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Chart for Last 30 Days */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Activity for Last 30 Days</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Users</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hints</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.dailyStats.slice(-7).map((day) => (
                  <tr key={day.date}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(day.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(day.newUsers)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(day.newSessions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(day.newHints)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}

        {activeTab === 'reports' && (
          <>
            {/* Report Statistics */}
              {reportStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Reports</h3>
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(reportStats.overview.totalReports)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending</h3>
                  <p className="text-3xl font-bold text-orange-600">{formatNumber(reportStats.overview.pendingReports)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">In Progress</h3>
                  <p className="text-3xl font-bold text-yellow-600">{formatNumber(reportStats.overview.inProgressReports)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Resolved</h3>
                  <p className="text-3xl font-bold text-green-600">{formatNumber(reportStats.overview.resolvedReports)}</p>
                </div>
              </div>
            )}

            {/* Reports Table */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Reports</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{report.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            report.type === 'bug' ? 'bg-red-100 text-red-800' :
                            report.type === 'dictionary' ? 'bg-yellow-100 text-yellow-800' :
                            report.type === 'feature' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {report.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.user?.nickname || report.user?.email || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            report.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {report.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setStatusDraft(report.status as 'pending' | 'in_progress' | 'resolved');
                              setIsDetailsOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'dictionaries' && (
          <>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Dictionaries</h3>
                <div className="text-sm text-gray-500">Total: <span className="font-medium">{dictionaries?.total ?? 0}</span></div>
              </div>
              {isLoadingDictionaries && (
                <div className="text-gray-600">Loading...</div>
              )}
              {!isLoadingDictionaries && dictionaries && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Languages</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Public</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Words</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dictionaries.items.map((d) => (
                        <tr key={d.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{d.name}</div>
                              {d.description && (
                                <div className="text-sm text-gray-500 max-w-[40ch] truncate">{d.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.createdBy?.nickname || d.createdBy?.email || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.sourceLanguage?.code} → {d.targetLanguage?.code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.isPublic ? 'Yes' : 'No'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d._count?.words ?? 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(d.createdAt)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={async () => {
                                if (!confirm('Delete this dictionary permanently?')) return;
                                try {
                                  setLoading(true);
                                  await adminApi.deleteDictionary(d.id, username, password);
                                  await loadDictionaries(username, password);
                                } catch (e) {
                                  alert('Failed to delete dictionary');
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Report Details Modal */}
        {isDetailsOpen && selectedReport && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Report #{selectedReport.id}</h3>
                  <button
                    onClick={() => setIsDetailsOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Close report details"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">Created: {formatDate(selectedReport.createdAt)}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs uppercase text-gray-500">Type</div>
                    <div className="mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedReport.type === 'bug' ? 'bg-red-100 text-red-800' :
                        selectedReport.type === 'dictionary' ? 'bg-yellow-100 text-yellow-800' :
                        selectedReport.type === 'feature' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedReport.type}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-gray-500">Status</div>
                    <div className="mt-1">
                      <select
                        value={statusDraft}
                        onChange={(e) => setStatusDraft(e.target.value as any)}
                        className="px-2 py-1 border rounded bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase text-gray-500">User</div>
                  <div className="mt-1 text-gray-900">
                    {selectedReport.user?.nickname || selectedReport.user?.email || 'Unknown'}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase text-gray-500">Comment</div>
                  <div className="mt-1 p-3 bg-gray-50 rounded border text-gray-800 whitespace-pre-wrap">
                    {selectedReport.comment}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t flex justify-end gap-3">
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  disabled={isSavingStatus}
                  onClick={async () => {
                    if (!selectedReport) return;
                    try {
                      setIsSavingStatus(true);
                      const updated = await adminApi.updateReportStatus(
                        username,
                        password,
                        selectedReport.id,
                        statusDraft
                      );
                      // Update local state
                      setReports((prev) => prev.map(r => r.id === updated.id ? { ...r, status: updated.status } : r));
                      setSelectedReport((prev) => prev ? { ...prev, status: updated.status } : prev);
                      // Live update counters
                      setReportStats((s) => {
                        if (!s) return s;
                        const prevStatus = selectedReport.status as 'pending' | 'in_progress' | 'resolved';
                        const nextStatus = updated.status as 'pending' | 'in_progress' | 'resolved';
                        if (prevStatus === nextStatus) return s;

                        const next = { ...s, overview: { ...s.overview } };
                        // decrement old bucket
                        if (prevStatus === 'pending') next.overview.pendingReports = Math.max(0, next.overview.pendingReports - 1);
                        if (prevStatus === 'in_progress') next.overview.inProgressReports = Math.max(0, next.overview.inProgressReports - 1);
                        if (prevStatus === 'resolved') next.overview.resolvedReports = Math.max(0, next.overview.resolvedReports - 1);
                        // increment new bucket
                        if (nextStatus === 'pending') next.overview.pendingReports += 1;
                        if (nextStatus === 'in_progress') next.overview.inProgressReports += 1;
                        if (nextStatus === 'resolved') next.overview.resolvedReports += 1;
                        return next;
                      });
                      // Close modal after successful save
                      setIsDetailsOpen(false);
                      setSelectedReport(null);
                    } catch (e) {
                      alert('Failed to update status');
                    } finally {
                      setIsSavingStatus(false);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingStatus ? 'Saving...' : 'Save Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
