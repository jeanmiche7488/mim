import { handleLogout } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

export const GET = handleLogout({
  returnTo: `${process.env.AUTH0_BASE_URL}/auth`
}); 