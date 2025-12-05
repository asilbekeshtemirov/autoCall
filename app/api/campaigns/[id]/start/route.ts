/**
 * POST /api/campaigns/[id]/start
 *
 * Start/launch a campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (_user, _req) => {
    try {
      const { id } = params;

      console.log('[API /campaigns/start] Starting campaign:', id);
      const response = await SipuniAPI.startCampaign(id);

      console.log('[API /campaigns/start] Sipuni response:', JSON.stringify(response, null, 2));

      return NextResponse.json({
        success: true,
        message: 'Campaign started successfully',
        data: response,
      });
    } catch (error: any) {
      console.error('[API /campaigns/start] Error:', error);
      console.error('[API /campaigns/start] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return NextResponse.json(
        { error: error.message || 'Failed to start campaign' },
        { status: 500 }
      );
    }
  });
}
