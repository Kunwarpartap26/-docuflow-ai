import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Upload, AlertTriangle, CheckCircle, Clock, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

import PageTransition from '../components/PageTransition';
import StatCard from '../components/StatCard';
import ValidationBadge from '../components/ValidationBadge';
import { getDashboardStats, getDashboardCharts } from '../utils/api';

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

// ─── Custom dark tooltip ───────────────────────────────────────────────────
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #27272A',
        borderRadius: '2px',
        padding: '8px 12px',
        color: '#fff',
        fontSize: '12px',
      }}
    >
      {label && <p style={{ color: '#A1A1AA', marginBottom: 4 }}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || '#fff' }}>
          {entry.name ? `${entry.name}: ` : ''}{entry.value}
        </p>
      ))}
    </div>
  );
}

// ─── Skeleton loader block ─────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-zinc-800/50 ${className}`}
      style={{ borderRadius: '2px' }}
    />
  );
}

// ─── Chart wrapper ─────────────────────────────────────────────────────────
function ChartCard({ title, children, loading }) {
  return (
    <div className="bg-[#121212] border border-white/10 p-6" style={{ borderRadius: '2px' }}>
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-4 font-medium">{title}</p>
      {loading ? (
        <Skeleton className="h-[220px] w-full" />
      ) : (
        children
      )}
    </div>
  );
}

// ─── Validation failures pagination ───────────────────────────────────────
const FAILURES_PER_PAGE = 10;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Qty table sort
  const [qtySortDir, setQtySortDir] = useState('desc');

  // Failures pagination
  const [failurePage, setFailurePage] = useState(0);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [statsData, chartsData] = await Promise.all([
        getDashboardStats(),
        getDashboardCharts(),
      ]);
      setStats(statsData);
      setCharts(chartsData);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Sorted qty table ──
  const sortedQtyTable = charts?.qty_table
    ? [...charts.qty_table].sort((a, b) =>
        qtySortDir === 'desc' ? b.qty - a.qty : a.qty - b.qty
      )
    : [];

  // ── Paginated failures ──
  const failures = charts?.validation_failures || [];
  const totalFailurePages = Math.ceil(failures.length / FAILURES_PER_PAGE);
  const pagedFailures = failures.slice(
    failurePage * FAILURES_PER_PAGE,
    (failurePage + 1) * FAILURES_PER_PAGE
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0A0A0A] pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">

          {/* ── Page Header ── */}
          <div className="flex items-start justify-between mb-10">
            <div className="border-l-4 border-blue-500 pl-4">
              <h1
                className="text-3xl font-black uppercase text-white"
                style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.02em' }}
              >
                Dashboard
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Operational insights and extraction analytics
              </p>
            </div>
            <button
              data-testid="dashboard-refresh"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[#121212] border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 text-sm font-medium transition-colors"
              style={{ borderRadius: '2px' }}
            >
              <RefreshCw
                size={14}
                className={refreshing ? 'animate-spin text-blue-500' : ''}
              />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* ── Error state ── */}
          {error && (
            <div
              className="mb-8 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              style={{ borderRadius: '2px' }}
            >
              {error}
            </div>
          )}

          {/* ── 4 Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {loading ? (
              <>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[120px] w-full" />
                ))}
              </>
            ) : (
              <>
                <StatCard
                  label="Total Uploads"
                  value={stats?.total_uploads ?? 0}
                  icon={Upload}
                  color="#3B82F6"
                  pulse={false}
                  delay={0}
                />
                <StatCard
                  label="Validation Failures"
                  value={stats?.validation_failures ?? 0}
                  icon={AlertTriangle}
                  color="#EF4444"
                  pulse={(stats?.validation_failures ?? 0) > 0}
                  delay={0.1}
                />
                <StatCard
                  label="Records Saved"
                  value={stats?.records_saved ?? 0}
                  icon={CheckCircle}
                  color="#10B981"
                  pulse={false}
                  delay={0.2}
                />
                <StatCard
                  label="Avg Processing Time"
                  value={`${stats?.avg_processing_time ?? 0}s`}
                  icon={Clock}
                  color="#F59E0B"
                  pulse={false}
                  delay={0.3}
                />
              </>
            )}
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

            {/* Bar Chart — Uploads by Shift */}
            <ChartCard title="Uploads by Shift" loading={loading}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={charts?.shift_data || []}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid stroke="#27272A" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="shift"
                    tick={{ fill: '#71717A', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#71717A', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Line Chart — Last 7 Days */}
            <ChartCard title="Documents — Last 7 Days" loading={loading}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={charts?.time_series || []}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid stroke="#27272A" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#71717A', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    tick={{ fill: '#71717A', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Pie Chart — Machine Distribution */}
            <ChartCard title="Machine Distribution" loading={loading}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={charts?.machine_data || []}
                    dataKey="count"
                    nameKey="machine"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={3}
                  >
                    {(charts?.machine_data || []).map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ color: '#A1A1AA', fontSize: '11px' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ── Bottom Tables Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Qty Summary Table */}
            <div className="bg-[#121212] border border-white/10" style={{ borderRadius: '2px' }}>
              <div className="p-5 border-b border-white/5">
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">
                  Quantity Summary by Machine
                </p>
              </div>
              {loading ? (
                <div className="p-5 space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-zinc-500">
                          Machine No
                        </th>
                        <th
                          className="text-right px-5 py-3 text-xs uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-white transition-colors select-none"
                          data-testid="qty-sort-header"
                          onClick={() => setQtySortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                        >
                          <span className="flex items-center justify-end gap-1">
                            Total Qty
                            {qtySortDir === 'desc' ? (
                              <ArrowDown size={11} />
                            ) : (
                              <ArrowUp size={11} />
                            )}
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedQtyTable.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="text-center py-8 text-zinc-600 text-sm">
                            No data available
                          </td>
                        </tr>
                      ) : (
                        sortedQtyTable.map((row, i) => (
                          <motion.tr
                            key={row.machine}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.04 }}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="px-5 py-3 text-sm text-white font-mono">
                              {row.machine}
                            </td>
                            <td className="px-5 py-3 text-sm text-right text-zinc-300">
                              {row.qty?.toLocaleString()}
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Validation Failures Table */}
            <div className="bg-[#121212] border border-white/10" style={{ borderRadius: '2px' }}>
              <div className="p-5 border-b border-white/5">
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">
                  Validation Failures
                </p>
              </div>
              {loading ? (
                <div className="p-5 space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : failures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <CheckCircle size={36} className="text-green-500 mb-3" />
                  <p className="text-sm font-medium text-white mb-1">
                    No validation failures
                  </p>
                  <p className="text-xs text-zinc-500 text-center">
                    All records clean!
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-zinc-500">
                            Doc ID
                          </th>
                          <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-zinc-500">
                            Field
                          </th>
                          <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-zinc-500">
                            Error
                          </th>
                          <th className="text-left px-5 py-3 text-xs uppercase tracking-widest text-zinc-500">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedFailures.map((f, i) => (
                          <tr
                            key={i}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="px-5 py-3 text-xs text-zinc-400 font-mono">
                              {(f.doc_id || '').substring(0, 8)}…
                            </td>
                            <td className="px-5 py-3 text-xs text-zinc-300 font-mono">
                              {f.field}
                            </td>
                            <td className="px-5 py-3 text-xs text-red-400 max-w-[140px] truncate">
                              {f.error}
                            </td>
                            <td className="px-5 py-3">
                              <ValidationBadge status={f.status || 'flagged'} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {totalFailurePages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                      <span className="text-xs text-zinc-600">
                        Page {failurePage + 1} of {totalFailurePages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFailurePage((p) => Math.max(0, p - 1))}
                          disabled={failurePage === 0}
                          className="px-3 py-1 text-xs bg-zinc-800 text-zinc-400 disabled:opacity-30 hover:bg-zinc-700 transition-colors"
                          style={{ borderRadius: '2px' }}
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setFailurePage((p) => Math.min(totalFailurePages - 1, p + 1))}
                          disabled={failurePage >= totalFailurePages - 1}
                          className="px-3 py-1 text-xs bg-zinc-800 text-zinc-400 disabled:opacity-30 hover:bg-zinc-700 transition-colors"
                          style={{ borderRadius: '2px' }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </PageTransition>
  );
}
