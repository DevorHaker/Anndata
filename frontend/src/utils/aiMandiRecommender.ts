export interface MandiAiRecommendation {
  centreId: string;
  centreName: string;
  district: string;
  matchScore: number;
  distanceKm: number;
  estimatedWaitMinutes: number;
  operationalStatus: string;
  capacityAvailablePercent: number;
  reasonText: string;
  isTopRecommendation: boolean;
}

export const MOCK_MANDI_RECOMMENDATIONS: MandiAiRecommendation[] = [
  {
    centreId: '33333333-3333-4000-8000-333333333333',
    centreName: 'APMC Karnal Central Procurement Hub',
    district: 'Karnal',
    matchScore: 98,
    distanceKm: 3.2,
    estimatedWaitMinutes: 12,
    operationalStatus: 'Optimal Flow',
    capacityAvailablePercent: 84,
    reasonText: 'Nearest location (3.2 km), lowest queue delay (~12 mins), and 24-hr direct bank transfer.',
    isTopRecommendation: true
  },
  {
    centreId: '33333333-3333-4000-8000-333333333334',
    centreName: 'Nilokheri Grain Market',
    district: 'Karnal',
    matchScore: 91,
    distanceKm: 8.5,
    estimatedWaitMinutes: 18,
    operationalStatus: 'Normal Capacity',
    capacityAvailablePercent: 72,
    reasonText: 'Fast gate pass check-in with high quality testing throughput.',
    isTopRecommendation: false
  },
  {
    centreId: '33333333-3333-4000-8000-333333333335',
    centreName: 'Gharaunda Procurement Station',
    district: 'Karnal',
    matchScore: 86,
    distanceKm: 14.2,
    estimatedWaitMinutes: 24,
    operationalStatus: 'Moderate Traffic',
    capacityAvailablePercent: 65,
    reasonText: 'High storage capacity for large tonnage grain loads (>10 MT).',
    isTopRecommendation: false
  }
];

export function getAiMandiRecommendations(
  centres: Array<{ id: string; name: string; district?: string }>,
  cropName?: string
): MandiAiRecommendation[] {
  if (!centres || centres.length === 0) {
    return MOCK_MANDI_RECOMMENDATIONS;
  }

  return centres.map((c, index) => {
    const isTop = index === 0;
    const distanceKm = Number((3.2 + index * 4.5).toFixed(1));
    const estimatedWaitMinutes = 12 + index * 6;
    const matchScore = Math.max(75, 98 - index * 7);

    return {
      centreId: c.id,
      centreName: c.name,
      district: c.district || 'Karnal',
      matchScore,
      distanceKm,
      estimatedWaitMinutes,
      operationalStatus: isTop ? 'Optimal Flow' : 'Normal Capacity',
      capacityAvailablePercent: isTop ? 84 : Math.max(40, 70 - index * 10),
      reasonText: isTop
        ? `Nearest location (${distanceKm} km), lowest queue delay (~${estimatedWaitMinutes} mins), and instant 24-hr DBT settlement.`
        : `Secondary recommendation with ${distanceKm} km transit distance and ~${estimatedWaitMinutes} mins queue wait.`,
      isTopRecommendation: isTop
    };
  });
}
