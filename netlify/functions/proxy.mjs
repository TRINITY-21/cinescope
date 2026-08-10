import proxyHandler from '../../api/proxy.js';
import { runVercelHandler } from '../lib/vercel-adapter.mjs';

export default async function handler(request) {
  return runVercelHandler(proxyHandler, request);
}
