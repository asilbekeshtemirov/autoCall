/**
 * PUT /api/campaigns/select-line - Select a phone number/line for campaign
 * Sets selected: true on the specified line in Sipuni using PUT method
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';

export async function PUT(request: NextRequest) {
  return withAuth(request, async (user, req) => {
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
      console.log('[API /campaigns/select-line] Request body:', { id: lineId, selected: true });

      // Update the line to set selected: true in Sipuni using selectLine method with PATCH
      const response = await SipuniAPI.selectLine(campaignId, lineId, true);

      console.log('[API /campaigns/select-line] Full Sipuni response:', JSON.stringify(response, null, 2));
      console.log('[API /campaigns/select-line] Response status code:', response?.statusCode);
      console.log('[API /campaigns/select-line] Response success:', response?.success);
      console.log('[API /campaigns/select-line] Selected field in data:', response?.data?.map((d: any) => ({ id: d.id, name: d.name, selected: d.selected })));

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
