import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRole } from '../middleware/authorize';
import { validateRequest } from '../middleware/validation';
import { farmerDomainService } from '../services/farmerDomain.service';
import {
  updateFarmerProfileSchema,
  updateFarmerStatusSchema,
  verifyFarmerSchema,
  addFarmerProduceSchema
} from '../validators/farmer.validator';

const router = Router();

// Apply Authentication to all Farmer routes
router.use(authenticate);

/**
 * GET /api/v1/farmers/me
 * Retrieves current authenticated farmer's profile
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const farmer = await farmerDomainService.getMyProfile(user.sub);
    return res.status(200).json({
      success: true,
      data: farmer
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/farmers/me
 * Updates current authenticated farmer's profile fields
 */
router.patch('/me', validateRequest(updateFarmerProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const currentFarmer = await farmerDomainService.getMyProfile(user.sub);
    const updated = await farmerDomainService.updateFarmerProfile(currentFarmer.id, req.body, {
      userId: user.sub,
      role: user.role,
      farmerId: user.farmerId,
      ipAddress: req.ip
    });
    return res.status(200).json({
      success: true,
      message: 'Farmer profile updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/farmers/me/produce
 * Retrieves produce declared by the current authenticated farmer
 */
router.get('/me/produce', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const currentFarmer = await farmerDomainService.getMyProfile(user.sub);
    const produceList = await farmerDomainService.listFarmerProduce(currentFarmer.id, {
      userId: user.sub,
      role: user.role,
      farmerId: user.farmerId
    });
    return res.status(200).json({
      success: true,
      data: produceList
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/farmers/me/produce
 * Adds a new crop/produce declaration for the current farmer
 */
router.post('/me/produce', validateRequest(addFarmerProduceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const currentFarmer = await farmerDomainService.getMyProfile(user.sub);
    const produce = await farmerDomainService.addFarmerProduce(currentFarmer.id, req.body, {
      userId: user.sub,
      role: user.role,
      farmerId: user.farmerId
    });
    return res.status(201).json({
      success: true,
      message: 'Farmer produce declaration added successfully',
      data: produce
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/farmers/me/produce/:id
 * Updates an active produce declaration within the 5-minute window
 */
router.patch('/me/produce/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const currentFarmer = await farmerDomainService.getMyProfile(user.sub);
    const updated = await farmerDomainService.updateFarmerProduce(currentFarmer.id, req.params.id, req.body, {
      userId: user.sub,
      role: user.role,
      farmerId: user.farmerId
    });
    return res.status(200).json({
      success: true,
      message: 'Farmer produce declaration updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/farmers/me/produce/:id/confirm
 * Confirms an active produce declaration after 5-minute edit window or via farmer confirmation
 */
router.post('/me/produce/:id/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const currentFarmer = await farmerDomainService.getMyProfile(user.sub);
    const confirmed = await farmerDomainService.confirmFarmerProduce(currentFarmer.id, req.params.id, {
      userId: user.sub,
      role: user.role,
      farmerId: user.farmerId
    });
    return res.status(200).json({
      success: true,
      message: 'Farmer produce declaration confirmed successfully',
      data: confirmed
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/farmers
 * Admin / Staff Farmer Search & Listing with Pagination
 */
router.get('/', authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'ADMIN', 'CENTRE_MANAGER', 'PROCUREMENT_OFFICER']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
    const result = await farmerDomainService.searchFarmers(
      {
        page,
        pageSize,
        district: req.query.district as string,
        verificationStatus: req.query.verificationStatus as string,
        status: req.query.status as string,
        search: req.query.search as string
      },
      { userId: user.sub, role: user.role }
    );
    return res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/farmers/:id
 * Retrieves farmer details by farmer ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const farmer = await farmerDomainService.getFarmerProfile(req.params.id, {
      userId: user.sub,
      role: user.role,
      farmerId: user.farmerId
    });
    return res.status(200).json({
      success: true,
      data: farmer
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/farmers/:id
 * Updates specific farmer profile by ID
 */
router.patch('/:id', validateRequest(updateFarmerProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const updated = await farmerDomainService.updateFarmerProfile(req.params.id, req.body, {
      userId: user.sub,
      role: user.role,
      farmerId: user.farmerId,
      ipAddress: req.ip
    });
    return res.status(200).json({
      success: true,
      message: 'Farmer profile updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/farmers/:id/status
 * Updates farmer account status (Active, Suspended, Inactive)
 */
router.patch('/:id/status', authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'ADMIN']), validateRequest(updateFarmerStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const updated = await farmerDomainService.updateFarmerStatus(req.params.id, req.body.status, {
      userId: user.sub,
      role: user.role,
      ipAddress: req.ip
    });
    return res.status(200).json({
      success: true,
      message: `Farmer status updated to ${req.body.status}`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/farmers/:id/verify
 * Updates farmer verification status (Verified, Pending, Rejected)
 */
router.patch('/:id/verify', authorizeRole(['SYSTEM_ADMIN', 'DISTRICT_ADMIN', 'ADMIN']), validateRequest(verifyFarmerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const updated = await farmerDomainService.verifyFarmer(req.params.id, req.body.verificationStatus, {
      userId: user.sub,
      role: user.role,
      ipAddress: req.ip
    });
    return res.status(200).json({
      success: true,
      message: `Farmer verification status updated to ${req.body.verificationStatus}`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

export default router;
