import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, RefreshCw, Plus, Trash2, AlertTriangle, CheckCircle,
  ChevronDown, ChevronUp, Loader2, ArrowLeft, Check, X
} from 'lucide-react';
import { getDocument, updateDocument, reextractDocument, getDocumentImageUrl } from '../utils/api';
import ConfidenceBar from '../components/ConfidenceBar';
import ScannerBeam from '../components/ScannerBeam';
import ValidationBadge from '../components/ValidationBadge';
import PageTransition from '../components/PageTransition';

const FIELD_CONFIG = [
  { key: 'date', label: 'Date', type: 'text', placeholder: 'DD/M/YY', width: 'w-24' },
  { key: 'shift', label: 'Shift', type: 'select', options: ['', 'I', 'II', 'III'], width: 'w-20' },
  { key: 'emp_no', label: 'Emp. No', type: 'text', placeholder: 'BT1234', width: 'w-24' },
  { key: 'opn_code', label: 'Opn Code', type: 'text', placeholder: '856430', width: 'w-24' },
  { key: 'machine_no', label: 'Machine No', type: 'text', placeholder: 'MC-730', width: 'w-28' },
  { key: 'work_order_no', label: 'Work Order', type: 'text', placeholder: '165460', width: 'w-28' },
  { key: 'qty_produced', label: 'Qty', type: 'number', placeholder: '0', width: 'w-20' },
  { key: 'time_taken', label: 'Time (hrs)', type: 'number', placeholder: '4.0', width: 'w-24' },
];

const makeEmptyRow = (s_no) => ({
  s_no,
  date: { value: '', confidence: 0, valid: true, errors: [] },
  shift: { value: '', confidence: 0, valid: true, errors: [] },
  emp_no: { value: '', confidence: 0, valid: true, errors: [] },
  opn_code: { value: '', confidence: 0, valid: true, errors: [] },
  machine_no: { value: '', confidence: 0, valid: true, errors: [] },
  work_order_no: { value: '', confidence: 0, valid: true, errors: [] },
  qty_produced: { value: '', confidence: 0, valid: true, errors: [] },
  time_taken: { value: '', confidence: 0, valid: true, errors: [] },
});

const FieldCell = ({ field, rowIndex, value, confidence, valid, errors, onChange }) => {
  const [shaking, setShaking] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const prevValid = useRef(valid);

  useEffect(() => {
    if (prevValid.current && !valid) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
    prevValid.current = valid;
  }, [valid]);

  const handleChange = (e) => {
    onChange(rowIndex, field.key, e.target.value);
  };

  const borderColor = !valid && errors?.some(e => !e.startsWith('Warning'))
    ? 'border-red-500/60'
    : confidence > 0 && confidence < 0.6
    ? 'border-amber-500/40'
    : 'border-white/10';

  return (
    <td className="px-2 py-2 align-top" data-testid={`field-${field.key}-${rowIndex}`}>
      <div className={`relative ${shaking ? 'shake' : ''}`}>
        {field.type === 'select' ? (
          <select
            className={`form-input w-full text-xs ${borderColor} ${!valid ? 'error' : ''}`}
            value={value || ''}
            onChange={handleChange}
            style={{ minWidth: '70px' }}
          >
            {field.options.map(opt => (
              <option key={opt} value={opt}>{opt || '—'}</option>
            ))}
          </select>
        ) : (
          <input
            type={field.type}
            className={`form-input w-full text-xs ${borderColor} ${!valid ? 'error' : ''}`}
            value={value ?? ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            step={field.key === 'time_taken' ? '0.5' : undefined}
            min={field.key === 'qty_produced' ? '1' : field.key === 'time_taken' ? '0.5' : undefined}
            style={{ minWidth: '80px' }}
          />
        )}

        {/* Confidence bar */}
        {confidence > 0 && (
          <div className="mt-1">
            <ConfidenceBar confidence={confidence} showLabel={false} />
          </div>
        )}

        {/* Error tooltip */}
        {errors && errors.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {errors.slice(0, 2).map((err, i) => (
              <p key={i} className={`text-[9px] leading-tight ${err.startsWith('Warning') ? 'text-amber-400' : 'text-red-400'}`}>
                {err}
              </p>
            ))}
          </div>
        )}
      </div>
    </td>
  );
};

const Review = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reextracting, setReextracting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [validationOpen, setValidationOpen] = useState(false);
  const pollRef = useRef(null);

  const loadDocument = useCallback(async () => {
    try {
      const data = await getDocument(id);
      setDoc(data);
      if (data.rows && data.rows.length > 0) {
        setRows(data.rows.map(r => ({
          ...r,
          date: r.date || { value: '', confidence: 0, valid: true, errors: [] },
          shift: r.shift || { value: '', confidence: 0, valid: true, errors: [] },
          emp_no: r.emp_no || { value: '', confidence: 0, valid: true, errors: [] },
          opn_code: r.opn_code || { value: '', confidence: 0, valid: true, errors: [] },
          machine_no: r.machine_no || { value: '', confidence: 0, valid: true, errors: [] },
          work_order_no: r.work_order_no || { value: '', confidence: 0, valid: true, errors: [] },
          qty_produced: r.qty_produced || { value: '', confidence: 0, valid: true, errors: [] },
          time_taken: r.time_taken || { value: '', confidence: 0, valid: true, errors: [] },
        })));
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load document');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // Poll while processing
  useEffect(() => {
    if (doc?.status === 'processing') {
      pollRef.current = setInterval(async () => {
        try {
          const data = await getDocument(id);
          setDoc(data);
          if (data.status !== 'processing') {
            clearInterval(pollRef.current);
            setRows(data.rows || []);
          }
        } catch {}
      }, 2000);
      return () => clearInterval(pollRef.current);
    }
  }, [doc?.status, id]);

  const handleFieldChange = (rowIndex, fieldKey, newValue) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== rowIndex) return row;
      return {
        ...row,
        [fieldKey]: {
          ...row[fieldKey],
          value: newValue,
          errors: [],
          valid: true
        }
      };
    }));
  };

  const addRow = () => {
    const maxSno = rows.reduce((max, r) => Math.max(max, r.s_no || 0), 0);
    setRows(prev => [...prev, makeEmptyRow(maxSno + 1)]);
  };

  const deleteRow = (index) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const serializedRows = rows.map(row => {
        const sr = { s_no: row.s_no };
        FIELD_CONFIG.forEach(field => {
          const fieldData = row[field.key] || {};
          sr[field.key] = {
            value: fieldData.value ?? null,
            confidence: fieldData.confidence ?? 0,
            valid: fieldData.valid ?? true,
            errors: fieldData.errors ?? []
          };
        });
        return sr;
      });
      const updated = await updateDocument(id, { rows: serializedRows });
      setDoc(updated);
      setRows(updated.rows || rows);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReextract = async () => {
    setReextracting(true);
    try {
      await reextractDocument(id);
      setDoc(prev => ({ ...prev, status: 'processing', rows: [] }));
      setRows([]);
    } catch (err) {
      setError('Re-extraction failed');
    } finally {
      setReextracting(false);
    }
  };

  const totalErrors = doc?.validation_summary?.total_errors || 0;
  const totalWarnings = doc?.validation_summary?.total_warnings || 0;
  const flaggedFields = doc?.validation_summary?.flagged_fields || [];
  const imageUrl = getDocumentImageUrl(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
          <p className="text-zinc-400 text-sm">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error && !doc) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/upload')} className="text-blue-400 hover:underline text-sm">
            ← Back to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0A0A0A] pt-16">
        <div className="max-w-[1600px] mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <div className="w-[1px] h-4 bg-white/10" />
              <div>
                <h1 className="font-sora font-bold text-white text-2xl">Review Extraction</h1>
                <p className="text-zinc-500 text-sm mt-0.5">{doc?.original_filename}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <ValidationBadge status={doc?.status} />

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleReextract}
                disabled={reextracting || doc?.status === 'processing'}
                className="flex items-center gap-2 px-4 py-2 border border-white/20 hover:border-white/40 text-white text-xs font-bold tracking-wide uppercase disabled:opacity-40 transition-colors"
                style={{ borderRadius: '2px' }}
              >
                <RefreshCw size={13} className={reextracting ? 'animate-spin' : ''} />
                Re-extract
              </motion.button>

              <motion.button
                data-testid="save-record-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving || doc?.status === 'processing'}
                className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold tracking-widest uppercase disabled:opacity-40 transition-colors"
                style={{ borderRadius: '2px' }}
              >
                {saving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : savedSuccess ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                  >
                    <Check size={13} className="text-green-400" />
                  </motion.div>
                ) : (
                  <Save size={13} />
                )}
                {savedSuccess ? 'Saved!' : 'Save Record'}
              </motion.button>
            </div>
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between gap-3 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6"
                style={{ borderRadius: '2px' }}
              >
                <span className="flex items-center gap-2"><AlertTriangle size={14} />{error}</span>
                <button onClick={() => setError(null)}><X size={14} /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main layout: image + form */}
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left: Document image (sticky) */}
            <div className="lg:col-span-2">
              <div className="sticky top-20">
                <div className="bg-[#121212] border border-white/10 overflow-hidden" style={{ borderRadius: '2px' }}>
                  <div className="p-3 border-b border-white/5 flex items-center justify-between">
                    <span className="text-zinc-400 text-xs font-medium">Document Preview</span>
                    <span className="text-zinc-600 text-xs">{rows.length} rows extracted</span>
                  </div>
                  <div className="relative" style={{ minHeight: '300px' }}>
                    <img
                      src={imageUrl}
                      alt="Document"
                      className="w-full object-contain bg-black/20"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    {doc?.status === 'processing' && (
                      <ScannerBeam active label="Extracting fields" />
                    )}
                  </div>
                </div>

                {/* Validation summary */}
                <div className="mt-4 bg-[#121212] border border-white/10" style={{ borderRadius: '2px' }}>
                  <button
                    onClick={() => setValidationOpen(v => !v)}
                    className="w-full flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3">
                      {totalErrors > 0 ? (
                        <AlertTriangle size={16} className="text-red-400" />
                      ) : (
                        <CheckCircle size={16} className="text-green-400" />
                      )}
                      <span className="text-white text-sm font-medium">Validation Summary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {totalErrors > 0 && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">
                          {totalErrors} errors
                        </span>
                      )}
                      {totalWarnings > 0 && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                          {totalWarnings} warnings
                        </span>
                      )}
                      {validationOpen ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {validationOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/5 p-4 space-y-2 max-h-64 overflow-y-auto">
                          {flaggedFields.length === 0 ? (
                            <div className="flex items-center gap-2 text-green-400 text-xs">
                              <CheckCircle size={12} />
                              All fields pass validation
                            </div>
                          ) : (
                            flaggedFields.map((flag, i) => (
                              <div key={i} className={`flex items-start gap-2 text-xs ${flag.type === 'error' ? 'text-red-400' : 'text-amber-400'}`}>
                                <span className="mt-0.5">{flag.type === 'error' ? '✗' : '⚠'}</span>
                                <div>
                                  <span className="font-medium">Row {flag.s_no} · {flag.field}:</span>
                                  <span className="text-zinc-400 ml-1">{flag.error}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Right: Extraction form table */}
            <div className="lg:col-span-3">
              <div className="bg-[#121212] border border-white/10 overflow-hidden" style={{ borderRadius: '2px' }}>
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-white font-medium text-sm">Extracted Fields</h2>
                  {doc?.status === 'processing' && (
                    <div className="flex items-center gap-2 text-blue-400 text-xs">
                      <Loader2 size={12} className="animate-spin" />
                      Extracting...
                    </div>
                  )}
                </div>

                {doc?.status === 'processing' ? (
                  <div className="p-12 text-center">
                    <Loader2 size={28} className="text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-zinc-400 text-sm">AI is reading your document...</p>
                    <p className="text-zinc-600 text-xs mt-1">This usually takes 2-5 seconds</p>
                  </div>
                ) : rows.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-zinc-400 text-sm">No rows extracted. Try re-extracting or add rows manually.</p>
                    <button
                      onClick={addRow}
                      className="mt-4 text-blue-400 text-xs hover:underline"
                    >
                      + Add a row
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-2 py-3 text-left text-zinc-500 font-medium text-[10px] tracking-wider uppercase w-8">#</th>
                          {FIELD_CONFIG.map(f => (
                            <th key={f.key} className="px-2 py-3 text-left text-zinc-500 font-medium text-[10px] tracking-wider uppercase">
                              {f.label}
                            </th>
                          ))}
                          <th className="px-2 py-3 w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {rows.map((row, rowIndex) => (
                            <motion.tr
                              key={row.s_no || rowIndex}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.3, delay: rowIndex * 0.08 }}
                              className="border-b border-white/5 hover:bg-white/[0.02]"
                            >
                              <td className="px-2 py-2 text-zinc-600 text-[10px] align-top pt-3.5">
                                {row.s_no || rowIndex + 1}
                              </td>
                              {FIELD_CONFIG.map(field => {
                                const fieldData = row[field.key] || {};
                                return (
                                  <FieldCell
                                    key={field.key}
                                    field={field}
                                    rowIndex={rowIndex}
                                    value={fieldData.value ?? ''}
                                    confidence={fieldData.confidence ?? 0}
                                    valid={fieldData.valid ?? true}
                                    errors={fieldData.errors || []}
                                    onChange={handleFieldChange}
                                  />
                                );
                              })}
                              <td className="px-2 py-2 align-top pt-3.5">
                                <button
                                  data-testid="delete-row-btn"
                                  onClick={() => deleteRow(rowIndex)}
                                  className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  style={{ borderRadius: '2px' }}
                                >
                                  <Trash2 size={11} />
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>

                    {/* Add row */}
                    <div className="p-3 border-t border-white/5">
                      <button
                        data-testid="add-row-btn"
                        onClick={addRow}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors py-1 px-2"
                      >
                        <Plus size={12} />
                        Add Row
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              {rows.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-white/5"
                >
                  <span className="text-zinc-600 text-xs">{rows.length} rows · {totalErrors} errors</span>
                  <motion.button
                    data-testid="save-record-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold tracking-widest uppercase disabled:opacity-50 transition-colors"
                    style={{ borderRadius: '2px' }}
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    Save Record
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Review;
