import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  CheckCircle2,
  ArrowRight,
  Server,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Clock,
  ShieldCheck,
  Building2,
  Sprout,
  Truck,
  CreditCard,
  Microscope,
  Sliders,
  Activity,
  ChevronRight,
  TrendingUp,
  MapPin
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // If user is already authenticated, redirect to their role-specific primary dashboard
  if (isAuthenticated && user) {
    const role = user.role === 'ADMIN' ? 'SYSTEM_ADMIN' : user.role;
    if (role === 'CENTRE_MANAGER' || role === 'PROCUREMENT_OFFICER') {
      return <Navigate to="/centre" replace />;
    } else if (role === 'FARMER') {
      return <Navigate to="/farmer/bookings" replace />;
    } else if (role === 'SYSTEM_ADMIN' || role === 'DISTRICT_ADMIN') {
      return <Navigate to="/intelligence/admin" replace />;
    }
  }

  // Interactive Ecosystem Hub State
  const [activeNode, setActiveNode] = useState<number>(0);

  // Interactive Live Simulator State
  const [quantity, setQuantity] = useState<number>(45);
  const [selectedMandi, setSelectedMandi] = useState<string>("Karnal Central Procurement Yard");

  // Interactive Stakeholder Tab State
  const [activeTab, setActiveTab] = useState<'FARMER' | 'OFFICER' | 'ADMIN'>('FARMER');

  // Ecosystem Node Details
  const ecosystemNodes = [
    {
      id: 0,
      title: t('bookings'),
      icon: Sprout,
      color: "from-emerald-500 to-teal-600",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: t('selectLanguageDesc'),
      metrics: [
        { label: "Verified Farmers", val: "1,24,500+" },
        { label: "AI Accuracy", val: "98.7%" },
        { label: "Registration Speed", val: "< 2 mins" }
      ],
      actionText: t('bookings'),
      actionPath: "/farmer/bookings"
    },
    {
      id: 1,
      title: t('tokenQueue'),
      icon: Building2,
      color: "from-[#0d6e48] to-emerald-700",
      badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      description: t('offlineNotice'),
      metrics: [
        { label: "Active Centres", val: "342 Mandis" },
        { label: "Wait Reduction", val: "68%" },
        { label: "Avg Mandi Load", val: "42%" }
      ],
      actionText: t('tokenQueue'),
      actionPath: "/centre/queue"
    },
    {
      id: 2,
      title: t('intelligence'),
      icon: Microscope,
      color: "from-amber-500 to-[#0d6e48]",
      badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
      description: t('speakTokenInfo'),
      metrics: [
        { label: "Moisture Precision", val: "± 0.1%" },
        { label: "Weighment Speed", val: "45 secs" },
        { label: "Grade Accuracy", val: "99.9%" }
      ],
      actionText: t('intelligence'),
      actionPath: "/intelligence/farmer"
    },
    {
      id: 3,
      title: t('offlineOps'),
      icon: Truck,
      color: "from-blue-600 to-indigo-700",
      badgeBg: "bg-blue-50 text-blue-800 border-blue-200",
      description: t('offlineTitle'),
      metrics: [
        { label: "Daily Grain Transit", val: "18,400 MT" },
        { label: "Logistics Tracking", val: "Live GPS" },
        { label: "Silo Capacity", val: "84% Opt" }
      ],
      actionText: t('offlineOps'),
      actionPath: "/intelligence/staff"
    },
    {
      id: 4,
      title: t('payments'),
      icon: CreditCard,
      color: "from-purple-600 to-[#0d6e48]",
      badgeBg: "bg-purple-50 text-purple-800 border-purple-200",
      description: t('amountCredited'),
      metrics: [
        { label: "Disbursed Amount", val: "₹ 482 Cr+" },
        { label: "Payout SLA", val: "Same Day" },
        { label: "Success Rate", val: "99.8%" }
      ],
      actionText: t('payments'),
      actionPath: "/payments"
    }
  ];

  const steps = [
    { title: t('farmerWelcome'), desc: "Identity & MSP Verification" },
    { title: t('intelligence'), desc: "AI crop & slot guide" },
    { title: t('bookings'), desc: "Slot reservation" },
    { title: t('tokenNumber'), desc: "QR code token ticket" },
    { title: t('tokenQueue'), desc: "Live wait management" },
    { title: t('procurement'), desc: "Weighment & moisture test" },
    { title: t('payments'), desc: "Automated DBT transfer" },
    { title: t('online'), desc: "Real-time transparent updates" },
  ];

  // Interactive Live Simulator calculations
  const calculateWaitTime = () => {
    const baseWait = Math.round(10 + (quantity * 0.15));
    const savedTime = Math.round(baseWait * 2.1);
    return { wait: baseWait, saved: savedTime };
  };

  const { wait, saved } = calculateWaitTime();

  return (
    <div className="space-y-20 pb-16 font-sans">
      
      {/* Top Colorful Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-amber-500 via-blue-500 to-rose-500 rounded-full shadow-sm" />

      {/* HERO SECTION */}
      <section className="relative pt-2 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline & Action CTA */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* SIH Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e6f7ef] border border-[#b2e8cf] text-[#0d6e48] text-xs font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('appName')} • {t('appSubtitle')}</span>
            </div>

            {/* Main Serif Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif-header text-slate-900 tracking-tight leading-[1.15]">
              {t('appName')}<br />
              <span className="text-[#0d6e48]">{t('tokenQueue')}</span><br />
              {t('payments')}
            </h1>

            {/* Paragraph Subtitle */}
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl font-normal">
              {t('selectLanguageDesc')}
            </p>

            {/* CTA Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/farmer/bookings"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#0d6e48] hover:bg-[#095235] text-white text-sm font-semibold rounded-2xl transition shadow-lg shadow-emerald-950/10 hover:shadow-xl hover:translate-y-[-1px]"
              >
                <span>{t('bookings')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/centre/queue"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#e6f7ef] hover:bg-[#d1f2e2] text-[#0d6e48] border border-[#b2e8cf] text-sm font-semibold rounded-2xl transition"
              >
                <span>{t('tokenQueue')}</span>
              </Link>
            </div>

            {/* Checkmarks Footer List */}
            <div className="pt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="text-[#0d6e48]">✓</span>
                <span>{t('online')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#0d6e48]">✓</span>
                <span>{t('estimatedWait')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#0d6e48]">✓</span>
                <span>{t('payments')}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Centre Intelligence Mockup Card */}
          <div className="lg:col-span-5 relative">
            
            {/* Top Floating Badge: Time Saved */}
            <div className="absolute -top-6 -right-2 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-100 shadow-lg flex items-center gap-3 animate-bounce-subtle">
              <div className="text-right">
                <div className="text-emerald-700 text-sm font-extrabold font-serif-header">-26 min</div>
                <div className="text-[10px] text-slate-500 font-medium">{t('estimatedWait')}</div>
              </div>
            </div>

            {/* Bottom Floating Badge: Performance Score */}
            <div className="absolute -bottom-6 -left-4 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-100 shadow-lg flex items-center gap-3">
              <div>
                <div className="text-[#0d6e48] text-sm font-extrabold font-serif-header">92/100</div>
                <div className="text-[10px] text-slate-500 font-medium">{t('centreStatus')}</div>
              </div>
            </div>

            {/* Main Widget Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 space-y-5 relative z-10">
              
              {/* Widget Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-sm font-bold text-slate-900">{t('intelligence')}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#e6f7ef] text-[#0d6e48] text-[10px] font-bold tracking-wider">
                  OPTIMAL
                </span>
              </div>

              {/* 3 Metric Column Cards */}
              <div className="grid grid-cols-3 gap-3 text-center bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('tokenNumber')}</div>
                  <div className="text-xl font-bold font-serif-header text-slate-900">06</div>
                  <div className="text-[9px] text-slate-500 font-medium">farmers ahead</div>
                </div>

                <div className="space-y-0.5 border-x border-slate-200 px-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ETA</div>
                  <div className="text-xl font-bold font-serif-header text-slate-900">17 <span className="text-xs font-normal">min</span></div>
                  <div className="text-[9px] text-slate-500 font-medium">{t('estimatedWait')}</div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LOAD</div>
                  <div className="text-xl font-bold font-serif-header text-slate-900">34 <span className="text-xs font-normal">%</span></div>
                  <div className="text-[9px] text-slate-500 font-medium">{t('centreStatus')}</div>
                </div>
              </div>

              {/* Live Queue Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs">
                  <span className="px-2 py-0.5 bg-[#0d6e48] text-white text-[10px] font-bold rounded-md">T-024</span>
                  <span className="font-semibold text-slate-800">{t('tokenNumber')}</span>
                  <span className="text-slate-500 font-mono text-[11px]">11:42 AM</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs">
                  <span className="font-bold text-[#0d6e48] text-[11px]">T-025</span>
                  <span className="text-slate-600">35 q</span>
                  <span className="text-slate-400 font-mono text-[11px]">11:57 AM</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs">
                  <span className="font-bold text-[#0d6e48] text-[11px]">T-026</span>
                  <span className="text-slate-600">18 q</span>
                  <span className="text-slate-400 font-mono text-[11px]">12:06 PM</span>
                </div>
              </div>

              {/* Recommendation Banner */}
              <div className="p-3 bg-[#e6f7ef] rounded-2xl border border-[#b2e8cf] text-xs space-y-0.5">
                <div className="font-bold text-[#0d6e48] text-[11px]">{t('intelligence')}</div>
                <div className="text-slate-700 text-[11px]">{t('estimatedWait')}</div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* INTERACTIVE ECOSYSTEM HUB SECTION */}
      <section className="pt-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Heading & Node Tabs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-bold font-serif-header text-slate-900 leading-tight">
                {t('farmerWelcome')}
              </h2>
              {/* Colorful underline accent */}
              <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 via-amber-500 to-indigo-500 rounded-full" />
            </div>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {t('selectLanguageDesc')}
            </p>

            {/* Interactive Node Selector List */}
            <div className="space-y-2 pt-2">
              {ecosystemNodes.map((node, index) => {
                const Icon = node.icon;
                const isSelected = activeNode === index;
                return (
                  <button
                    key={node.id}
                    onClick={() => setActiveNode(index)}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-center justify-between border ${
                      isSelected
                        ? "bg-white border-[#0d6e48] shadow-md text-slate-900"
                        : "bg-white/50 border-slate-200/70 hover:bg-white text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-colors ${
                        isSelected ? "bg-[#0d6e48] text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{node.title}</div>
                        <div className="text-[11px] text-slate-500 font-medium hidden sm:block">Step 0{index + 1}</div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "translate-x-1 text-[#0d6e48]" : "text-slate-400"}`} />
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <Link
                to="/farmer/bookings"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold text-xs rounded-full shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                <span>{t('confirmLanguage')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Diagram Canvas */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 space-y-6 relative overflow-hidden">
              
              {/* Active Node Header Banner */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0d6e48] text-white flex items-center justify-center shadow-lg shadow-emerald-950/20">
                    {React.createElement(ecosystemNodes[activeNode].icon, { className: "w-6 h-6" })}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">STAGE 0{activeNode + 1}</span>
                    <h3 className="text-lg font-bold font-serif-header text-slate-900">{ecosystemNodes[activeNode].title}</h3>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ecosystemNodes[activeNode].badgeBg}`}>
                  ACTIVE
                </span>
              </div>

              {/* Node Description */}
              <p className="text-slate-600 text-sm leading-relaxed font-normal">
                {ecosystemNodes[activeNode].description}
              </p>

              {/* Metric Highlights Grid */}
              <div className="grid grid-cols-3 gap-4 bg-[#f4fbf7] p-4 rounded-2xl border border-emerald-100">
                {ecosystemNodes[activeNode].metrics.map((m, idx) => (
                  <div key={idx} className="text-center space-y-1">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.label}</div>
                    <div className="text-lg sm:text-xl font-bold font-serif-header text-[#0d6e48]">{m.val}</div>
                  </div>
                ))}
              </div>

              {/* Interactive Visual Network Diagram */}
              <div className="pt-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Map</div>
                <div className="grid grid-cols-5 gap-2 text-center relative">
                  {ecosystemNodes.map((n, i) => {
                    const NIcon = n.icon;
                    const isActive = i === activeNode;
                    return (
                      <div
                        key={n.id}
                        onClick={() => setActiveNode(i)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col items-center gap-2 ${
                          isActive
                            ? "bg-[#0d6e48] text-white border-[#0d6e48] shadow-lg scale-105"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200"
                        }`}
                      >
                        <NIcon className="w-5 h-5" />
                        <span className="text-[10px] font-bold leading-tight line-clamp-1">{n.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <Link
                  to={ecosystemNodes[activeNode].actionPath}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0d6e48] hover:bg-[#095235] text-white text-xs font-bold rounded-xl transition"
                >
                  <span>{ecosystemNodes[activeNode].actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* INTERACTIVE SLOT & WAITING TIME SIMULATOR */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 uppercase tracking-wider mb-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>{t('estimatedWait')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-header text-slate-900">
              {t('estimatedWait')}
            </h2>
          </div>
          <div className="text-xs text-slate-500 max-w-xs font-medium">
            {t('selectLanguageDesc')}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Controls Input Side */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Quantity Slider */}
            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/70">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Produce Quantity (Quintals)
                </label>
                <span className="text-lg font-bold font-serif-header text-[#0d6e48] px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-200">
                  {quantity} Quintals
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0d6e48]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>10 q</span>
                <span>100 q</span>
                <span>200 q</span>
              </div>
            </div>

            {/* Target Mandi Select */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t('centreStatus')}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <select
                  value={selectedMandi}
                  onChange={(e) => setSelectedMandi(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#0d6e48] outline-none transition-all"
                >
                  <option value="Karnal Central Procurement Yard">Karnal Central Procurement Yard</option>
                  <option value="Ludhiana Grain Mandi Hub">Ludhiana Grain Mandi Hub</option>
                  <option value="Indore MSP Yard">Indore MSP Yard</option>
                  <option value="Bathinda Agri Yard">Bathinda Agri Yard</option>
                </select>
              </div>
            </div>

          </div>

          {/* Output Results Card Side */}
          <div className="lg:col-span-6">
            <div className="bg-[#f4fbf7] p-6 rounded-2xl border border-emerald-200 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">{t('tokenNumber')}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">CONFIRMED</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{t('estimatedWait')}</div>
                  <div className="text-2xl font-bold font-serif-header text-slate-900 mt-1">{wait} <span className="text-xs font-normal">mins</span></div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-1">✓ Fast-Track</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Saved Time</div>
                  <div className="text-2xl font-bold font-serif-header text-[#0d6e48] mt-1">-{saved} <span className="text-xs font-normal">mins</span></div>
                  <div className="text-[10px] text-[#0d6e48] font-semibold mt-1">vs Queue</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-500 font-medium">{t('centreStatus')}:</div>
                  <div className="font-bold text-slate-900">{selectedMandi}</div>
                </div>
                <Link
                  to="/farmer/bookings"
                  className="px-4 py-2 bg-[#0d6e48] hover:bg-[#095235] text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {t('bookings')} →
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* STAKEHOLDER SOLUTIONS TABS */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-3xl font-bold font-serif-header text-slate-900">{t('farmerWelcome')}</h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">{t('selectLanguageDesc')}</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center gap-2 max-w-md mx-auto p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('FARMER')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'FARMER' ? 'bg-[#0d6e48] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('farmerWelcome')}
          </button>
          <button
            onClick={() => setActiveTab('OFFICER')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'OFFICER' ? 'bg-[#0d6e48] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('procurement')}
          </button>
          <button
            onClick={() => setActiveTab('ADMIN')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'ADMIN' ? 'bg-[#0d6e48] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('appName')} Admin
          </button>
        </div>

        {/* Tab Content Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {activeTab === 'FARMER' && (
            <>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <Sprout className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">{t('bookings')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t('selectLanguageDesc')}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">{t('estimatedWait')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t('tokenQueue')}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">{t('payments')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t('amountCredited')}</p>
              </div>
            </>
          )}

          {activeTab === 'OFFICER' && (
            <>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">{t('tokenNumber')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t('offlineCheckinBtn')}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">{t('centreStatus')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t('offlineNotice')}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">{t('offlineOps')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t('syncSuccess')}</p>
              </div>
            </>
          )}

          {activeTab === 'ADMIN' && (
            <>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">{t('intelligence')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t('procurement')}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">{t('intelligence')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t('estimatedWait')}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">{t('syncConflicts')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t('syncConflictsFound')}</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* END-TO-END PRODUCT JOURNEY */}
      <section className="space-y-6 pt-6 border-t border-slate-200/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-serif-header text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-[#0d6e48]" />
              {t('procurement')}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              8-step transparent workflow from farmer identity to automated DBT payment
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {steps.map((step, idx) => (
            <div
              key={step.title}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <span className="text-xs font-mono text-[#0d6e48] font-bold mb-3">
                0{idx + 1}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-snug">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ARCHITECTURAL STATUS CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">Backend Infrastructure</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Express API Router (`/api/v1`)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Zod Environment Validation</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Standardized Error & Logging</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Correlation Request Tracking</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">PostgreSQL Database</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>PostgreSQL 16 Schema Integrated</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Neon.tech Cloud Database Sync</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Seed & Migration Runners</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Concurrency & Lock Controls</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">Frontend Architecture</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>React 18 + Vite + TypeScript</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>TanStack Query State Engine</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Light Mint UI Design System</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Global Error Boundary Shell</span>
            </li>
          </ul>
        </div>

      </section>
    </div>
  );
};
