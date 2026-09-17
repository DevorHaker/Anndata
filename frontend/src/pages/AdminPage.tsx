import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Spinner } from '../components/Spinner';
import { centreService } from '../services/centreService';
import { farmerService } from '../services/farmerService';
import { ProcurementCentreDetail, CentreStaffAssignment, FarmerDetail } from '../types/domain';
import { Building2, Users, MapPin, Search, Phone, ShieldCheck, Crosshair, ChevronRight } from 'lucide-react';

export const AdminPage: React.FC = () => {
  // Centres and Managers
  const [centres, setCentres] = useState<ProcurementCentreDetail[]>([]);
  const [selectedCentre, setSelectedCentre] = useState<ProcurementCentreDetail | null>(null);
  const [centreStaff, setCentreStaff] = useState<CentreStaffAssignment[]>([]);
  const [loadingCentres, setLoadingCentres] = useState(false);

  // Farmers linked to selected centre (by district)
  const [farmers, setFarmers] = useState<FarmerDetail[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCentres();
  }, []);

  useEffect(() => {
    if (selectedCentre) {
      fetchCentreDetails(selectedCentre);
    } else {
      setFarmers([]);
      setCentreStaff([]);
    }
  }, [selectedCentre, searchQuery]);

  const fetchCentres = async () => {
    setLoadingCentres(true);
    try {
      const res = await centreService.listCentres({});
      setCentres(res.data);
      if (res.data.length > 0) {
        setSelectedCentre(res.data[0]);
      }
    } catch (err: any) {
      console.error(err.message || 'Failed to list centres');
    } finally {
      setLoadingCentres(false);
    }
  };

  const fetchCentreDetails = async (centre: ProcurementCentreDetail) => {
    try {
      setLoadingFarmers(true);
      const [staffRes, farmersRes] = await Promise.all([
        centreService.getStaff(centre.id).catch(() => []),
        farmerService.searchFarmers({ district: centre.district, search: searchQuery || undefined }).catch(() => ({ data: [] }))
      ]);
      setCentreStaff(staffRes);
      setFarmers(farmersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFarmers(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-purple-700">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif-header text-slate-900">Admin Control Panel</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Monitor Procurement Centre Managers and the farmers under their operational jurisdiction.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section 1: Centre Manager Details (Left Panel) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-base font-bold font-serif-header text-slate-900 flex items-center gap-2 px-1">
            <Building2 className="w-5 h-5 text-[#0d6e48]" /> Procurement Centres & Managers
          </h2>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <p className="text-xs text-slate-500 font-medium">Select a centre to view its managers and linked farmers.</p>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-2">
              {loadingCentres ? (
                <div className="flex justify-center p-8"><Spinner /></div>
              ) : (
                centres.map((centre) => (
                  <button
                    key={centre.id}
                    onClick={() => setSelectedCentre(centre)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      selectedCentre?.id === centre.id 
                        ? 'bg-[#e6f7ef] border-[#0d6e48] shadow-sm' 
                        : 'bg-white border-slate-200 hover:border-[#b2e8cf] hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-bold font-serif-header ${selectedCentre?.id === centre.id ? 'text-[#0d6e48]' : 'text-slate-900'}`}>
                        {centre.name}
                      </h3>
                      <Badge variant={centre.status === 'NORMAL' ? 'success' : 'warning'}>{centre.status}</Badge>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1 mb-3">
                      <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {centre.district}, {centre.state}</p>
                      <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {centre.contactPhone || 'N/A'}</p>
                    </div>

                    {selectedCentre?.id === centre.id && (
                      <div className="pt-3 border-t border-emerald-200/60 mt-2">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider mb-2 block">Assigned Managers</span>
                        {centreStaff.length > 0 ? (
                          <div className="space-y-2">
                            {centreStaff.map((staff, idx) => (
                              <div key={idx} className="bg-white p-2 rounded-xl border border-emerald-100 flex items-center gap-2">
                                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-[10px]">
                                  {staff.userId.substring(0,2).toUpperCase()}
                                </div>
                                <div className="text-[11px]">
                                  <p className="font-bold text-slate-800">{staff.assignmentRole}</p>
                                  <p className="font-mono text-slate-500">{staff.userId}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No managers currently assigned.</p>
                        )}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Linked Farmer Details (Right Panel) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
            <h2 className="text-base font-bold font-serif-header text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Farmers Linked to Centre
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search farmer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[600px]">
            {!selectedCentre ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
                <Crosshair className="w-12 h-12 mb-3 text-slate-300" />
                <p className="font-bold text-slate-600 font-serif-header">Select a Procurement Centre</p>
                <p className="text-xs mt-1 max-w-sm">Choose a centre from the left panel to monitor the farmers operating within its jurisdiction.</p>
              </div>
            ) : loadingFarmers ? (
              <div className="flex justify-center flex-1 items-center"><Spinner size="lg" /></div>
            ) : farmers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <Users className="w-12 h-12 mb-3 text-slate-300" />
                <p className="font-bold text-slate-600 font-serif-header">No Farmers Found</p>
                <p className="text-xs mt-1">No farmers are registered in the '{selectedCentre.district}' district for this centre.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-4">Farmer Details</th>
                      <th className="p-4 hidden sm:table-cell">Location</th>
                      <th className="p-4">Land (Acres)</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {farmers.map((f) => (
                      <tr key={f.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {f.firstName?.charAt(0) || 'F'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{f.firstName} {f.lastName}</p>
                              <p className="text-[10px] font-mono text-blue-600 font-bold">{f.farmerReferenceId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden sm:table-cell text-slate-500">
                          {f.profile?.villageName || 'N/A'}<br/>
                          <span className="text-[10px]">{f.profile?.district}, {f.profile?.state}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-800">{f.profile?.landHoldingAcres || 0}</span> Acres
                        </td>
                        <td className="p-4 text-right">
                          <AdminFarmerStatus status={f.verificationStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminFarmerStatus = ({ status }: { status: string }) => {
  switch (status) {
    case 'VERIFIED':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e6f7ef] text-[#0d6e48] text-[10px] font-bold"><ShieldCheck className="w-3 h-3"/> Active / Verified</span>;
    case 'PENDING_VERIFICATION':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">Pending Review</span>;
    case 'REJECTED':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">Suspended</span>;
    default:
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">Unknown</span>;
  }
};
