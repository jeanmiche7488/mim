import { handleLogout } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

export const GET = handleLogout({
  returnTo: 'https://mim.localhost:3000/auth'
}); 