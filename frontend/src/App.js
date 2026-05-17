import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Landing from './pages/Landing';
import Upload from './pages/Upload';
import Review from './pages/Review';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Navbar from './components/Navbar';
import Preloader from './components/Preloader';

// AnimatedRoutes must live inside BrowserRouter to use useLocation
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/review/:id" element={<Review />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [showPreloader, setShowPreloader] = useState(() => {
    // Only show preloader on first visit
    return !localStorage.getItem('docuflow_loaded');
  });

  const handlePreloaderComplete = () => {
    localStorage.setItem('docuflow_loaded', 'true');
    setShowPreloader(false);
  };

  // If preloader is showing, render only the preloader
  if (showPreloader) {
    return (
      <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh' }}>
        <Preloader onComplete={handlePreloaderComplete} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh' }}>
      <BrowserRouter>
        <Navbar />
        <AnimatedRoutes />
      </BrowserRouter>
    </div>
  );
}
