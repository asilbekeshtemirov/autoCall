/**
 * GET /api/campaigns/[id]/numbers - Get uploaded phone numbers for campaign
 * POST /api/campaigns/[id]/numbers - Upload phone numbers to campaign
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

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async () => {
    try {
      const { id } = params;
      const { searchParams } = new URL(request.url);
      const max = parseInt(searchParams.get('max') || '1000');
      const pos = parseInt(searchParams.get('pos') || '0');

      console.log('[API /campaigns/[id]/numbers] Fetching uploaded numbers for campaign:', id);
      const response = await SipuniAPI.getUploadedNumbers(id, max, pos);

      console.log('[API /campaigns/[id]/numbers] Sipuni response:', JSON.stringify(response, null, 2));

      // Handle different response structures
      let numbers = [];
      if (Array.isArray(response)) {
        numbers = response;
      } else if (response && Array.isArray(response.data)) {
        numbers = response.data;
      } else if (response && response.data && typeof response.data === 'object') {
        // Convert object to array (Sipuni might return as object with IDs as keys)
        numbers = Object.values(response.data);
      }

      return NextResponse.json({
        success: true,
        data: numbers,
      });
    } catch (error: any) {
      console.error('[API /campaigns/[id]/numbers] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch uploaded numbers' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async () => {
    try {
      const { id } = params;
      const body = await request.json();
      const { numbers } = body;

      if (!numbers || !Array.isArray(numbers)) {
        return NextResponse.json(
          { error: 'Numbers array is required' },
          { status: 400 }
        );
      }

      console.log('[API /campaigns/numbers] Uploading numbers for campaign:', id);
      console.log('[API /campaigns/numbers] Number count:', numbers.length);
      console.log('[API /campaigns/numbers] Numbers:', numbers);

      // Send to Sipuni API
      const response = await SipuniAPI.uploadPhoneNumbers(id, numbers);

      console.log('[API /campaigns/numbers] Sipuni response:', JSON.stringify(response, null, 2));

      return NextResponse.json({
        success: true,
        message: `Successfully uploaded ${numbers.length} phone numbers to Sipuni`,
        data: response,
      });
    } catch (error: any) {
      console.error('[API /campaigns/numbers] Error:', error);
      console.error('[API /campaigns/numbers] Error details:', {
        message: error.message,
        endpoint: error.endpoint,
      });
      return NextResponse.json(
        { error: error.message || 'Failed to upload phone numbers' },
        { status: 500 }
      );
    }
  });
}
