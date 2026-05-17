import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Upload, Brain, CheckSquare, BarChart3, Zap, FileText, ShieldCheck } from 'lucide-react';
import MarqueeSection from '../components/Marquee';
import WaveDivider, { WaveDividerTop } from '../components/WaveDivider';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import useCountUp from '../hooks/useCountUp';
import PageTransition from '../components/PageTransition';

// IMAGES
const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/08ad2695-2098-483f-832a-1beaa83ec83b/images/c29887ffa24e0df3c723dd3d47925e1f0629e73d1704c15b6e44f8b6f4504547.png";
const UPLOAD_BG = "https://static.prod-images.emergentagent.com/jobs/08ad2695-2098-483f-832a-1beaa83ec83b/images/7bcfc8218ccec02ac9b847810e325300396eb7a1621cba2173d761605185edf2.png";
const EXTRACT_IMG = "https://static.prod-images.emergentagent.com/jobs/08ad2695-2098-483f-832a-1beaa83ec83b/images/9432c46cefc8d4a70f2161e04b750c11c33d4f18108d91589cd4241b767cf0de.png";
const BLUEPRINT_IMG = "https://images.unsplash.com/photo-1721244654392-9c912a6eb236?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODR8MHwxfHNlYXJjaHwyfHx0ZWNobmljYWwlMjBkb2N1bWVudCUyMGJsdWVwcmludCUyMGJsdWVwcmludHxlbnwwfHx8fDE3NzkwMzQ5MzF8MA&ixlib=rb-4.1.0&q=85";
const WORKER_IMG = "https://images.unsplash.com/photo-1730584476141-232435a40c32?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwzfHxtYWNoaW5lJTIwc2hvcCUyMG1hbnVmYWN0dXJpbmd8ZW58MHx8fHwxNzc5MDM0OTMxfDA&ixlib=rb-4.1.0&q=85";

// Stat counter item
const StatItem = ({ label, value, suffix = '', decimals = 0, prefix = '', delay = 0 }) => {
  const [ref, isVisible] = useIntersectionObserver();
  const num = parseFloat(value) || 0;
  const count = useCountUp(num, 1800, isVisible);
  const display = decimals > 0 ? count.toFixed(decimals) : count.toLocaleString();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <div className="font-sora text-5xl lg:text-6xl font-black text-white leading-none mb-2">
        {prefix}{display}<span className="text-blue-500">{suffix}</span>
      </div>
      <div className="text-sm text-zinc-400 tracking-wide">{label}</div>
    </motion.div>
  );
};

// Feature card
const FeatureCard = ({ icon: Icon, title, desc, image, delay = 0, direction = 'left' }) => {
  const [ref, isVisible] = useIntersectionObserver();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: direction === 'left' ? -40 : 40 }}
      animate={isVisible ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#121212] border border-white/10 overflow-hidden card-hover"
      style={{ borderRadius: '2px' }}
    >
      {image && (
        <div className="h-48 overflow-hidden relative">
          <img src={image} alt={title} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent" />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center" style={{ borderRadius: '2px' }}>
            <Icon size={18} className="text-blue-400" />
          </div>
          <h3 className="font-sora font-bold text-white text-lg">{title}</h3>
        </div>
        <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
};

// Timeline step
const TimelineStep = ({ icon, title, desc, step, isLast, delay = 0 }) => {
  const [ref, isVisible] = useIntersectionObserver();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center relative"
    >
      {/* Node */}
      <div className="relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={isVisible ? { scale: 1 } : {}}
          transition={{ type: 'spring', delay: delay + 0.2, damping: 12 }}
          className="w-16 h-16 bg-[#121212] border-2 border-blue-500 flex items-center justify-center text-2xl mb-4"
          style={{ borderRadius: '2px' }}
        >
          {icon}
        </motion.div>
        <div className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-1">Step {step}</div>
        <div className="font-sora font-bold text-white mb-2">{title}</div>
        <p className="text-zinc-500 text-xs leading-relaxed max-w-[140px]">{desc}</p>
      </div>

      {/* Connector line */}
      {!isLast && (
        <motion.div
          className="hidden lg:block absolute top-8 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-[2px] bg-gradient-to-r from-blue-500 to-blue-500/20"
          initial={{ scaleX: 0, originX: 0 }}
          animate={isVisible ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: delay + 0.4 }}
        />
      )}
    </motion.div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 800], ['0%', '30%']);

  const heroWords = ['UPLOAD.', 'EXTRACT.', 'REVIEW.'];

  return (
    <PageTransition>
      <div className="bg-[#0A0A0A] min-h-screen overflow-hidden">

        {/* HERO */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden" ref={heroRef}>
          {/* Parallax BG */}
          <motion.div
            className="absolute inset-0 will-change-transform"
            style={{ y: bgY }}
          >
            <img
              src={HERO_BG}
              alt="Hero"
              className="w-full h-[120%] object-cover"
              style={{ objectPosition: 'center' }}
            />
            <div className="absolute inset-0 bg-black/60" />
          </motion.div>

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)',
              backgroundSize: '80px 80px'
            }}
          />

          {/* Hero content */}
          <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-widest uppercase mb-8"
              style={{ borderRadius: '2px' }}
            >
              <Zap size={10} className="text-blue-400" fill="currentColor" />
              AI-Powered Manufacturing Intelligence
            </motion.div>

            {/* Words staggered */}
            <div className="mb-8">
              {heroWords.map((word, i) => (
                <motion.div
                  key={word}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: 0.2 + i * 0.15,
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="block font-sora font-black uppercase leading-[0.9] tracking-tighter text-white"
                  style={{ fontSize: 'clamp(3.5rem, 10vw, 8rem)' }}
                >
                  {word}
                </motion.div>
              ))}
            </div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-zinc-400 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
            >
              AI-powered digitization for manufacturing workflows.
              Transform handwritten machine shop records into structured, searchable data.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.9, damping: 12 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, brightness: 1.1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/upload')}
                className="flex items-center gap-3 px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold tracking-widest uppercase text-sm transition-colors"
                style={{ borderRadius: '2px' }}
              >
                <Upload size={16} />
                Start Uploading
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-3 px-8 py-4 border border-white/30 hover:border-white/60 text-white font-bold tracking-widest uppercase text-sm transition-colors"
                style={{ borderRadius: '2px' }}
              >
                <BarChart3 size={16} />
                View Dashboard
              </motion.button>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
              <div className="text-zinc-600 text-xs tracking-widest uppercase">Scroll</div>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-[1px] h-8 bg-gradient-to-b from-zinc-600 to-transparent"
              />
            </motion.div>
          </div>
        </section>

        {/* MARQUEE */}
        <MarqueeSection />

        {/* FEATURES */}
        <section className="py-24 px-6 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-blue-500 text-xs font-bold tracking-[0.4em] uppercase mb-4">How It Works</div>
                <h2 className="font-sora text-4xl lg:text-5xl font-bold text-white tracking-tight">
                  Three Steps to Digital Records
                </h2>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                icon={Upload}
                title="Upload Document"
                desc="Drag and drop your handwritten machine shop documents. Supports JPG, PNG, and PDF formats up to 10MB."
                direction="left"
                delay={0}
              />
              <FeatureCard
                icon={Brain}
                title="AI Extract"
                desc="Gemini Vision AI reads every field with confidence scoring. Handles crossed-out values, ambiguous handwriting, and multi-row tables."
                image={EXTRACT_IMG}
                direction="left"
                delay={0.1}
              />
              <FeatureCard
                icon={CheckSquare}
                title="Review & Validate"
                desc="Edit, validate, and approve extracted data before saving. Color-coded confidence bars highlight uncertain fields."
                direction="right"
                delay={0.2}
              />
            </div>
          </div>
        </section>

        <WaveDivider />

        {/* WORKFLOW TIMELINE */}
        <section className="py-24 px-6 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-blue-500 text-xs font-bold tracking-[0.4em] uppercase mb-4">Workflow</div>
                <h2 className="font-sora text-4xl lg:text-5xl font-bold text-white tracking-tight">
                  From Paper to Database
                </h2>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 relative">
              <TimelineStep icon="📤" title="Upload" desc="Drop or browse your handwritten form" step={1} delay={0} />
              <TimelineStep icon="🤖" title="Extract" desc="AI reads and structures every field" step={2} delay={0.15} />
              <TimelineStep icon="✅" title="Review" desc="Validate and correct any flagged fields" step={3} delay={0.3} />
              <TimelineStep icon="📊" title="Analyze" desc="Explore dashboards and search history" step={4} isLast delay={0.45} />
            </div>
          </div>
        </section>

        <WaveDivider flip />

        {/* STATS */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
              <StatItem value={10000} suffix="+" label="Documents Processed" delay={0} />
              <StatItem value={98} suffix="%" label="Extraction Accuracy" delay={0.1} />
              <StatItem value={3} label="Shifts Tracked" delay={0.2} />
              <StatItem value={1.8} suffix="s" decimals={1} label="Avg Processing Time" delay={0.3} />
            </div>
          </div>
        </section>

        <WaveDivider />

        {/* MACHINE SHOP SECTION */}
        <section className="py-24 px-6 bg-[#0C0C0C]">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left text */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="text-blue-500 text-xs font-bold tracking-[0.4em] uppercase mb-4">Industrial Intelligence</div>
                <h2 className="font-sora text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6">
                  Built for the<br />Shop Floor
                </h2>
                <p className="text-zinc-400 leading-relaxed mb-6">
                  DocuFlow AI was designed specifically for manufacturing environments.
                  Our extraction engine understands machine shop shorthand, crossed-out corrections,
                  and multi-shift handwriting variations.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: ShieldCheck, text: 'Validates against known machine number formats (MC-XXX, ABC-XXX)' },
                    { icon: FileText, text: 'Detects duplicate work orders and cross-shift conflicts' },
                    { icon: Zap, text: 'Processes documents in under 2 seconds with Gemini Flash' },
                  ].map(({ icon: Icon, text }, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderRadius: '2px' }}>
                        <Icon size={14} className="text-blue-400" />
                      </div>
                      <span className="text-zinc-300 text-sm leading-relaxed">{text}</span>
                    </div>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/upload')}
                  className="mt-8 flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold tracking-widest uppercase transition-colors"
                  style={{ borderRadius: '2px' }}
                >
                  Get Started <ArrowRight size={14} />
                </motion.button>
              </motion.div>

              {/* Right image */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <div className="absolute inset-0 bg-blue-500/10 border border-blue-500/20 translate-x-4 translate-y-4 -z-10" style={{ borderRadius: '2px' }} />
                <img
                  src={WORKER_IMG}
                  alt="Machine shop worker"
                  className="w-full h-96 object-cover"
                  style={{ borderRadius: '2px', filter: 'grayscale(20%)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C]/60 to-transparent" style={{ borderRadius: '2px' }} />

                {/* Blueprint mockup overlay */}
                <div className="absolute -bottom-4 -left-4 w-32 h-24 border border-blue-500/30 overflow-hidden" style={{ borderRadius: '2px' }}>
                  <img src={BLUEPRINT_IMG} alt="Blueprint" className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 bg-blue-900/60" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <WaveDivider flip />

        {/* SECOND MARQUEE */}
        <MarqueeSection />

        {/* CTA BANNER */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-[#0A0A0A] to-[#0A0A0A]" />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }}
          />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-blue-500 text-xs font-bold tracking-[0.4em] uppercase mb-4">Ready to Start?</div>
              <h2 className="font-sora text-5xl lg:text-7xl font-black text-white tracking-tight uppercase mb-6">
                Digitize Your<br /><span className="text-blue-500">Operations</span>
              </h2>
              <p className="text-zinc-400 mb-10 max-w-xl mx-auto">
                Join manufacturing teams already using DocuFlow AI to eliminate manual data entry and reduce errors by 98%.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/upload')}
                className="inline-flex items-center gap-3 px-10 py-5 bg-blue-500 hover:bg-blue-400 text-white font-black tracking-widest uppercase text-sm transition-colors"
                style={{ borderRadius: '2px' }}
              >
                <Zap size={16} fill="currentColor" />
                Start Now — Free
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/5 py-10 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500/10 border border-blue-500/30 flex items-center justify-center" style={{ borderRadius: '2px' }}>
                <Zap size={10} className="text-blue-500" />
              </div>
              <span className="font-sora font-bold text-white text-sm">
                DocuFlow <span className="text-blue-500">AI</span>
              </span>
            </div>
            <p className="text-zinc-600 text-xs tracking-wide">
              AI-powered digitization for manufacturing workflows
            </p>
            <p className="text-zinc-700 text-xs">
              © {new Date().getFullYear()} DocuFlow AI. All rights reserved.
            </p>
          </div>
        </footer>

      </div>
    </PageTransition>
  );
};

export default Landing;
