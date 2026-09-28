import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server';

export const config = {
  runtime: 'nodejs',
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as never, res as never);
}