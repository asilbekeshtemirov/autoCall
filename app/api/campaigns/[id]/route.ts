/**
 * GET /api/campaigns/[id] - Get campaign details
 * PUT /api/campaigns/[id] - Update campaign
 * DELETE /api/campaigns/[id] - Delete campaign
 *
 * All requests require authentication (JWT token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';
import { formatCampaign } from '@/lib/response-formatter';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/campaigns/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (user, req) => {
    try {
      const { id } = params;

      console.log('[API /campaigns/[id]] Fetching campaign:', id);
      const response = await SipuniAPI.getCampaign(id);

      console.log('[API /campaigns/[id]] Sipuni response:', JSON.stringify(response, null, 2));

      // Handle different response structures
      let campaign = {};

      if (Array.isArray(response)) {
        // If response is array, find campaign by id or take first
        campaign = response.find((c: any) => c.id === id || c.id === parseInt(id)) || response[0] || {};
      } else if (response && response.data) {
        // If response has data property
        if (Array.isArray(response.data)) {
          campaign = response.data.find((c: any) => c.id === id || c.id === parseInt(id)) || response.data[0] || {};
        } else {
          campaign = response.data;
        }
      } else if (response) {
        campaign = response;
      }

      // Format response
      const formattedCampaign = formatCampaign(campaign);

      console.log('[API /campaigns/[id]] Returning campaign:', formattedCampaign);

      return NextResponse.json({
        success: true,
        data: formattedCampaign,
      });
    } catch (error: any) {
      console.error('[API /campaigns/[id]] Error:', error);
      console.error('[API /campaigns/[id]] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return NextResponse.json(
        { error: error.message || 'Failed to fetch campaign' },
        { status: 500 }
      );
    }
  });
}

/**
 * PUT /api/campaigns/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (user, req) => {
    try {
      const { id } = params;
      const body = await req.json();

      const data = await SipuniAPI.updateCampaign(id, body);

      return NextResponse.json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('Update campaign error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update campaign' },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE /api/campaigns/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (user, req) => {
    try {
      const { id } = params;

      const data = await SipuniAPI.deleteCampaign(id);

      return NextResponse.json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('Delete campaign error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete campaign' },
        { status: 500 }
      );
    }
  });
}
