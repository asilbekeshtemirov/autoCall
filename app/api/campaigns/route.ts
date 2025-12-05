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
      // Exact format from Sipuni dashboard
      const sipuniPayload = {
        // Required fields
        type: body.type || 'predict',
        workMode: body.workMode || 'default',
        name: body.name || '',

        // Core settings
        cooldown: String(body.cooldown || 60),
        maxConnections: body.maxConnections || 1,
        minDuration: String(body.minDuration || 20),
        callAttemptTime: body.callAttemptTime || 30,

        // Time settings
        timeMin: body.timeMin || '06:00',
        timeMax: body.timeMax || '22:00',
        timezone: body.timezone || 'Asia/Tashkent',

        // Optional settings with defaults
        predictCoef: String(body.predictCoef || 4),
        priority: body.priority || '',
        statUrl: body.statUrl || '',

        // Audio settings
        audioId: body.audioId || null,
        audioName: body.audioName || '',
        autoAnswer: body.autoAnswer || false,

        // Tree settings
        inTree: body.inTree || '',
        defaultInTree: body.defaultInTree || false,
        distributor: body.distributor || false,

        // Phone lines
        lines: body.lines || '',

        // Recall settings
        recallMissed: body.recallMissed || '',
        recallMissedTimeout: body.recallMissedTimeout || '',

        // Schedule - all days off by default
        day_0: body.day_0 || false,
        day_1: body.day_1 || false,
        day_2: body.day_2 || false,
        day_3: body.day_3 || false,
        day_4: body.day_4 || false,
        day_5: body.day_5 || false,
        day_6: body.day_6 || false,

        // Time schedule
        timeStart: body.timeStart || null,
        timeEnd: body.timeEnd || null,

        // File upload (not used)
        file: null,
        fileName: null,
        id: 0,
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
