/**
 * PUT /api/campaigns/select-line - Select a phone number/line for campaign
 * Updates the campaign's outLineId to assign the line
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

      console.log('[API /campaigns/select-line] Assigning line:', lineId, 'to campaign:', campaignId);

      // Update campaign with the selected line ID
      // This actually assigns the line to the campaign (not just marking it selected)
      const updateData = {
        outLineId: parseInt(lineId, 10)
      };

      console.log('[API /campaigns/select-line] Updating campaign with:', updateData);

      const response = await SipuniAPI.updateCampaign(campaignId, updateData);

      console.log('[API /campaigns/select-line] Campaign updated:', JSON.stringify(response, null, 2));
      console.log('[API /campaigns/select-line] Response success:', response?.success);

      return NextResponse.json({
        success: true,
        message: 'Phone line assigned to campaign',
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
        { error: error.message || 'Failed to assign phone line' },
        { status: 500 }
      );
    }
  });
}
