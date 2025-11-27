/**
 * PUT /api/campaigns/select-line - Select a phone number/line for campaign
 * Sets selected: true on the specified line in Sipuni
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';

export async function PUT(request: NextRequest) {
  return withAuth(request, async (user, req) => {
    try {
      const body = await req.json();
      const { lineId } = body;

      if (!lineId) {
        return NextResponse.json(
          { error: 'lineId is required' },
          { status: 400 }
        );
      }

      console.log('[API /campaigns/select-line] Selecting line:', lineId);

      // Update the line to set selected: true in Sipuni
      const response = await SipuniAPI.updateCampaign(lineId, { selected: true });

      console.log('[API /campaigns/select-line] Line selected:', response);

      return NextResponse.json({
        success: true,
        message: 'Phone number selected',
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
        { error: error.message || 'Failed to select phone number' },
        { status: 500 }
      );
    }
  });
}
