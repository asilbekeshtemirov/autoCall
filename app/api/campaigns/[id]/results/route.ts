/**
 * GET /api/campaigns/[id]/results
 *
 * Get campaign call results
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (userPayload, nextRequest) => {
    try {
      const { id } = params;
      const { searchParams } = new URL(req.url);
      const max = parseInt(searchParams.get('max') || '100');
      const pos = parseInt(searchParams.get('pos') || '0');

      console.log('[API /campaigns/results] Fetching results for campaign:', id);
      const response = await SipuniAPI.getCallResults(id, max, pos);

      console.log('[API /campaigns/results] Sipuni response:', JSON.stringify(response, null, 2));

      // Handle different response structures
      let results = [];
      if (Array.isArray(response)) {
        results = response;
      } else if (response && Array.isArray(response.data)) {
        results = response.data;
      } else if (response && response.data && typeof response.data === 'object') {
        // Convert object to array
        results = Object.values(response.data);
      }

      console.log('[API /campaigns/results] Returning results:', results.length);

      return NextResponse.json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      console.error('[API /campaigns/results] Error:', error);
      console.error('[API /campaigns/results] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return NextResponse.json(
        { error: error.message || 'Failed to fetch results' },
        { status: 500 }
      );
    }
  });
}
