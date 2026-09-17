import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { centreService } from '../services/centreService';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import {
  ProcurementCentreDetail,
  CentreCapacityConfig,
  CentreDisruptionDetail,
  CentreStaffAssignment,
  CentreOperationalStatus,
  DisruptionSeverity
} from '../types/domain';
import { StaffQueueDashboard } from '../components/queue/StaffQueueDashboard';
import { ProcurementWorkflowStepper } from '../components/procurement/ProcurementWorkflowStepper';
import { CentreManagerRequestsInbox } from '../components/centre/CentreManagerRequestsInbox';
import {
  Building2,
  AlertOctagon,
  Gauge,
  Users,
  PlusCircle,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Search,
  Activity,
  QrCode,
  Scale,
  Inbox
} from 'lucide-react';

export const CentrePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'overview' | 'capacity' | 'disruptions' | 'staff' | 'queue' | 'procurement'>('requests');

  // Centre list and selected centre state
  const [centres, setCentres] = useState<ProcurementCentreDetail[]>([]);
  const [selectedCentre, setSelectedCentre] = useState<ProcurementCentreDetail | null>(null);
  const [capacity, setCapacity] = useState<CentreCapacityConfig | null>(null);
  const [disruptions, setDisruptions] = useState<CentreDisruptionDetail[]>([]);
  const [staff, setStaff] = useState<CentreStaffAssignment[]>([]);

  // Filtering
  const [districtFilter, setDistrictFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // UI status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDisruptionModal, setShowDisruptionModal] = useState(false);

  // Status Change Form
  const [statusForm, setStatusForm] = useState<{ status: CentreOperationalStatus; reason: string }>({
    status: 'NORMAL',
    reason: ''
  });

  // Create Centre Form
  const [createForm, setCreateForm] = useState({
    centreCode: '',
    name: '',
    district: 'Karnal',
    subDistrict: 'Karnal Tehsil',
    state: 'Haryana',
    pincode: '132001',
    addressText: '',
    latitude: 29.6857,
    longitude: 76.9905,
    contactPhone: '+91 1800-180-1551'
  });

  // Capacity Form State
  const [capacityForm, setCapacityForm] = useState({
    dailyFarmerCapacity: 100,
    dailyQuantityCapacityKg: 50000,
    hourlyThroughputKg: 5000,
    weighingStationCount: 2,
    counterCount: 4,
    storageCapacityQuintals: 10000
  });

  // Disruption Form State
  const [disruptionForm, setDisruptionForm] = useState<{
    disruptionType: string;
    severity: DisruptionSeverity;
    title: string;
    description: string;
  }>({
    disruptionType: 'EQUIPMENT_FAILURE',
    severity: 'MEDIUM',
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchCentres();
  }, []);

  useEffect(() => {
    if (selectedCentre) {
      loadCentreSubdata(selectedCentre.id);
    }
  }, [selectedCentre]);

  const fetchCentres = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await centreService.listCentres({
        district: districtFilter || undefined,
        search: searchQuery || undefined
      });
      setCentres(res.data);
      if (res.data.length > 0 && !selectedCentre) {
        setSelectedCentre(res.data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch procurement centres.');
    } finally {
      setLoading(false);
    }
  };

  const loadCentreSubdata = async (centreId: string) => {
    try {
      const [cap, dis, stf] = await Promise.all([
        centreService.getCapacity(centreId).catch(() => null),
        centreService.listDisruptions(centreId).catch(() => []),
        centreService.getStaff(centreId).catch(() => [])
      ]);

      if (cap) {
        setCapacity(cap);
        setCapacityForm({
          dailyFarmerCapacity: cap.dailyFarmerCapacity,
          dailyQuantityCapacityKg: cap.dailyQuantityCapacityKg,
          hourlyThroughputKg: cap.hourlyThroughputKg,
          weighingStationCount: cap.weighingStationCount,
          counterCount: cap.counterCount,
          storageCapacityQuintals: cap.storageCapacityQuintals
        });
      }
      setDisruptions(dis);
      setStaff(stf);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateCentre = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await centreService.createCentre({
        ...createForm,
        latitude: Number(createForm.latitude),
        longitude: Number(createForm.longitude)
      });
      setCentres((prev) => [created, ...prev]);
      setSelectedCentre(created);
      setShowCreateModal(false);
      setSuccessMsg(`Procurement centre '${created.name}' created successfully!`);
    } catch (err: any) {
      setError(err.message || 'Failed to create centre.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentre) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await centreService.updateCentreStatus(selectedCentre.id, statusForm.status, statusForm.reason);
      setSelectedCentre(updated);
      setCentres((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setShowStatusModal(false);
      setSuccessMsg(`Operational status updated to ${statusForm.status}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update operational status.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentre) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await centreService.updateCapacity(selectedCentre.id, {
        dailyFarmerCapacity: Number(capacityForm.dailyFarmerCapacity),
        dailyQuantityCapacityKg: Number(capacityForm.dailyQuantityCapacityKg),
        hourlyThroughputKg: Number(capacityForm.hourlyThroughputKg),
        weighingStationCount: Number(capacityForm.weighingStationCount),
        counterCount: Number(capacityForm.counterCount),
        storageCapacityQuintals: Number(capacityForm.storageCapacityQuintals)
      });
      setCapacity(updated);
      setSuccessMsg('Centre capacity parameters updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update capacity.');
    } finally {
      setSaving(false);
    }
  };

  const handleReportDisruption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentre) return;
    setSaving(true);
    setError(null);
    try {
      const created = await centreService.createDisruption(selectedCentre.id, disruptionForm);
      setDisruptions((prev) => [created, ...prev]);
      setShowDisruptionModal(false);
      setSuccessMsg('Operational disruption reported successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to report disruption.');
    } finally {
      setSaving(false);
    }
  };

  const handleResolveDisruption = async (disruptionId: string) => {
    if (!selectedCentre) return;
    try {
      const updated = await centreService.updateDisruptionStatus(
        selectedCentre.id,
        disruptionId,
        'RESOLVED',
        'Issue inspected and resolved by operational team'
      );
      setDisruptions((prev) => prev.map((d) => (d.id === disruptionId ? updated : d)));
      setSuccessMsg('Operational disruption marked as RESOLVED.');
    } catch (err: any) {
      setError(err.message || 'Failed to update disruption.');
    }
  };

  const getStatusBadge = (status: CentreOperationalStatus | string) => {
    switch (status) {
      case 'NORMAL':
        return <Badge variant="success">Normal Operations</Badge>;
      case 'BUSY':
        return <Badge variant="warning">Busy / High Load</Badge>;
      case 'CONGESTED':
        return <Badge variant="warning">Congested</Badge>;
      case 'CRITICAL':
        return <Badge variant="danger">Critical Bottleneck</Badge>;
      case 'CLOSED':
        return <Badge variant="neutral">Closed</Badge>;
      case 'EMERGENCY':
        return <Badge variant="danger">Emergency State</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#e6f7ef] border border-[#b2e8cf] rounded-2xl text-[#0d6e48]">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif-header text-slate-900 flex items-center gap-2">
                {selectedCentre ? selectedCentre.name : 'Procurement Centre Control Room'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                {selectedCentre ? (
                  <>
                    <span className="font-mono font-bold text-[#0d6e48]">Code: {selectedCentre.centreCode}</span>
                    <span>•</span>
                    <span>District: {selectedCentre.district}</span>
                  </>
                ) : (
                  <span>Real-time procurement centre monitoring, capacity & disruption management</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedCentre && getStatusBadge(selectedCentre.status)}
            {selectedCentre && (
              <Button variant="outline" onClick={() => setShowStatusModal(true)}>
                Change Status
              </Button>
            )}
            {(user?.role === 'SYSTEM_ADMIN' || user?.role === 'DISTRICT_ADMIN' || user?.role === 'ADMIN') && (
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusCircle className="w-4 h-4 mr-1.5 inline" /> Register Centre
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#e6f7ef] border border-[#b2e8cf] text-[#0d6e48] text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[#0d6e48] flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Centre Switcher & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Select Centre:</span>
          <select
            value={selectedCentre?.id || ''}
            onChange={(e) => {
              const target = centres.find((c) => c.id === e.target.value);
              if (target) setSelectedCentre(target);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#0d6e48] w-full md:w-72"
          >
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.centreCode})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search code/name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#0d6e48]"
            />
          </div>
          <Button variant="outline" onClick={fetchCentres}>
            Filter
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-6">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'requests'
              ? 'border-[#0d6e48] text-[#0d6e48]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Inbox className="w-4 h-4" /> Incoming Slot Requests
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-[#0d6e48] text-[#0d6e48]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" /> Centre Overview
        </button>
        <button
          onClick={() => setActiveTab('capacity')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'capacity'
              ? 'border-[#0d6e48] text-[#0d6e48]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Gauge className="w-4 h-4" /> Capacity & Throughput
        </button>
        <button
          onClick={() => setActiveTab('disruptions')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'disruptions'
              ? 'border-[#0d6e48] text-[#0d6e48]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertOctagon className="w-4 h-4" /> Operational Disruptions ({disruptions.length})
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'staff'
              ? 'border-[#0d6e48] text-[#0d6e48]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" /> Staff & Infrastructure
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'queue'
              ? 'border-[#0d6e48] text-[#0d6e48]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-4 h-4" /> Gate Check-In & Queue Operations
        </button>
        <button
          onClick={() => setActiveTab('procurement')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'procurement'
              ? 'border-[#0d6e48] text-[#0d6e48]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4" /> Procurement & Weighbridge Operations
        </button>
      </div>

      {/* TAB: Incoming Farmer Procurement Requests */}
      {activeTab === 'requests' && selectedCentre && (
        <CentreManagerRequestsInbox
          centreId={selectedCentre.id}
          centreName={selectedCentre.name}
          onNavigateCheckin={() => setActiveTab('queue')}
        />
      )}

      {/* TAB: Procurement & Weighbridge Operations */}
      {activeTab === 'procurement' && selectedCentre && (
        <ProcurementWorkflowStepper centreId={selectedCentre.id} />
      )}

      {/* TAB: Gate Check-In & Live Queue Operations */}
      {activeTab === 'queue' && selectedCentre && (
        <StaffQueueDashboard centreId={selectedCentre.id} />
      )}

      {/* TAB 1: Centre Overview */}
      {activeTab === 'overview' && selectedCentre && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card header={<h2 className="text-base font-bold font-serif-header text-slate-900">Location & Contact Details</h2>}>
            <div className="space-y-3 text-xs text-slate-600 font-medium">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#0d6e48] mt-0.5 flex-shrink-0" />
                <span>
                  {selectedCentre.addressText}, {selectedCentre.subDistrict}, {selectedCentre.district},{' '}
                  {selectedCentre.state} - {selectedCentre.pincode}
                </span>
              </p>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <p>
                  Latitude: <strong className="font-mono text-slate-900">{selectedCentre.latitude}</strong>
                </p>
                <p>
                  Longitude: <strong className="font-mono text-slate-900">{selectedCentre.longitude}</strong>
                </p>
                <p>
                  Timezone: <strong className="font-mono text-slate-900">{selectedCentre.timezone}</strong>
                </p>
              </div>
            </div>
          </Card>

          <Card header={<h2 className="text-base font-bold font-serif-header text-slate-900">Configured Operational Limits</h2>}>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Daily Farmer Limit</span>
                <span className="text-xs font-bold text-[#0d6e48]">
                  {capacity?.dailyFarmerCapacity || 100} Farmers/Day
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Daily Tonnage Limit</span>
                <span className="text-xs font-bold text-[#0d6e48]">
                  {((capacity?.dailyQuantityCapacityKg || 50000) / 1000).toFixed(0)} TONS/Day
                </span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Hourly Throughput</span>
                <span className="text-xs font-bold text-slate-900">
                  {capacity?.hourlyThroughputKg || 5000} KG/hr
                </span>
              </div>
            </div>
          </Card>

          <Card header={<h2 className="text-base font-bold font-serif-header text-slate-900">Live Health Summary</h2>}>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Active Disruptions:</span>
                <Badge variant={disruptions.filter((d) => d.status !== 'RESOLVED').length > 0 ? 'danger' : 'success'}>
                  {disruptions.filter((d) => d.status !== 'RESOLVED').length} Active
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Weighbridges:</span>
                <span className="text-xs font-bold text-slate-900">
                  {capacity?.weighingStationCount || 2} Active Stations
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Procurement Staff:</span>
                <span className="text-xs font-bold text-slate-900">{staff.length} Assigned Officers</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Capacity Configuration */}
      {activeTab === 'capacity' && selectedCentre && (
        <Card header={<h2 className="text-base font-bold font-serif-header text-slate-900">Centre Capacity & Infrastructure Controls</h2>}>
          <form onSubmit={handleUpdateCapacity} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Max Daily Farmer Tokens"
                type="number"
                value={capacityForm.dailyFarmerCapacity}
                onChange={(e) => setCapacityForm({ ...capacityForm, dailyFarmerCapacity: Number(e.target.value) })}
                required
              />
              <Input
                label="Daily Quantity Capacity (KG)"
                type="number"
                value={capacityForm.dailyQuantityCapacityKg}
                onChange={(e) => setCapacityForm({ ...capacityForm, dailyQuantityCapacityKg: Number(e.target.value) })}
                required
              />
              <Input
                label="Target Hourly Throughput (KG)"
                type="number"
                value={capacityForm.hourlyThroughputKg}
                onChange={(e) => setCapacityForm({ ...capacityForm, hourlyThroughputKg: Number(e.target.value) })}
                required
              />
              <Input
                label="Active Weighbridges Count"
                type="number"
                value={capacityForm.weighingStationCount}
                onChange={(e) => setCapacityForm({ ...capacityForm, weighingStationCount: Number(e.target.value) })}
                required
              />
              <Input
                label="Quality Testing Counters"
                type="number"
                value={capacityForm.counterCount}
                onChange={(e) => setCapacityForm({ ...capacityForm, counterCount: Number(e.target.value) })}
                required
              />
              <Input
                label="Storage Yard Capacity (Quintals)"
                type="number"
                value={capacityForm.storageCapacityQuintals}
                onChange={(e) => setCapacityForm({ ...capacityForm, storageCapacityQuintals: Number(e.target.value) })}
                required
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={saving}>
                Update Capacity Limits
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: Operational Disruptions */}
      {activeTab === 'disruptions' && selectedCentre && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-serif-header text-slate-900 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-600" /> Operational Incidents & Disruption Log
            </h2>
            <Button onClick={() => setShowDisruptionModal(true)} variant="danger">
              <PlusCircle className="w-4 h-4 mr-1.5 inline" /> Report Incident
            </Button>
          </div>

          <div className="space-y-3">
            {disruptions.map((d) => (
              <div
                key={d.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={d.severity === 'CRITICAL' || d.severity === 'HIGH' ? 'danger' : 'warning'}>
                      {d.severity}
                    </Badge>
                    <h3 className="font-bold text-slate-900 font-serif-header">{d.title}</h3>
                    <Badge variant={d.status === 'RESOLVED' ? 'success' : 'info'}>{d.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{d.description}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Reported at: {new Date(d.createdAt).toLocaleString()}
                  </p>
                </div>

                {d.status !== 'RESOLVED' && (
                  <Button variant="outline" size="sm" onClick={() => handleResolveDisruption(d.id)}>
                    Mark Resolved
                  </Button>
                )}
              </div>
            ))}

            {disruptions.length === 0 && (
              <div className="bg-white p-8 rounded-3xl text-center border border-slate-200 text-slate-500 shadow-sm font-medium">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-[#0d6e48]" />
                <p className="font-bold text-slate-900 font-serif-header">No active disruptions reported.</p>
                <p className="text-xs mt-1">Centre is operating smoothly at nominal capacity.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Staff & Infrastructure */}
      {activeTab === 'staff' && selectedCentre && (
        <Card header={<h2 className="text-base font-bold font-serif-header text-slate-900">Assigned Operational Staff</h2>}>
          <div className="space-y-3">
            {staff.map((s) => (
              <div key={s.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{s.assignmentRole}</span>
                  <span className="text-slate-500 font-mono">{s.userId}</span>
                </div>
                <Badge variant={s.isActive ? 'success' : 'neutral'}>{s.isActive ? 'Active Shift' : 'Inactive'}</Badge>
              </div>
            ))}
            {staff.length === 0 && (
              <p className="text-xs text-slate-500 font-medium py-4 text-center">No dedicated staff records assigned to this centre.</p>
            )}
          </div>
        </Card>
      )}

      {/* MODAL 1: Update Operational Status */}
      {showStatusModal && selectedCentre && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold font-serif-header text-slate-900">Update Centre Operational State</h3>
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <Select
                label="Status Code"
                value={statusForm.status}
                onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value as CentreOperationalStatus })}
                options={[
                  { value: 'NORMAL', label: 'NORMAL - Nominal Operations' },
                  { value: 'BUSY', label: 'BUSY - Elevated Token Flow' },
                  { value: 'CONGESTED', label: 'CONGESTED - Queue Delay Expected' },
                  { value: 'CRITICAL', label: 'CRITICAL - Severe Bottleneck' },
                  { value: 'CLOSED', label: 'CLOSED - Non-operational' },
                  { value: 'EMERGENCY', label: 'EMERGENCY - Suspended Operations' }
                ]}
              />

              <Input
                label="Reason / Incident Explanation"
                value={statusForm.reason}
                onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
                placeholder="e.g. Surge in morning tractor arrivals"
                required
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={saving}>
                  Apply Status
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Register Procurement Centre */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-bold font-serif-header text-slate-900">Register New Procurement Centre</h3>
            <form onSubmit={handleCreateCentre} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Centre Code"
                  value={createForm.centreCode}
                  onChange={(e) => setCreateForm({ ...createForm, centreCode: e.target.value })}
                  placeholder="PC-132001-01"
                  required
                />
                <Input
                  label="Centre Name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Nilokheri Grain Market"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="District"
                  value={createForm.district}
                  onChange={(e) => setCreateForm({ ...createForm, district: e.target.value })}
                  required
                />
                <Input
                  label="Sub-District / Tehsil"
                  value={createForm.subDistrict}
                  onChange={(e) => setCreateForm({ ...createForm, subDistrict: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="State"
                  value={createForm.state}
                  onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                  required
                />
                <Input
                  label="Pincode"
                  value={createForm.pincode}
                  onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
                  required
                />
                <Input
                  label="Phone"
                  value={createForm.contactPhone}
                  onChange={(e) => setCreateForm({ ...createForm, contactPhone: e.target.value })}
                />
              </div>

              <Input
                label="Full Address"
                value={createForm.addressText}
                onChange={(e) => setCreateForm({ ...createForm, addressText: e.target.value })}
                placeholder="Mandi Yard, GT Road, Nilokheri"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Latitude"
                  type="number"
                  step="0.0001"
                  value={createForm.latitude}
                  onChange={(e) => setCreateForm({ ...createForm, latitude: Number(e.target.value) })}
                  required
                />
                <Input
                  label="Longitude"
                  type="number"
                  step="0.0001"
                  value={createForm.longitude}
                  onChange={(e) => setCreateForm({ ...createForm, longitude: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={saving}>
                  Register Centre
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Report Disruption */}
      {showDisruptionModal && selectedCentre && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold font-serif-header text-slate-900">Report Operational Incident</h3>
            <form onSubmit={handleReportDisruption} className="space-y-3">
              <Select
                label="Disruption Type"
                value={disruptionForm.disruptionType}
                onChange={(e) => setDisruptionForm({ ...disruptionForm, disruptionType: e.target.value })}
                options={[
                  { value: 'EQUIPMENT_FAILURE', label: 'Equipment Failure (Weighbridge/PC)' },
                  { value: 'POWER_OUTAGE', label: 'Power Grid Failure' },
                  { value: 'NETWORK_DISRUPTION', label: 'Internet / Network Outage' },
                  { value: 'WEATHER_EVENT', label: 'Severe Rain / Weather Event' },
                  { value: 'TRAFFIC_CONGESTION', label: 'Traffic & Access Blockade' }
                ]}
              />

              <Select
                label="Severity Level"
                value={disruptionForm.severity}
                onChange={(e) => setDisruptionForm({ ...disruptionForm, severity: e.target.value as DisruptionSeverity })}
                options={[
                  { value: 'LOW', label: 'Low Impact' },
                  { value: 'MEDIUM', label: 'Medium Impact' },
                  { value: 'HIGH', label: 'High Impact' },
                  { value: 'CRITICAL', label: 'Critical Facility Shutdown' }
                ]}
              />

              <Input
                label="Incident Headline"
                value={disruptionForm.title}
                onChange={(e) => setDisruptionForm({ ...disruptionForm, title: e.target.value })}
                placeholder="e.g. Primary 100T Weighbridge Sensor Calibration Fault"
                required
              />

              <Input
                label="Detailed Description"
                value={disruptionForm.description}
                onChange={(e) => setDisruptionForm({ ...disruptionForm, description: e.target.value })}
                placeholder="e.g. Weighbridge 1 sensor offline due to short circuit..."
                required
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowDisruptionModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger" isLoading={saving}>
                  Log Incident
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
