import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, FileText, X, Clock, CheckCircle, AlertTriangle, Loader2, History } from 'lucide-react';
import { uploadDocument, getDocuments, getDocumentImageUrl } from '../utils/api';
import ScannerBeam from '../components/ScannerBeam';
import ValidationBadge from '../components/ValidationBadge';
import PageTransition from '../components/PageTransition';

const UPLOAD_BG = "https://static.prod-images.emergentagent.com/jobs/08ad2695-2098-483f-832a-1beaa83ec83b/images/7bcfc8218ccec02ac9b847810e325300396eb7a1621cba2173d761605185edf2.png";

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const UploadHistoryItem = ({ doc, onClick }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    onClick={onClick}
    className="flex items-center gap-3 p-3 border border-white/5 hover:border-blue-500/30 hover:bg-white/5 cursor-pointer transition-all group"
    style={{ borderRadius: '2px' }}
  >
    {/* Thumbnail */}
    <div className="w-10 h-10 bg-zinc-800 border border-white/10 flex-shrink-0 overflow-hidden" style={{ borderRadius: '2px' }}>
      <img
        src={getDocumentImageUrl(doc.id)}
        alt=""
        className="w-full h-full object-cover"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white text-xs font-medium truncate group-hover:text-blue-300 transition-colors">
        {doc.original_filename}
      </p>
      <p className="text-zinc-600 text-[10px] flex items-center gap-1 mt-0.5">
        <Clock size={9} />
        {formatDate(doc.upload_timestamp)}
      </p>
    </div>
    <ValidationBadge status={doc.status} />
  </motion.div>
);

const UploadPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [extractionStep, setExtractionStep] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadRecentDocs();
  }, []);

  const loadRecentDocs = async () => {
    try {
      const data = await getDocuments(1, 10);
      setRecentDocs(data.documents || []);
    } catch (e) {
      console.error('Failed to load recent docs', e);
    }
  };

  const handleFile = useCallback((f) => {
    setError(null);
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/webp'];
    if (!allowed.includes(f.type)) {
      setError('Only JPG, PNG, PDF, and WebP files are supported');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }
    setFile(f);

    // Generate preview
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview({ type: 'image', url });
    } else {
      setPreview({ type: 'pdf', name: f.name });
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  const handleInputChange = (e) => {
    const selected = e.target.files[0];
    if (selected) handleFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setExtractio(0);
    setError(null);

    // Animate extraction steps
    const stepInterval = setInterval(() => {
      setExtractionStep(prev => Math.min(prev + 1, 8));
    }, 600);

    try {
      const result = await uploadDocument(file, setUploadProgress);
      clearInterval(stepInterval);

      // Poll for completion
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        if (attempts > 15) {
          clearInterval(poll);
          navigate(`/review/${result.id}`);
          return;
        }
        try {
          const { getDocument } = await import('../utils/api');
          const doc = await getDocument(result.id);
          if (doc.status !== 'processing') {
            clearInterval(poll);
            navigate(`/review/${result.id}`);
          }
        } catch {}
      }, 1000);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  // Fix the typo
  const setExtractio = setExtractionStep;

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setExtractionStep(0);
    if (preview?.url) URL.revokeObjectURL(preview.url);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0A0A0A] pt-16">
        {/* Background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <img src={UPLOAD_BG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 to-[#0A0A0A]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="mb-10">
            <div className="text-blue-500 text-xs font-bold tracking-[0.4em] uppercase mb-2">Document Processing</div>
            <h1 className="font-sora text-4xl font-bold text-white">Upload Document</h1>
            <p className="text-zinc-500 mt-2">Drag and drop or browse to upload your machine shop form</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Upload zone - 2 cols */}
            <div className="lg:col-span-2 space-y-6">
              {/* Drop zone */}
              {!file && (
                <motion.div
                  data-testid="upload-dropzone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
                  className={`relative border-2 border-dashed rounded-sm cursor-pointer transition-all duration-300 ${
                    isDragging
                      ? 'border-blue-400 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.4)] upload-glow'
                      : 'border-blue-500/40 hover:border-blue-500/70 bg-[#121212]'
                  }`}
                  style={{ minHeight: '320px', borderRadius: '2px' }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-10">
                    <motion.div
                      animate={isDragging ? { scale: 1.15, y: -5 } : { scale: 1, y: 0 }}
                      className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6"
                      style={{ borderRadius: '2px' }}
                    >
                      <Upload size={32} className="text-blue-400" />
                    </motion.div>
                    <h3 className="font-sora font-bold text-white text-xl mb-2">
                      {isDragging ? 'Drop it here' : 'Drop your document here'}
                    </h3>
                    <p className="text-zinc-500 text-sm mb-4">
                      Supports JPG, PNG, PDF — max 10MB
                    </p>
                    <div className="flex items-center gap-3 text-zinc-600 text-xs">
                      <div className="h-[1px] w-16 bg-zinc-800" />
                      or click to browse
                      <div className="h-[1px] w-16 bg-zinc-800" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* File preview */}
              <AnimatePresence>
                {file && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-[#121212] border border-white/10"
                    style={{ borderRadius: '2px' }}
                  >
                    {/* Preview header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        {preview?.type === 'image' ? (
                          <FileImage size={18} className="text-blue-400" />
                        ) : (
                          <FileText size={18} className="text-amber-400" />
                        )}
                        <div>
                          <p className="text-white text-sm font-medium">{file.name}</p>
                          <p className="text-zinc-500 text-xs">{formatSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={clearFile}
                        disabled={isUploading}
                        className="w-7 h-7 flex items-center justify-center hover:bg-white/10 transition-colors text-zinc-500 hover:text-white"
                        style={{ borderRadius: '2px' }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Image preview */}
                    <div className="relative">
                      {preview?.type === 'image' ? (
                        <div className="relative h-64 overflow-hidden" style={{ borderRadius: '0 0 2px 2px' }}>
                          <img
                            src={preview.url}
                            alt="Preview"
                            className="w-full h-full object-contain bg-black/40"
                          />
                          <ScannerBeam
                            active={isUploading}
                            label={`Extracting fields${extractionStep > 0 ? ` — ${extractionStep}/8 complete` : ''}`}
                          />
                        </div>
                      ) : (
                        <div className="h-40 flex items-center justify-center bg-zinc-900/50 relative">
                          <FileText size={48} className="text-amber-400/60" />
                          <p className="absolute bottom-4 text-zinc-500 text-xs">PDF Document</p>
                          <ScannerBeam active={isUploading} label="Extracting fields" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                    style={{ borderRadius: '2px' }}
                  >
                    <AlertTriangle size={16} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload button */}
              <div className="flex items-center gap-4">
                <motion.button
                  data-testid="upload-submit-btn"
                  whileHover={!isUploading && file ? { scale: 1.02 } : {}}
                  whileTap={!isUploading && file ? { scale: 0.97 } : {}}
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 font-bold tracking-widest uppercase text-sm transition-all ${
                    file && !isUploading
                      ? 'bg-blue-500 hover:bg-blue-400 text-white cursor-pointer'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>
                        {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Extracting...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Extract Data
                    </>
                  )}
                </motion.button>

                {!file && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-4 border border-white/20 hover:border-white/40 text-white text-sm font-medium transition-colors"
                    style={{ borderRadius: '2px' }}
                  >
                    Browse Files
                  </motion.button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf,image/webp"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>

            {/* History sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-[#121212] border border-white/10" style={{ borderRadius: '2px' }}>
                <div className="flex items-center gap-3 p-4 border-b border-white/5">
                  <History size={16} className="text-zinc-400" />
                  <h3 className="font-medium text-white text-sm">Recent Uploads</h3>
                  <span className="ml-auto text-zinc-600 text-xs">{recentDocs.length} records</span>
                </div>
                <div className="p-3 space-y-2 max-h-[520px] overflow-y-auto">
                  {recentDocs.length === 0 ? (
                    <div className="text-center py-10 text-zinc-600">
                      <Upload size={28} className="mx-auto mb-3 opacity-30" />
                      <p className="text-xs">No uploads yet</p>
                    </div>
                  ) : (
                    recentDocs.map((doc, i) => (
                      <UploadHistoryItem
                        key={doc.id}
                        doc={doc}
                        onClick={() => navigate(`/review/${doc.id}`)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Tips */}
              <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/20" style={{ borderRadius: '2px' }}>
                <h4 className="text-blue-400 text-xs font-bold tracking-wide uppercase mb-3">Upload Tips</h4>
                <ul className="space-y-2 text-zinc-500 text-xs">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={10} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    Use good lighting for handwritten documents
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={10} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    Ensure all columns are visible and unobstructed
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={10} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    Higher resolution images yield better accuracy
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default UploadPage;
