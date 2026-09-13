import { Router } from 'express';
import { healthRouter } from './health';
import authRouter from './auth';
import adminUsersRouter from './adminUsers';
import farmersRouter from './farmers';
import produceRouter from './produce';
import centresRouter from './centres';
import { recommendationsRouter } from './recommendations';
import { slotsRouter } from './slots';
import { bookingsRouter } from './bookings';
import { tokensRouter } from './tokens';
import { checkinsRouter } from './checkins';
import { queueRouter } from './queue';
import { procurementsRouter } from './procurements';
import { weighmentsRouter } from './weighments';
import { qualityRouter } from './quality';
import { paymentsRouter } from './payments';
import { traceabilityRouter } from './traceability';
import { createPlaceholderRouter } from './placeholders';

export const v1Router = Router();

// Health & Readiness Endpoints
v1Router.use('/', healthRouter);

// Domain API Registration
v1Router.use('/auth', authRouter);
v1Router.use('/admin/users', adminUsersRouter);

// Phase 6 Domain Modules
v1Router.use('/farmers', farmersRouter);
v1Router.use('/produce', produceRouter);
v1Router.use('/centres', centresRouter);

// Phase 7 Dynamic Procurement Slot & Recommendation Engine
v1Router.use('/recommendations', recommendationsRouter);
v1Router.use('/slots', slotsRouter);
v1Router.use('/bookings', bookingsRouter);

// Phase 8 Digital Token, Gate Check-In & Priority Queue Engine
v1Router.use('/tokens', tokensRouter);
v1Router.use('/checkins', checkinsRouter);
v1Router.use('/queue', queueRouter);

// Phase 9 Procurement Operations, Weighments & Quality Inspection
v1Router.use('/procurements', procurementsRouter);
v1Router.use('/weighments', weighmentsRouter);
v1Router.use('/quality', qualityRouter);

// Phase 10 Payment Management & Complete End-to-End Traceability
v1Router.use('/payments', paymentsRouter);
v1Router.use('/traceability', traceabilityRouter);
v1Router.use(
  '/notifications',
  createPlaceholderRouter('Multichannel Notification Dispatcher', 'Phase 12')
);
v1Router.use(
  '/analytics',
  createPlaceholderRouter('Analytics & Reporting Engine', 'Phase 13')
);
v1Router.use(
  '/intelligence',
  createPlaceholderRouter('Smart Congestion & Dynamic AI Engine', 'Phase 14')
);
v1Router.use(
  '/admin',
  createPlaceholderRouter('System Administration', 'Phase 15')
);
v1Router.use('/audit', createPlaceholderRouter('Audit Logging', 'Phase 15'));
