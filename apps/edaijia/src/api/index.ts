import express, { Router } from 'express';
import { AppDeps } from '../adapters/types';
import { geoRouter } from './geo';
import { parseRouter } from './parse';
import { verifyRouter } from './verify';
import { orderRouter } from './order';
import cityRouter from './city';

export function createApiRouter(deps: AppDeps): Router {
  const r = Router();
  r.use(express.json());
  r.use(geoRouter(deps));
  r.use(parseRouter(deps));
  r.use(verifyRouter(deps));
  r.use(orderRouter(deps));
  r.use(cityRouter);
  return r;
}
