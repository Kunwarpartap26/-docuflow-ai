import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown, ChevronUp, ExternalLink, Loader2 } from 'lucide-react';

import PageTransition from '../components/PageTransition';
import ValidationBadge from '../components/ValidationBadge';
import ConfidenceBar from '../components/ConfidenceBar';
import { getDocuments, searchDocuments, getDocumentImageUrl } from '../utils/api';

const PAGE_SIZE = 10;

const FILTERS = [
  { label: 'All',           value: null },
  { label: 'Shift I',       value: 'shift_I' },
  { label: 'Shift II',      value: 'shift_II' },
  { label: 'Shift III',     value: 'shift_III' },
  { label: 'Validated',     value: 'validated' },
  { label: 'Pending Review',value: 'extracted' },
  { label: 'Flagged',       value: 'flagged' },
  { label: 'Last 7 Days',   value: 'days_7' },
  { label: 'Last 30 Days',  value: 'days_30' },
];

function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mon = months[d.getMonth()];
  const yr = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mon} ${yr} ${hh}:${mm}`;
}

function truncate(str, n = 20) {
  if (!str) return '';
  return str.length > n ? str.substring(0, n) + '…' : str;
}

// ─── Mini field table shown on row expand ────────────────────────────────────
function ExpandedFields({ doc }) {
  const firstRow = doc?.rows?.[0];
  if (!firstRow) {
    return (
      <td
        colSpan={6}
        className="px-6 py-4 text-xs text-zinc-600 bg-zinc-900/50"
      >
        No extracted fields available.
      </td>
    );
  }

  const FIELD_KEYS = [
    'date', 'shift', 'emp_no', 'opn_code',
    'machine_no', 'work_order_no', 'qty_produced', 'time_taken',
  ];

  return (
    <td colSpan={6} className="bg-zinc-900/40 px-6 py-4">
      <p className="text-xs uppercase tracking-widest text-zinc-600 mb-3 font-medium">
        First Row Fields
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {FIELD_KEYS.map((key) => {
          const field = firstRow[key];
          if (!field) return null;
          return (
            <div key={key} className="space-y-1">
              <p className="text-xs text-zinc-600 uppercase tracking-wide">
                {key.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-white font-mono">
                {String(field.value ?? '—')}
              </p>
              <ConfidenceBar
                confidence={field.confidence ?? 0}
                showLabel={false}
              />
            </div>
          );
        })}
      </div>
    </td>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {[60, 120, 80, 70, 60, 80].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="animate-pulse bg-zinc-800/50 h-4"
            style={{ width: w, borderRadius: '2px' }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function History() {
  const navigate = useNavigate();

  const [docs, setDocs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [query, setQuery]         = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter]     = useState(null);
  const [expandedId, setExpandedId]         = useState(null);

  const debounceTimer = useRef(null);

  // ── Debounce search input ───────────────────────────────────────────────
  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(val);
      setPage(0);
    }, 300);
  };

  const clearQuery = () => {
    setQuery('');
    setDebouncedQuery('');
    setPage(0);
  };

  // ── Fetch docs ───────────────────────────────────────────────────────────
  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (debouncedQuery || activeFilter) {
        result = await searchDocuments(
          debouncedQuery,
          activeFilter ? { filter: activeFilter } : {},
          page
        );
      } else {
        result = await getDocuments(page, PAGE_SIZE);
      }
      // API may return { documents, total } or an array
      if (Array.isArray(result)) {
        setDocs(result);
        setTotal(result.length);
      } else {
        setDocs(result.documents || []);
        setTotal(result.total || 0);
      }
    } catch (err) {
      console.error('History fetch error:', err);
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, activeFilter, page]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // ── Computed values ──────────────────────────────────────────────────────
  const totalPages  = Math.ceil(total / PAGE_SIZE);
  const showingFrom = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo   = Math.min((page + 1) * PAGE_SIZE, total);

  const handleRowClick = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0A0A0A] pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">

          {/* ── Page Header ── */}
          <div className="border-l-4 border-blue-500 pl-4 mb-10">
            <h1
              className="text-3xl font-black uppercase text-white"
              style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.02em' }}
            >
              History
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Browse and search all processed documents
            </p>
          </div>

          {/* ── Search Bar ── */}
          <div className="relative mb-4">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
            />
            <input
              data-testid="history-search-input"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search by work order, employee, machine, date..."
              className="w-full bg-[#121212] border border-white/10 text-white pl-10 pr-10 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors"
              style={{ borderRadius: '2px' }}
            />
            {query && (
              <button
                onClick={clearQuery}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                data-testid="history-search-clear"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* ── Filter Chips ── */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
            {FILTERS.map((f) => {
              const isActive = activeFilter === f.value;
              return (
                <button
                  key={f.label}
                  data-testid={`filter-chip-${f.label}`}
                  onClick={() => {
                    setActiveFilter(f.value);
                    setPage(0);
                  }}
                  className={`
                    flex-shrink-0 px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors
                    ${isActive
                      ? 'bg-blue-500 text-white'
                      : 'border border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'
                    }
                  `}
                  style={{ borderRadius: '2px' }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* ── Results Count ── */}
          {!loading && (
            <p className="text-xs text-zinc-600 mb-3">
              {total === 0
                ? 'No documents found'
                : `Showing ${showingFrom}–${showingTo} of ${total} documents`}
            </p>
          )}

          {/* ── Error ── */}
          {error && (
            <div
              className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              style={{ borderRadius: '2px' }}
            >
              {error}
            </div>
          )}

          {/* ── Table ── */}
          {!loading && docs.length === 0 ? (
            /* Empty State */
            <div className="text-center py-24">
              <div className="text-6xl mb-4">📂</div>
              <h3
                className="font-black text-white text-xl mb-2 uppercase"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                No documents found
              </h3>
              <p className="text-zinc-500 text-sm mb-6">
                Try adjusting your search or filters
              </p>
              <button
                onClick={() => navigate('/upload')}
                className="px-6 py-2.5 bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                style={{ borderRadius: '2px' }}
              >
                Upload Your First Document
              </button>
            </div>
          ) : (
            <div
              className="bg-[#121212] border border-white/10 overflow-hidden"
              style={{ borderRadius: '2px' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#121212]">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium">
                        Doc
                      </th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium">
                        Rows
                      </th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium">
                        Errors
                      </th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                      : docs.map((doc, index) => {
                          const isExpanded = expandedId === doc.id;
                          const errorCount = doc.validation_summary?.total_errors ?? 0;

                          return (
                            <React.Fragment key={doc.id}>
                              <motion.tr
                                data-testid="history-row"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleRowClick(doc.id)}
                                className="border-b border-white/5 history-row cursor-pointer hover:bg-white/5 transition-colors"
                              >
                                {/* Doc thumbnail + filename */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-8 h-8 bg-zinc-800 flex-shrink-0 overflow-hidden"
                                      style={{ borderRadius: '2px' }}
                                    >
                                      <img
                                        src={getDocumentImageUrl(doc.id)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <p className="text-xs text-white font-mono leading-tight">
                                        {truncate(doc.original_filename, 20)}
                                      </p>
                                      <p className="text-xs text-zinc-600 mt-0.5 font-mono">
                                        {(doc.id || '').substring(0, 8)}…
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* Date */}
                                <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                                  {formatDate(doc.upload_timestamp)}
                                </td>

                                {/* Rows */}
                                <td className="px-4 py-3 text-xs text-zinc-300">
                                  {doc.rows?.length ?? 0}
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3">
                                  <ValidationBadge status={doc.status} />
                                </td>

                                {/* Errors */}
                                <td className="px-4 py-3">
                                  {errorCount > 0 ? (
                                    <span
                                      className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20"
                                      style={{ borderRadius: '2px' }}
                                    >
                                      {errorCount}
                                    </span>
                                  ) : (
                                    <span className="text-green-500 text-xs">✓</span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center gap-2">
                                    <button
                                      data-testid={`open-doc-${doc.id}`}
                                      onClick={() => navigate(`/review/${doc.id}`)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                                      style={{ borderRadius: '2px' }}
                                    >
                                      <ExternalLink size={11} />
                                      Open
                                    </button>
                                    <button
                                      onClick={() => handleRowClick(doc.id)}
                                      className="text-zinc-600 hover:text-zinc-300 transition-colors"
                                    >
                                      {isExpanded
                                        ? <ChevronUp size={14} />
                                        : <ChevronDown size={14} />
                                      }
                                    </button>
                                  </div>
                                </td>
                              </motion.tr>

                              {/* Expanded row */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.tr
                                    key={`expand-${doc.id}`}
                                    initial={{ opacity: 0, scaleY: 0.95 }}
                                    animate={{ opacity: 1, scaleY: 1 }}
                                    exit={{ opacity: 0, scaleY: 0.95 }}
                                    transition={{ duration: 0.18 }}
                                    style={{ transformOrigin: 'top' }}
                                    className="border-b border-white/5"
                                  >
                                    <ExpandedFields doc={doc} />
                                  </motion.tr>
                                )}
                              </AnimatePresence>
                            </React.Fragment>
                          );
                        })}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                  <span className="text-xs text-zinc-600">
                    {total > 0
                      ? `Showing ${showingFrom}–${showingTo} of ${total} documents`
                      : 'No documents'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      data-testid="pagination-prev"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-4 py-1.5 text-xs font-medium bg-zinc-800 text-zinc-400 disabled:opacity-30 hover:bg-zinc-700 hover:text-white transition-colors"
                      style={{ borderRadius: '2px' }}
                    >
                      Previous
                    </button>
                    <span className="flex items-center px-3 text-xs text-zinc-600">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      data-testid="pagination-next"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-4 py-1.5 text-xs font-medium bg-zinc-800 text-zinc-400 disabled:opacity-30 hover:bg-zinc-700 hover:text-white transition-colors"
                      style={{ borderRadius: '2px' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Loading overlay over table ── */}
          {loading && docs.length === 0 && (
            <div
              className="bg-[#121212] border border-white/10 overflow-hidden"
              style={{ borderRadius: '2px' }}
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Doc', 'Date', 'Rows', 'Status', 'Errors', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs uppercase tracking-widest text-zinc-500 font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Loading spinner during re-fetch with existing data */}
          {loading && docs.length > 0 && (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-blue-500" />
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
}
