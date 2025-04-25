import { handleLogin } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('Login route - URL:', req.url)
  console.log('Login route - Headers:', Object.fromEntries(req.headers.entries()))
  
  try {
    const response = await handleLogin(req)
    console.log('Login route - Réponse:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    })
    return response
  } catch (error) {
    console.error('Login route - Erreur:', error)
    throw error
  }
} 