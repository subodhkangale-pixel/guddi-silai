import { Router, Response } from 'express';

const router: Router = Router();

router.get('/', (_req, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'guddi-silai-api',
  });
});

export default router;