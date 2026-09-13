import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ArrowRight,
  Server,
  Database,
  Cpu,
  Layers,
  Sparkles,
  TrendingDown,
  Clock,
  Users,
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

export const HomePage: React.FC = () => {
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
      title: "Farmer & Crop Declaration",
      icon: Sprout,
      color: "from-emerald-500 to-teal-600",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "Farmers declare crop varieties, estimated yield, and select preferred procurement dates with AI-assisted slot guidance.",
      metrics: [
        { label: "Verified Farmers", val: "1,24,500+" },
        { label: "AI Accuracy", val: "98.7%" },
        { label: "Registration Speed", val: "< 2 mins" }
      ],
      actionText: "Register as Farmer",
      actionPath: "/register"
    },
    {
      id: 1,
      title: "Smart Mandi & Queue Balancing",
      icon: Building2,
      color: "from-[#0d6e48] to-emerald-700",
      badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      description: "Procurement centres dynamically balance capacity, prevent congestion, and issue cryptographic token tickets.",
      metrics: [
        { label: "Active Centres", val: "342 Mandis" },
        { label: "Wait Reduction", val: "68%" },
        { label: "Avg Mandi Load", val: "42%" }
      ],
      actionText: "Explore Mandi Centres",
      actionPath: "/centres"
    },
    {
      id: 2,
      title: "Quality & Moisture Testing",
      icon: Microscope,
      color: "from-amber-500 to-[#0d6e48]",
      badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
      description: "Real-time automated weighbridge integration and digital quality testing log moisture levels and grade certificates.",
      metrics: [
        { label: "Moisture Precision", val: "± 0.1%" },
        { label: "Weighment Speed", val: "45 secs" },
        { label: "Grade Accuracy", val: "99.9%" }
      ],
      actionText: "View Traceability",
      actionPath: "/intelligence/farmer"
    },
    {
      id: 3,
      title: "Logistics & Storage Hub",
      icon: Truck,
      color: "from-blue-600 to-indigo-700",
      badgeBg: "bg-blue-50 text-blue-800 border-blue-200",
      description: "Automated dispatch triggers coordinate truck loading, silo storage allocation, and warehouse capacity tracking.",
      metrics: [
        { label: "Daily Grain Transit", val: "18,400 MT" },
        { label: "Logistics Tracking", val: "Live GPS" },
        { label: "Silo Capacity", val: "84% Opt" }
      ],
      actionText: "Check Operations",
      actionPath: "/intelligence/staff"
    },
    {
      id: 4,
      title: "Instant DBT Payouts",
      icon: CreditCard,
      color: "from-purple-600 to-[#0d6e48]",
      badgeBg: "bg-purple-50 text-purple-800 border-purple-200",
      description: "Direct Benefit Transfer (DBT) delivers funds directly to verified farmer bank accounts upon batch approval.",
      metrics: [
        { label: "Disbursed Amount", val: "₹ 482 Cr+" },
        { label: "Payout SLA", val: "Same Day" },
        { label: "Success Rate", val: "99.8%" }
      ],
      actionText: "View DBT Payouts",
      actionPath: "/payments"
    }
  ];

  const steps = [
    { title: "Register", desc: "Farmer identity verification" },
    { title: "Recommend", desc: "AI crop & slot guide" },
    { title: "Slot", desc: "Concurrency reservation" },
    { title: "Token", desc: "Cryptographic QR code" },
    { title: "Queue", desc: "Priority wait management" },
    { title: "Procurement", desc: "Weighment & quality test" },
    { title: "Payment", desc: "Automated DBT transfer" },
    { title: "Tracking", desc: "End-to-end transparency" },
  ];

  // Interactive Live Simulator calculations
  const calculateWaitTime = () => {
    const baseWait = Math.round(10 + (quantity * 0.15));
    const savedTime = Math.round(baseWait * 2.1);
    return { wait: baseWait, saved: savedTime };
  };

  const { wait, saved } = calculateWaitTime();

  return (
    <div className="space-y-20 pb-16">
      
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
              <span>SIH 26032 • DEMO MODE READY</span>
            </div>

            {/* Main Serif Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif-header text-slate-900 tracking-tight leading-[1.15]">
              Smart Procurement.<br />
              <span className="text-[#0d6e48]">Less Waiting.</span><br />
              Better Service.
            </h1>

            {/* Paragraph Subtitle */}
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl font-normal">
              An intelligent procurement management platform that predicts congestion,
              optimizes farmer slots and helps procurement centres coordinate queues efficiently.
            </p>

            {/* CTA Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#0d6e48] hover:bg-[#095235] text-white text-sm font-semibold rounded-2xl transition shadow-lg shadow-emerald-950/10 hover:shadow-xl hover:translate-y-[-1px]"
              >
                <span>Book Procurement Slot</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/centres"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#e6f7ef] hover:bg-[#d1f2e2] text-[#0d6e48] border border-[#b2e8cf] text-sm font-semibold rounded-2xl transition"
              >
                <span>Find Procurement Centre</span>
              </Link>
            </div>

            {/* Checkmarks Footer List */}
            <div className="pt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="text-[#0d6e48]">✓</span>
                <span>Quantity-aware scheduling</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#0d6e48]">✓</span>
                <span>Dynamic queue prediction</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#0d6e48]">✓</span>
                <span>Offline-first prototype</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Centre Intelligence Mockup Card */}
          <div className="lg:col-span-5 relative">
            
            {/* Top Floating Badge: Time Saved */}
            <div className="absolute -top-6 -right-2 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-100 shadow-lg flex items-center gap-3 animate-bounce-subtle">
              <div className="text-right">
                <div className="text-emerald-700 text-sm font-extrabold font-serif-header">-26 min</div>
                <div className="text-[10px] text-slate-500 font-medium">waiting time optimized</div>
              </div>
            </div>

            {/* Bottom Floating Badge: Performance Score */}
            <div className="absolute -bottom-6 -left-4 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-100 shadow-lg flex items-center gap-3">
              <div>
                <div className="text-[#0d6e48] text-sm font-extrabold font-serif-header">92/100</div>
                <div className="text-[10px] text-slate-500 font-medium">centre performance</div>
              </div>
            </div>

            {/* Main Widget Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 space-y-5 relative z-10">
              
              {/* Widget Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-sm font-bold text-slate-900">Live Centre Intelligence</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#e6f7ef] text-[#0d6e48] text-[10px] font-bold tracking-wider">
                  OPTIMAL
                </span>
              </div>

              {/* 3 Metric Column Cards */}
              <div className="grid grid-cols-3 gap-3 text-center bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">QUEUE</div>
                  <div className="text-xl font-bold font-serif-header text-slate-900">06</div>
                  <div className="text-[9px] text-slate-500 font-medium">farmers ahead</div>
                </div>

                <div className="space-y-0.5 border-x border-slate-200 px-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ETA</div>
                  <div className="text-xl font-bold font-serif-header text-slate-900">17 <span className="text-xs font-normal">min</span></div>
                  <div className="text-[9px] text-slate-500 font-medium">estimated wait</div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LOAD</div>
                  <div className="text-xl font-bold font-serif-header text-slate-900">34 <span className="text-xs font-normal">%</span></div>
                  <div className="text-[9px] text-slate-500 font-medium">centre capacity</div>
                </div>
              </div>

              {/* Live Queue Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs">
                  <span className="px-2 py-0.5 bg-[#0d6e48] text-white text-[10px] font-bold rounded-md">A-024</span>
                  <span className="font-semibold text-slate-800">Current farmer</span>
                  <span className="text-slate-500 font-mono text-[11px]">11:42 AM</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs">
                  <span className="font-bold text-[#0d6e48] text-[11px]">A-025</span>
                  <span className="text-slate-600">35 q</span>
                  <span className="text-slate-400 font-mono text-[11px]">11:57 AM</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs">
                  <span className="font-bold text-[#0d6e48] text-[11px]">A-026</span>
                  <span className="text-slate-600">18 q</span>
                  <span className="text-slate-400 font-mono text-[11px]">12:06 PM</span>
                </div>
              </div>

              {/* Recommendation Banner */}
              <div className="p-3 bg-[#e6f7ef] rounded-2xl border border-[#b2e8cf] text-xs space-y-0.5">
                <div className="font-bold text-[#0d6e48] text-[11px]">Smart Recommendation</div>
                <div className="text-slate-700 text-[11px]">Centre B is currently the fastest suitable option.</div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* NEW INTERACTIVE ECOSYSTEM HUB SECTION */}
      <section className="pt-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Heading & Node Tabs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-bold font-serif-header text-slate-900 leading-tight">
                Building trusted paths of growth for every agri citizen
              </h2>
              {/* Colorful underline accent */}
              <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 via-amber-500 to-indigo-500 rounded-full" />
            </div>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              By harnessing technology and AI-driven slot optimization, we connect small farmers,
              mandi officers, quality weighbridges, and DBT banking infrastructure into a single transparent ecosystem.
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
                        <div className="text-[11px] text-slate-500 font-medium hidden sm:block">Step 0{index + 1} in Procurement Chain</div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "translate-x-1 text-[#0d6e48]" : "text-slate-400"}`} />
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold text-xs rounded-full shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                <span>Explore Ecosystem Services</span>
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
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">STAGE 0{activeNode + 1} ACTION NODE</span>
                    <h3 className="text-lg font-bold font-serif-header text-slate-900">{ecosystemNodes[activeNode].title}</h3>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${ecosystemNodes[activeNode].badgeBg}`}>
                  ACTIVE HUB
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
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Ecosystem Connectivity Map</div>
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
                        <span className="text-[10px] font-bold leading-tight line-clamp-1">{n.title.split(' ')[0]}</span>
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

      {/* NEW INTERACTIVE SLOT & WAITING TIME SIMULATOR */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 uppercase tracking-wider mb-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>Interactive Mandi Simulator</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-header text-slate-900">
              Calculate Your Procurement Waiting Time Reduction
            </h2>
          </div>
          <div className="text-xs text-slate-500 max-w-xs font-medium">
            Adjust your harvest quantity below to see real-time AI slot recommendations and queue optimization.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Controls Input Side */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Quantity Slider */}
            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/70">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Estimated Produce Quantity (Quintals)
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
                <span>10 q (Small harvest)</span>
                <span>100 q</span>
                <span>200 q (Bulk harvest)</span>
              </div>
            </div>

            {/* Target Mandi Select */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Procurement Centre Yard
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
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Simulated AI Booking Pass</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">CONFIRMED</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Estimated Mandi Wait</div>
                  <div className="text-2xl font-bold font-serif-header text-slate-900 mt-1">{wait} <span className="text-xs font-normal">mins</span></div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-1">✓ Fast-Track Entry</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Time Saved</div>
                  <div className="text-2xl font-bold font-serif-header text-[#0d6e48] mt-1">-{saved} <span className="text-xs font-normal">mins</span></div>
                  <div className="text-[10px] text-[#0d6e48] font-semibold mt-1">vs traditional queue</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-500 font-medium">Target Centre:</div>
                  <div className="font-bold text-slate-900">{selectedMandi}</div>
                </div>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-[#0d6e48] hover:bg-[#095235] text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Book This Slot →
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* STAKEHOLDER SOLUTIONS TABS */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-3xl font-bold font-serif-header text-slate-900">Tailored Experience for Every Role</h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Select your user role to see specific platform capabilities and features</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center gap-2 max-w-md mx-auto p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('FARMER')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'FARMER' ? 'bg-[#0d6e48] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            For Farmers
          </button>
          <button
            onClick={() => setActiveTab('OFFICER')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'OFFICER' ? 'bg-[#0d6e48] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            For Mandi Officers
          </button>
          <button
            onClick={() => setActiveTab('ADMIN')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'ADMIN' ? 'bg-[#0d6e48] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            For Government Admins
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
                <h3 className="font-bold text-slate-900">Multilingual Slot Booking</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Book procurement slots in Hindi or English with automatic crop yield verification and location-aware mandi selection.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Real-Time Mandi Waiting ETA</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Check live queue lengths and estimated wait times before leaving home to avoid long roadside queues.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Direct Benefit Transfer (DBT)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Track instant digital payments transferred directly into your bank account with complete transparency.</p>
              </div>
            </>
          )}

          {activeTab === 'OFFICER' && (
            <>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Gate Token QR Verification</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Scan farmer cryptographic QR passes at mandi gate for instant check-in and automated weight ticket creation.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Disruption & Capacity Management</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Report gate disruptions or weighbridge downtime to automatically reroute incoming farmer slots.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Offline-First Mandi Sync</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Operate weighbridge logging offline during network outages with conflict-free background synchronization.</p>
              </div>
            </>
          )}

          {activeTab === 'ADMIN' && (
            <>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">State-Wide Procurement Analytics</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Monitor real-time MSP procurement volumes, district load distributions, and DBT disbursement velocity.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">AI Congestion & What-If Engine</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Simulate weather disruptions, crop harvest surges, and staff availability to optimize state procurement policy.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900">Audit Trails & RBAC Security</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Enforce strict role-based access control with tamper-evident audit logs for every procurement transaction.</p>
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
              End-to-End Procurement Journey
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
