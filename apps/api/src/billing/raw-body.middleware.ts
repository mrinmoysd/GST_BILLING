import type { Request, Response, NextFunction } from 'express';

// Minimal raw body capture for webhook signature verification.
// If Content-Type is application/json, Nest will have parsed req.body.
// For robust verification, you'd configure the express raw body for the webhook route.
// This middleware just ensures req.body is at least defined.
export function rawBodyMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (req.body === undefined) {
    (req as any).body = {};
  }
  next();
}
