import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { farmerService } from '../services/farmerService';
import { centreService } from '../services/centreService';

describe('Phase 6 Frontend Service Layer Unit Tests', () => {
  it('should expose farmer service methods', () => {
    expect(typeof farmerService.getMyProfile).toBe('function');
    expect(typeof farmerService.updateMyProfile).toBe('function');
    expect(typeof farmerService.getMyProduce).toBe('function');
    expect(typeof farmerService.addMyProduce).toBe('function');
    expect(typeof farmerService.getCropTypes).toBe('function');
    expect(typeof farmerService.searchFarmers).toBe('function');
  });

  it('should expose centre service methods', () => {
    expect(typeof centreService.listCentres).toBe('function');
    expect(typeof centreService.getCentreDetails).toBe('function');
    expect(typeof centreService.createCentre).toBe('function');
    expect(typeof centreService.updateCentreStatus).toBe('function');
    expect(typeof centreService.getCapacity).toBe('function');
    expect(typeof centreService.updateCapacity).toBe('function');
    expect(typeof centreService.listDisruptions).toBe('function');
  });
});
