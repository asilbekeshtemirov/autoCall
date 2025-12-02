/**
 * GET /api/campaigns/[id]/operators - Get assigned operators
 * POST /api/campaigns/[id]/operators - Assign operators to campaign
 *
 * All requests require authentication (JWT token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/campaigns/[id]/operators
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async () => {
    try {
      const { id } = params;

      console.log('[API /campaigns/operators] Fetching operators for campaign:', id);
      const response = await SipuniAPI.getCampaignOperators(id);

      console.log('[API /campaigns/operators] Sipuni response:', JSON.stringify(response, null, 2));

      // Handle different response structures from Sipuni
      let operators = [];
      if (Array.isArray(response)) {
        operators = response;
      } else if (response && Array.isArray(response.operators)) {
        // Check for operators array
        operators = response.operators;
      } else if (response && Array.isArray(response.data)) {
        operators = response.data;
      } else if (response && response.data && typeof response.data === 'object') {
        // Convert object to array
        operators = Object.values(response.data);
      }

      console.log('[API /campaigns/operators] Returning operators:', operators.length);

      return NextResponse.json({
        success: true,
        data: operators,
      });
    } catch (error: any) {
      console.error('[API /campaigns/operators] Error:', error);
      console.error('[API /campaigns/operators] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return NextResponse.json(
        { error: error.message || 'Failed to fetch operators' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/campaigns/[id]/operators
 * Assign operators to campaign
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async () => {
    try {
      const { id } = params;
      const body = await request.json();
      const { operatorIds } = body;

      if (!operatorIds || !Array.isArray(operatorIds)) {
        return NextResponse.json(
          { error: 'operatorIds array is required' },
          { status: 400 }
        );
      }

      // Convert string IDs to numbers if needed
      const numericIds = operatorIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id);

      console.log('[API /campaigns/operators] Assigning operators to campaign:', id);
      console.log('[API /campaigns/operators] Operator IDs:', numericIds);

      const response = await SipuniAPI.assignOperators(id, numericIds);

      console.log('[API /campaigns/operators] Sipuni response:', JSON.stringify(response, null, 2));

      return NextResponse.json({
        success: true,
        message: `Successfully assigned ${numericIds.length} operator(s) to campaign`,
        data: response,
      });
    } catch (error: any) {
      console.error('[API /campaigns/operators] Error:', error);
      console.error('[API /campaigns/operators] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return NextResponse.json(
        { error: error.message || 'Failed to assign operators' },
        { status: 500 }
      );
    }
  });
}
