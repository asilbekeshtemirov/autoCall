/**
 * GET /api/campaigns - Get list of campaigns
 * POST /api/campaigns - Create new campaign
 *
 * All requests require authentication (JWT token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';
import { formatCampaign, formatCampaignList } from '@/lib/response-formatter';

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

      // Format response - show only essential data
      const formattedCampaigns = formatCampaignList(campaigns);

      return NextResponse.json({
        success: true,
        count: formattedCampaigns.length,
        data: formattedCampaigns,
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
 *
 * Accepts simplified campaign data from frontend and maps it to Sipuni API format
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (_user, req) => {
    try {
      const body = await req.json();

      console.log('[API /campaigns POST] Received campaign data:', body);

      // Map frontend payload to Sipuni API payload structure
      // Based on working curl: https://apilk.sipuni.com/api/ver2/autocall/
      const sipuniPayload = {
        name: body.name || '',
        description: body.description || '',
        cooldown: body.cooldown ? parseInt(body.cooldown) : 60,
        strategy: body.strategy || 1,
        isRoboCall: body.isRoboCall || 0,
        type: body.type || 'predict',
        maxConnections: body.maxConnections ? parseInt(body.maxConnections) : 1,
        distributor: body.distributor || 0,
        defaultInTree: body.defaultInTree !== undefined ? body.defaultInTree : 1,
        outLineId: body.outLineId ? parseInt(body.outLineId) : 0,
        treeId: body.treeId || 0,
        userId: body.userId || 0,
      };

      console.log('[API /campaigns POST] Mapped to Sipuni payload:', sipuniPayload);

      const response = await SipuniAPI.createCampaign(sipuniPayload);

      console.log('[API /campaigns POST] Sipuni response:', JSON.stringify(response, null, 2));

      // Format response - formatCampaign handles nested response.data.autocall structure
      const formattedData = formatCampaign(response);

      console.log('[API /campaigns POST] Campaign created:', formattedData);

      return NextResponse.json({
        success: true,
        message: 'Campaign created successfully',
        data: formattedData,
      }, { status: 200 });
    } catch (error: any) {
      console.error('Create campaign error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to create campaign',
          message: `Failed to create campaign: ${error.message}`
        },
        { status: 500 }
      );
    }
  });
}
