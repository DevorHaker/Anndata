import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { farmerService } from '../services/farmerService';
import { centreService } from '../services/centreService';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import {
  FarmerDetail,
  FarmerProduceDetail,
  CropType,
  ProcurementCentreDetail,
  VerificationStatus,
  AccountStatus
} from '../types/domain';
import { DigitalTokenCard } from '../components/queue/DigitalTokenCard';
import { LiveQueueTrackerCard } from '../components/queue/LiveQueueTrackerCard';
import { tokenQueueService, DigitalToken, QRPayload } from '../services/tokenQueue.service';
import { FarmerProcurementStatusCard } from '../components/procurement/FarmerProcurementStatusCard';
import { procurementServiceUI, ProcurementRecordUI } from '../services/procurement.service';
import { bookingServiceUI } from '../services/bookingService';
import {
  User,
  Wheat,
  MapPin,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  PlusCircle,
  QrCode,
  Scale
} from 'lucide-react';

export const FarmerPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'profile' | 'produce' | 'centres' | 'admin' | 'tokens' | 'procurements'>('profile');

  useEffect(() => {
    if (location.pathname.includes('bookings') || location.pathname.includes('centres')) {
      setActiveTab('centres');
    } else if (location.pathname.includes('tokens')) {
      setActiveTab('tokens');
    } else if (location.pathname.includes('produce')) {
      setActiveTab('produce');
    } else if (location.pathname.includes('procurements')) {
      setActiveTab('procurements');
    }
  }, [location.pathname]);
  const [token, setToken] = useState<DigitalToken | null>(null);
  const [qrPayload, setQrPayload] = useState<QRPayload | null>(null);

  // State for Farmer Profile & Produce & Procurements
  const [farmer, setFarmer] = useState<FarmerDetail | null>(null);
  const [produceList, setProduceList] = useState<FarmerProduceDetail[]>([]);
  const [procurementList, setProcurementList] = useState<ProcurementRecordUI[]>([]);
  const [crops, setCrops] = useState<CropType[]>([]);
  const [centres, setCentres] = useState<ProcurementCentreDetail[]>([]);

  // State for Admin Farmer Registry Search
  const [farmerRegistry, setFarmerRegistry] = useState<FarmerDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit Profile Form State
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    gender: 'MALE',
    villageName: '',
    subDistrict: '',
    district: '',
    state: '',
    pincode: '',
    landHoldingAcres: 0
  });

  // Declare Produce Form State
  const [showProduceModal, setShowProduceModal] = useState(false);
  const [produceForm, setProduceForm] = useState({
    cropTypeId: '',
    centreId: '',
    harvestSeason: 'RABI_2026',
    estimatedYieldKg: 10000,
    declaredQuantityKg: 8000
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user?.role === 'FARMER' || user?.farmerId) {
        const [profileData, produceData, cropData, procurementsData] = await Promise.all([
          farmerService.getMyProfile().catch(() => null),
          farmerService.getMyProduce().catch(() => []),
          farmerService.getCropTypes().catch(() => []),
          procurementServiceUI.listFarmerProcurements().catch(() => [])
        ]);

        if (procurementsData) {
          setProcurementList(procurementsData);
        }

        if (profileData) {
          setFarmer(profileData);
          setEditForm({
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            gender: profileData.gender || 'MALE',
            villageName: profileData.profile?.villageName || '',
            subDistrict: profileData.profile?.subDistrict || '',
            district: profileData.profile?.district || 'Karnal',
            state: profileData.profile?.state || 'Haryana',
            pincode: profileData.profile?.pincode || '132001',
            landHoldingAcres: profileData.profile?.landHoldingAcres || 0
          });
        }
        setProduceList(produceData);
        setCrops(cropData);

        // Fetch nearby centres in district
        const centreResult = await centreService.listCentres({
          district: profileData?.profile?.district || 'Karnal'
        }).catch(() => ({ data: [] }));

        const centresList = centreResult.data || [];
        setCentres(centresList);

        if (cropData.length > 0) {
          setProduceForm((prev) => ({
            ...prev,
            cropTypeId: cropData[0].id,
            centreId: prev.centreId || (centresList.length > 0 ? centresList[0].id : '')
          }));
        }
      } else {
        const [cropData, searchResult] = await Promise.all([
          farmerService.getCropTypes().catch(() => []),
          farmerService.searchFarmers({ search: searchQuery }).catch(() => ({ data: [] }))
        ]);
        setCrops(cropData);
        setFarmerRegistry(searchResult.data || []);
        setActiveTab('admin');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Farmer domain workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await farmerService.updateMyProfile({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        gender: editForm.gender,
        profile: {
          villageName: editForm.villageName,
          subDistrict: editForm.subDistrict,
          district: editForm.district,
          state: editForm.state,
          pincode: editForm.pincode,
          landHoldingAcres: Number(editForm.landHoldingAcres)
        }
      });
      setFarmer(updated);
      setSuccessMsg('Farmer profile and land holding records updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeclareProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // 1. Register produce declaration record
      const created = await farmerService.addMyProduce({
        cropTypeId: produceForm.cropTypeId,
        harvestSeason: produceForm.harvestSeason,
        estimatedYieldKg: Number(produceForm.estimatedYieldKg),
        declaredQuantityKg: Number(produceForm.declaredQuantityKg)
      });
      setProduceList((prev) => [created, ...prev]);

      // 2. Submit procurement booking request for the selected Mandi
      const selectedCentre = centres.find((c) => c.id === produceForm.centreId);
      const selectedCrop = crops.find((c) => c.id === produceForm.cropTypeId);

      const targetCentreId = produceForm.centreId || (selectedCentre?.id || '33333333-3333-4000-8000-333333333333');
      const targetCentreName = selectedCentre?.name || 'APMC Karnal Central Procurement Hub';

      const bookingReq = await bookingServiceUI.createBooking({
        farmerId: farmer?.id || user?.id,
        farmerName: farmer && farmer.firstName ? `${farmer.firstName} ${farmer.lastName}` : (user && user.firstName ? `${user.firstName} ${user.lastName}` : 'Ramesh Kumar'),
        farmerMobile: user?.mobileNumber || '+91 9999900002',
        farmerReferenceId: farmer?.farmerReferenceId || user?.farmerReferenceId || 'FRM-2026-8812',
        centreId: targetCentreId,
        centreName: targetCentreName,
        cropTypeId: produceForm.cropTypeId,
        cropName: selectedCrop?.name || 'Paddy (Grade A)',
        declaredWeightKg: Number(produceForm.declaredQuantityKg),
        harvestSeason: produceForm.harvestSeason
      });

      setShowProduceModal(false);
      setSuccessMsg(
        `Produce declared! Procurement slot request '${bookingReq.bookingReferenceId}' sent to Centre Manager at ${targetCentreName}.`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to submit produce declaration.');
    } finally {
      setSaving(false);
    }
  };

  const handleSearchRegistry = async () => {
    setLoading(true);
    try {
      const result = await farmerService.searchFarmers({
        search: searchQuery,
        district: districtFilter || undefined
      });
      setFarmerRegistry(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFarmer = async (farmerId: string, status: VerificationStatus) => {
    try {
      const updated = await farmerService.verifyFarmer(farmerId, status);
      setFarmerRegistry((prev) => prev.map((f) => (f.id === farmerId ? updated : f)));
      setSuccessMsg(`Farmer verification status updated to ${status}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getVerificationBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge variant="success">Verified Farmer</Badge>;
      case 'PENDING_VERIFICATION':
        return <Badge variant="warning">Pending Verification</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Verification Rejected</Badge>;
      default:
        return <Badge variant="neutral">Unverified</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#e6f7ef] border border-[#b2e8cf] rounded-2xl text-[#0d6e48]">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-serif-header text-slate-900 flex items-center gap-2">
                  {farmer ? `${farmer.firstName} ${farmer.lastName}` : 'Farmer Management Portal'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium flex flex-wrap items-center gap-2 mt-0.5">
                  {farmer && (
                    <>
                      <span className="font-mono font-bold text-[#0d6e48]">Ref ID: {farmer.farmerReferenceId}</span>
                      <span>•</span>
                      <span>Mobile: {user?.mobileNumber}</span>
                    </>
                  )}
                  {!farmer && <span>Manage farmer profiles, land verification, and crop declarations</span>}
                </p>
              </div>
            </div>
          </div>

          {farmer && (
            <div className="flex items-center gap-3">
              {getVerificationBadge(farmer.verificationStatus)}
              <Badge variant={farmer.status === 'ACTIVE' ? 'success' : 'danger'}>{farmer.status}</Badge>
            </div>
          )}
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

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto space-x-6">
        {(user?.role === 'FARMER' || user?.farmerId) && (
          <>
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-[#0d6e48] text-[#0d6e48]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" /> Profile & Land Holdings
            </button>
            <button
              onClick={() => setActiveTab('produce')}
              className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'produce'
                  ? 'border-[#0d6e48] text-[#0d6e48]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Wheat className="w-4 h-4" /> Produce Declarations ({produceList.length})
            </button>
            <button
              onClick={() => setActiveTab('centres')}
              className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'centres'
                  ? 'border-[#0d6e48] text-[#0d6e48]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" /> Eligible Procurement Centres
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'tokens'
                  ? 'border-[#0d6e48] text-[#0d6e48]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4" /> Digital Token & Live Queue
            </button>
            <button
              onClick={() => setActiveTab('procurements')}
              className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'procurements'
                  ? 'border-[#0d6e48] text-[#0d6e48]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Scale className="w-4 h-4" /> Procurement History ({procurementList.length})
            </button>
          </>
        )}
        {(user?.role === 'SYSTEM_ADMIN' ||
          user?.role === 'DISTRICT_ADMIN' ||
          user?.role === 'ADMIN' ||
          user?.role === 'CENTRE_MANAGER') && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'admin'
                ? 'border-[#0d6e48] text-[#0d6e48]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Admin Farmer Registry
          </button>
        )}
      </div>

      {/* TAB 1: Profile & Land Holdings */}
      {activeTab === 'profile' && farmer && (
        <Card header={<h2 className="text-base font-bold font-serif-header text-slate-900">Farmer Demographics & Land Verification</h2>}>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="First Name"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                required
              />
              <Select
                label="Gender"
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                options={[
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'OTHER', label: 'Other' }
                ]}
              />
            </div>

            <hr className="border-slate-100" />

            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0d6e48]" /> Land Holding & Geographic Address
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Village / City"
                value={editForm.villageName}
                onChange={(e) => setEditForm({ ...editForm, villageName: e.target.value })}
                placeholder="e.g. Kachhwa"
              />
              <Input
                label="Sub-district / Tehsil"
                value={editForm.subDistrict}
                onChange={(e) => setEditForm({ ...editForm, subDistrict: e.target.value })}
                placeholder="e.g. Karnal Tehsil"
              />
              <Input
                label="District"
                value={editForm.district}
                onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                placeholder="e.g. Karnal"
              />
              <Input
                label="State"
                value={editForm.state}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                placeholder="e.g. Haryana"
              />
              <Input
                label="Pincode"
                value={editForm.pincode}
                onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                placeholder="132001"
              />
              <Input
                label="Total Registered Land (Acres)"
                type="number"
                step="0.1"
                value={editForm.landHoldingAcres}
                onChange={(e) => setEditForm({ ...editForm, landHoldingAcres: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={saving}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: Produce Declarations */}
      {activeTab === 'produce' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-serif-header text-slate-900 flex items-center gap-2">
              <Wheat className="w-5 h-5 text-[#0d6e48]" /> Declared Harvest & Produce Records
            </h2>
            <Button onClick={() => setShowProduceModal(true)}>
              <PlusCircle className="w-4 h-4 mr-1.5 inline" /> Declare New Harvest
            </Button>
          </div>

          {/* Declare Produce Modal */}
          {showProduceModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                <h3 className="text-lg font-bold font-serif-header text-slate-900">Declare Harvest Yield</h3>
                <form onSubmit={handleDeclareProduce} className="space-y-4">
                  <Select
                    label="Target Mandi / Procurement Centre"
                    value={produceForm.centreId}
                    onChange={(e) => setProduceForm({ ...produceForm, centreId: e.target.value })}
                    options={
                      centres.length > 0
                        ? centres.map((c) => ({ value: c.id, label: `${c.name} (${c.district})` }))
                        : [
                            { value: '33333333-3333-4000-8000-333333333333', label: 'APMC Karnal Central Procurement Hub (Karnal)' },
                            { value: '33333333-3333-4000-8000-333333333334', label: 'Ludhiana Mandi Hub (Ludhiana)' },
                            { value: '33333333-3333-4000-8000-333333333335', label: 'Indore MSP Mandi Yard (Indore)' }
                          ]
                    }
                  />

                  <Select
                    label="Crop Type"
                    value={produceForm.cropTypeId}
                    onChange={(e) => setProduceForm({ ...produceForm, cropTypeId: e.target.value })}
                    options={crops.map((c) => ({ value: c.id, label: `${c.name} (${c.category})` }))}
                  />

                  <Select
                    label="Harvest Season"
                    value={produceForm.harvestSeason}
                    onChange={(e) => setProduceForm({ ...produceForm, harvestSeason: e.target.value })}
                    options={[
                      { value: 'RABI_2026', label: 'Rabi 2026' },
                      { value: 'KHARIF_2026', label: 'Kharif 2026' },
                      { value: 'ZAID_2026', label: 'Zaid 2026' }
                    ]}
                  />

                  <Input
                    label="Estimated Yield (KG)"
                    type="number"
                    value={produceForm.estimatedYieldKg}
                    onChange={(e) => setProduceForm({ ...produceForm, estimatedYieldKg: Number(e.target.value) })}
                    required
                  />

                  <Input
                    label="Declared Quantity for Sale (KG)"
                    type="number"
                    value={produceForm.declaredQuantityKg}
                    onChange={(e) => setProduceForm({ ...produceForm, declaredQuantityKg: Number(e.target.value) })}
                    required
                  />

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" type="button" onClick={() => setShowProduceModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={saving}>
                      Submit Declaration
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {produceList.map((item) => (
              <Card key={item.id}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 font-serif-header flex items-center gap-2 text-base">
                      <Wheat className="w-4 h-4 text-[#0d6e48]" />
                      {crops.find((c) => c.id === item.cropTypeId)?.name || 'Harvest Produce'}
                    </span>
                    <Badge variant="info">{item.harvestSeason}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="text-slate-500 font-medium block">Declared Quantity</span>
                      <span className="text-[#0d6e48] font-bold text-sm">
                        {item.declaredQuantityKg.toLocaleString()} KG
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="text-slate-500 font-medium block">Procured Quantity</span>
                      <span className="text-slate-900 font-bold text-sm">
                        {item.procuredQuantityKg.toLocaleString()} KG
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-500 pt-1 font-medium">
                    <span>Status: <strong className="text-slate-900">{item.status}</strong></span>
                    <span>Declared: {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            ))}

            {produceList.length === 0 && (
              <div className="col-span-2 bg-white p-8 rounded-3xl text-center border border-slate-200 text-slate-500 shadow-sm font-medium">
                <Wheat className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                <p className="font-bold text-slate-900 font-serif-header">No produce declarations recorded yet.</p>
                <p className="text-xs mt-1">Click "Declare New Harvest" above to register your produce for slot allocation.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Eligible Procurement Centres */}
      {activeTab === 'centres' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold font-serif-header text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#0d6e48]" /> Nearby Grain & Mandi Procurement Centres
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {centres.map((c) => (
              <Card key={c.id}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 font-serif-header text-base">{c.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{c.centreCode}</p>
                    </div>
                    <Badge variant={c.status === 'NORMAL' ? 'success' : c.status === 'BUSY' ? 'warning' : 'danger'}>
                      {c.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    {c.addressText}, {c.district}, {c.state} - {c.pincode}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
                    <span>Phone: {c.contactPhone || '+91 1800-180-1551'}</span>
                    <span className="text-[#0d6e48] font-bold">Eligible for Slot Booking</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Admin Farmer Registry */}
      {activeTab === 'admin' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, ref ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#0d6e48]"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="District filter..."
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#0d6e48]"
              />
              <Button onClick={handleSearchRegistry}>Search</Button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Farmer Name</th>
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Land (Acres)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Verification</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {farmerRegistry.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 font-bold text-slate-900">
                      {f.firstName} {f.lastName}
                    </td>
                    <td className="p-3 font-mono text-[#0d6e48] font-bold">{f.farmerReferenceId}</td>
                    <td className="p-3">{f.profile?.district || 'Unspecified'}</td>
                    <td className="p-3">{f.profile?.landHoldingAcres || 0} Acres</td>
                    <td className="p-3">
                      <Badge variant={f.status === 'ACTIVE' ? 'success' : 'danger'}>{f.status}</Badge>
                    </td>
                    <td className="p-3">{getVerificationBadge(f.verificationStatus)}</td>
                    <td className="p-3 text-right space-x-1">
                      {f.verificationStatus !== 'VERIFIED' && (
                        <button
                          onClick={() => handleVerifyFarmer(f.id, 'VERIFIED')}
                          className="px-2 py-1 bg-[#e6f7ef] text-[#0d6e48] rounded-lg border border-[#b2e8cf] hover:bg-[#d0f2e2] font-bold text-[11px]"
                        >
                          Verify
                        </button>
                      )}
                      {f.verificationStatus !== 'REJECTED' && (
                        <button
                          onClick={() => handleVerifyFarmer(f.id, 'REJECTED')}
                          className="px-2 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 hover:bg-rose-100 font-bold text-[11px]"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Digital Token & Live Queue Tracker */}
      {activeTab === 'tokens' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <h2 className="text-xl font-bold font-serif-header text-slate-900 mb-1">Your Digital QR Token & Live Queue Position</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Present your digital QR code at the procurement centre entry gate for instant check-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-items-center">
            {/* Digital QR Token */}
            <DigitalTokenCard
              token={{
                id: 'tok-2026-001',
                tokenCode: 'T-023',
                bookingId: 'bk-demo-001',
                farmerId: farmer?.id || 'farmer-001',
                centreId: '33333333-3333-4000-8000-333333333333',
                status: 'ACTIVE',
                expiresAt: new Date(Date.now() + 86400000).toISOString(),
                issuedAt: new Date().toISOString()
              }}
              qrPayload={{
                type: 'PROCUREMENT_CHECKIN',
                tokenCode: 'T-023',
                tokenId: 'tok-2026-001',
                bookingId: 'bk-demo-001',
                centreId: '33333333-3333-4000-8000-333333333333',
                timestamp: Date.now(),
                signature: '8f92a4b1c7d3e5f6',
                version: 1
              }}
              centreName="APMC Karnal Central Procurement Hub"
              scheduledDate="Today"
              startTime="09:00 AM - 11:00 AM"
            />

            {/* Live Queue Tracker */}
            <LiveQueueTrackerCard bookingId="bk-demo-001" />
          </div>
        </div>
      )}

      {/* TAB 6: Procurement History */}
      {activeTab === 'procurements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-serif-header text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#0d6e48]" /> My Procurement Records & Payout History
            </h2>
            <button
              onClick={loadData}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 shadow-sm"
            >
              🔄 Refresh Status
            </button>
          </div>

          {procurementList.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-500 shadow-sm font-medium">
              <Scale className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="font-bold text-slate-900 font-serif-header">No Procurement Records Found</p>
              <p className="text-xs text-slate-500 mt-1">
                Your procurement records will appear here once your produce is checked in and weighed at the procurement centre.
              </p>
            </div>
          ) : (
            <div>
              {procurementList.map((p) => (
                <FarmerProcurementStatusCard key={p.id} procurement={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
