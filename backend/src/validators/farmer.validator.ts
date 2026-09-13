import { z } from 'zod';

export const updateFarmerProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    profile: z
      .object({
        villageName: z.string().min(1).max(100),
        subDistrict: z.string().min(1).max(100),
        district: z.string().min(1).max(100),
        state: z.string().min(1).max(100),
        pincode: z.string().length(6, 'Pincode must be 6 digits'),
        latitude: z.number().min(-90).max(90).optional().nullable(),
        longitude: z.number().min(-180).max(180).optional().nullable(),
        preferredLanguage: z.string().max(10).optional(),
        landHoldingAcres: z.number().min(0).optional()
      })
      .optional()
  })
});

export const updateFarmerStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE', 'DRAFT'])
  })
});

export const verifyFarmerSchema = z.object({
  body: z.object({
    verificationStatus: z.enum(['UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'])
  })
});

export const addFarmerProduceSchema = z.object({
  body: z.object({
    cropTypeId: z.string().uuid(),
    cropVarietyId: z.string().uuid().optional(),
    harvestSeason: z.string().min(1).max(50),
    estimatedYieldKg: z.number().positive('Estimated yield must be positive'),
    declaredQuantityKg: z.number().positive('Declared quantity must be positive')
  })
});

export const createCentreSchema = z.object({
  body: z.object({
    centreCode: z.string().min(3).max(30),
    name: z.string().min(3).max(150),
    district: z.string().min(2).max(100),
    subDistrict: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    pincode: z.string().length(6),
    addressText: z.string().min(5),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    contactPhone: z.string().optional()
  })
});

export const updateCentreStatusSchema = z.object({
  body: z.object({
    status: z.enum(['NORMAL', 'BUSY', 'CONGESTED', 'CRITICAL', 'CLOSED', 'PARTIAL', 'EMERGENCY']),
    reason: z.string().min(3, 'Reason for status update is required')
  })
});

export const updateCapacitySchema = z.object({
  body: z.object({
    dailyFarmerCapacity: z.number().min(0).optional(),
    dailyQuantityCapacityKg: z.number().min(0).optional(),
    hourlyThroughputKg: z.number().min(0).optional(),
    weighingStationCount: z.number().min(0).optional(),
    counterCount: z.number().min(0).optional(),
    storageCapacityQuintals: z.number().min(0).optional()
  })
});

export const createDisruptionSchema = z.object({
  body: z.object({
    disruptionType: z.string().min(2),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    title: z.string().min(3).max(150),
    description: z.string().min(5),
    expectedEndTime: z.string().optional()
  })
});

export const updateDisruptionStatusSchema = z.object({
  body: z.object({
    status: z.enum(['OPEN', 'ACKNOWLEDGED', 'MITIGATING', 'RESOLVED', 'CANCELLED']),
    resolutionNotes: z.string().optional()
  })
});

export const assignStaffSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    role: z.string().min(2)
  })
});
