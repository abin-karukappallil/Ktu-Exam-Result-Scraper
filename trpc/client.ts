import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from './routers/_app';

export const trpc = createTRPCReact<AppRouter>();

let _apiToken = "";

export function setApiToken(token: string) {
  _apiToken = token;
}

export function getApiToken(): string {
  return _apiToken;
}