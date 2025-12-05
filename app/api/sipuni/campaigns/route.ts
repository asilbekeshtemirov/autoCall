/**
 * GET /api/campaigns - Get list of campaigns
 * POST /api/campaigns - Create new campaign
 *
 * All requests require authentication (JWT token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';

/**
 * GET /api/campaigns?max=50&pos=0
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (_user, req) => {
    try {
      const { searchParams } = new URL(req.url);
      const max = parseInt(searchParams.get('max') || '50');
      const pos = parseInt(searchParams.get('pos') || '0');

      console.log('[API /campaigns] Fetching campaigns from Sipuni...');
      const response = await SipuniAPI.getCampaigns(max, pos);

      console.log('[API /campaigns] Sipuni response:', JSON.stringify(response, null, 2));

      // Sipuni API returns { data: {...} } as object with IDs as keys, or direct array
      let campaigns = [];
      if (Array.isArray(response)) {
        campaigns = response;
      } else if (response && Array.isArray(response.data)) {
        campaigns = response.data;
      } else if (response && response.data && typeof response.data === 'object') {
        // Convert object to array (Sipuni returns campaigns as object with IDs as keys)
        campaigns = Object.values(response.data);
      } else if (response && response.items) {
        campaigns = response.items;
      }

      console.log('[API /campaigns] Returning campaigns:', campaigns.length);

      return NextResponse.json({
        success: true,
        data: campaigns,
      });
    } catch (error: any) {
      console.error('[API /campaigns] Error:', error);
      console.error('[API /campaigns] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return NextResponse.json(
        { error: error.message || 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/campaigns
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (_user, req) => {
    try {
      const body = await req.json();

      const data = await SipuniAPI.createCampaign(body);

      return NextResponse.json({
        success: true,
        data,
      }, { status: 201 });
    } catch (error: any) {
      console.error('Create campaign error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create campaign' },
        { status: 500 }
      );
    }
  });
}
