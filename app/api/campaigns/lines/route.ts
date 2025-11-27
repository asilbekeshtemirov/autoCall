/**
 * GET /api/campaigns/lines - Get available phone numbers/lines
 * Fetches the list of available lines that can be selected for a campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { callSipuni } from '@/lib/sipuni-server';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user, req) => {
    try {
      console.log('[API /campaigns/lines] Fetching available lines from Sipuni...');

      // Get available lines/numbers from Sipuni
      // This should return items like: [{id: 9881507, name: "mvp project", selected: false}, {id: 8404457, name: "998785555505", selected: true}]
      const response = await callSipuni('/autocall-outline/', 'GET');

      console.log('[API /campaigns/lines] Sipuni response:', JSON.stringify(response, null, 2));

      // Extract data from response
      let lines = [];
      if (Array.isArray(response)) {
        lines = response;
      } else if (response && Array.isArray(response.data)) {
        lines = response.data;
      } else if (response && typeof response === 'object') {
        // If response is object with items, convert to array
        lines = Object.values(response).filter((item: any) => item && typeof item === 'object');
      }

      console.log('[API /campaigns/lines] Returning lines:', lines.length);

      return NextResponse.json({
        success: true,
        count: lines.length,
        data: lines,
      });
    } catch (error: any) {
      console.error('[API /campaigns/lines] Error:', error);
      console.error('[API /campaigns/lines] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return NextResponse.json(
        { error: error.message || 'Failed to fetch available lines' },
        { status: 500 }
      );
    }
  });
}
