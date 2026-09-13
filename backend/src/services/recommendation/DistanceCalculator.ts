export interface DistanceResult {
  distanceKm: number | null;
  estimatedTravelTimeMinutes: number | null;
  isDistanceAvailable: boolean;
}

export class DistanceCalculator {
  /**
   * Haversine formula to compute distance in kilometers between two GPS points
   */
  public calculateDistance(
    lat1?: number | null,
    lon1?: number | null,
    lat2?: number | null,
    lon2?: number | null
  ): DistanceResult {
    if (
      lat1 === undefined ||
      lat1 === null ||
      lon1 === undefined ||
      lon1 === null ||
      lat2 === undefined ||
      lat2 === null ||
      lon2 === undefined ||
      lon2 === null
    ) {
      return {
        distanceKm: null,
        estimatedTravelTimeMinutes: null,
        isDistanceAvailable: false
      };
    }

    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.round(R * c * 10) / 10;

    // Average rural tractor/truck transport speed ~ 30 km/h
    const estimatedTravelTimeMinutes = Math.round((distanceKm / 30) * 60);

    return {
      distanceKm,
      estimatedTravelTimeMinutes,
      isDistanceAvailable: true
    };
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const distanceCalculator = new DistanceCalculator();
