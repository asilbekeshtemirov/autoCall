/**
 * GET /api/lines - Get available phone lines
 *
 * All requests require authentication (JWT token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';

/**
 * GET /api/lines
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (user, req) => {
    try {
      console.log('[API /lines] Fetching phone lines from Sipuni...');
      const response = await SipuniAPI.getPhoneLines();

      console.log('[API /lines] Sipuni response:', JSON.stringify(response, null, 2));

      // Sipuni API returns { data: [...] } with phone line objects
      let lines = [];
      if (response && Array.isArray(response.data)) {
        lines = response.data;
      } else if (Array.isArray(response)) {
        lines = response;
      } else if (response && response.items) {
        lines = response.items;
      }

      console.log('[API /lines] Returning lines:', lines.length);

      return NextResponse.json({
        success: true,
        count: lines.length,
        data: lines,
      });
    } catch (error: any) {
      console.error('[API /lines] Error:', error);
      console.error('[API /lines] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return NextResponse.json(
        { error: error.message || 'Failed to fetch phone lines' },
        { status: 500 }
      );
    }
  });
}
