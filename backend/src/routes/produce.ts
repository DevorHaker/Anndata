import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validateRequest } from '../middleware/validation';
import { farmerDomainService } from '../services/farmerDomain.service';
import { addFarmerProduceSchema } from '../validators/farmer.validator';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/produce/crops
 * Master data endpoint returning active crop types
 */
router.get('/crops', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const crops = await farmerDomainService.getCropTypes();
    return res.status(200).json({
      success: true,
      data: crops
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/produce/farmers/:farmerId
 * List produce for a specific farmer ID
 */
router.get('/farmers/:farmerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const produceList = await farmerDomainService.listFarmerProduce(req.params.farmerId, {
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
 * POST /api/v1/produce/farmers/:farmerId
 * Add produce declaration for a specific farmer ID
 */
router.post('/farmers/:farmerId', validateRequest(addFarmerProduceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const produce = await farmerDomainService.addFarmerProduce(req.params.farmerId, req.body, {
      userId: user.sub,
      role: user.role,
      farmerId: user.farmerId
    });
    return res.status(201).json({
      success: true,
      message: 'Produce declaration created successfully',
      data: produce
    });
  } catch (err) {
    next(err);
  }
});

export default router;
