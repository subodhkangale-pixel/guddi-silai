import { Request, Response, NextFunction } from 'express';

type AsyncHandler = (
  req: Request,
  res: Response
) => Promise<void>;

export function asyncHandler(handler: AsyncHandler) {
  return (_req: Request, _res: Response, next: NextFunction) => {
    handler(_req, _res).catch(next);
  };
}

export function getParamId(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) throw new Error(`Missing route param: ${name}`);
  return value;
}