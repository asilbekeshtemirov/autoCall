/**
 * GET /api/campaigns/[id]/report - Get call report for campaign
 *
 * All requests require authentication (JWT token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';
import { formatReport } from '@/lib/response-formatter';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (user, req) => {
    try {
      const { id } = params;

      console.log('[API /campaigns/[id]/report] Fetching call report for campaign:', id);
      const response = await SipuniAPI.getCallReport(id);

      console.log('[API /campaigns/[id]/report] Sipuni response:', JSON.stringify(response, null, 2));

      // Extract data from response - Sipuni returns { data: {...}, success: true, statusCode: 200 }
      const reportData = response.data || response;

      // Format the report with statistics and calls
      const formattedReport = formatReport(reportData);

      console.log('[API /campaigns/[id]/report] Formatted report:', formattedReport);

      return NextResponse.json({
        success: true,
        data: formattedReport,
      });
    } catch (error: any) {
      console.error('[API /campaigns/[id]/report] Error:', error);
      console.error('[API /campaigns/[id]/report] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return NextResponse.json(
        { error: error.message || 'Failed to fetch call report' },
        { status: 500 }
      );
    }
  });
}
