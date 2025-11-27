/**
 * GET /api/employees/extensions - Get employee extensions
 *
 * All requests require authentication (JWT token)
 */
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';

async function getEmployeeExtensionsHandler(req: NextRequest) {
  return withAuth(req, async (user, req) => {
    try {
      const data = await SipuniAPI.getEmployeeExtensions();
      return NextResponse.json({ success: true, data });
    } catch (error: any) {
      console.error('[API /employees/extensions] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch employee extensions' },
        { status: 500 }
      );
    }
  });
}

export const GET = getEmployeeExtensionsHandler;