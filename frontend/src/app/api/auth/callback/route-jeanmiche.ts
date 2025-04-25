import { handleCallback } from '@auth0/nextjs-auth0';

export const GET = handleCallback({
  redirectUri: 'https://mim.localhost:3000/api/auth/callback'
}); 