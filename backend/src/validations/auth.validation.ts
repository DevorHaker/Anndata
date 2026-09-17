import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    mobileNumber: z
      .string()
      .regex(/^(\+91)?[1-9]\d{9}$/, 'Mobile number must be a valid 10-digit Indian mobile number'),
    password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
    roleCode: z.enum(['FARMER', 'PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN']).optional(),
    firstName: z.string().min(1, 'First name is required').max(100).optional(),
    lastName: z.string().min(1, 'Last name is required').max(100).optional()
  })
});

export const loginPasswordSchema = z.object({
  body: z.object({
    mobileNumber: z
      .string()
      .regex(/^(\+91)?[1-9]\d{9}$/, 'Mobile number must be a valid 10-digit Indian mobile number'),
    password: z.string().min(1, 'Password is required')
  })
});

export const requestOtpSchema = z.object({
  body: z.object({
    mobileNumber: z
      .string()
      .regex(/^(\+91)?[1-9]\d{9}$/, 'Mobile number must be a valid 10-digit Indian mobile number')
  })
});

export const verifyOtpSchema = z.object({
  body: z.object({
    mobileNumber: z
      .string()
      .regex(/^(\+91)?[1-9]\d{9}$/, 'Mobile number must be a valid 10-digit Indian mobile number'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits')
  })
});

export const refreshTokenSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().min(1, 'Refresh token is required').optional()
    })
    .optional()
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long')
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    mobileNumber: z
      .string()
      .regex(/^(\+91)?[1-9]\d{9}$/, 'Mobile number must be a valid 10-digit Indian mobile number'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long')
  })
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user UUID format')
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'DISABLED', 'LOCKED'])
  })
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user UUID format')
  }),
  body: z.object({
    roleCode: z.enum(['FARMER', 'PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'DISTRICT_ADMIN', 'SYSTEM_ADMIN', 'ADMIN'])
  })
});
