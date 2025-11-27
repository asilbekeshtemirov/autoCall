/**
 * Auth Middleware Helper
 *
 * Verify JWT token in API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, UserPayload } from './models/user';

/**
 * Verify authentication and return user payload
 * Returns null if auth fails
 */
export function verifyAuth(request: NextRequest): UserPayload | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

/**
 * Middleware wrapper for protected routes
 * Usage:
 *   export async function GET(request: NextRequest) {
 *     return withAuth(request, async (userPayload) => {
 *       // Your protected route logic here
 *       return NextResponse.json({ data: 'protected data' });
 *     });
 *   }
 */
export async function withAuth(
  request: NextRequest,
  handler: (userPayload: UserPayload, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const userPayload = verifyAuth(request);

  if (!userPayload) {
    return NextResponse.json(
      { error: 'Unauthorized. Please login.' },
      { status: 401 }
    );
  }

  return handler(userPayload, request);
}
