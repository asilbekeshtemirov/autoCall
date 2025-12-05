/**
 * PUT /api/campaigns/select-line - Select a phone number/line for campaign
 * Uses Sipuni's /autocall-outline/ endpoint with PATCH method
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';

export async function PUT(request: NextRequest) {
  return withAuth(request, async (_user, req) => {
    try {
      const body = await req.json();
      const { lineId, campaignId } = body;

      if (!lineId || !campaignId) {
        return NextResponse.json(
          { error: 'lineId and campaignId are required' },
          { status: 400 }
        );
      }

      console.log('[API /campaigns/select-line] Selecting line:', lineId, 'for campaign:', campaignId);

      // Use the SipuniAPI.selectLine method which uses PATCH /autocall-outline/
      const response = await SipuniAPI.selectLine(campaignId, lineId);

      console.log('[API /campaigns/select-line] Response:', JSON.stringify(response, null, 2));

      return NextResponse.json({
        success: true,
        message: 'Phone line selected for campaign',
        data: response,
      });
    } catch (error: any) {
      console.error('[API /campaigns/select-line] Error:', error);
      console.error('[API /campaigns/select-line] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return NextResponse.json(
        { error: error.message || 'Failed to select phone line' },
        { status: 500 }
      );
    }
  });
}
