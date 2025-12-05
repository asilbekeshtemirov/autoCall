import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';

async function assignOperatorHandler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (_user, request) => {
    try {
      const { id: campaignId } = params;
      const { operatorId } = await request.json();

      if (!operatorId) {
        return NextResponse.json(
          { error: 'Operator ID is required' },
          { status: 400 }
        );
      }

      const data = await SipuniAPI.assignOperators(campaignId, [operatorId]);

      return NextResponse.json({
        success: true,
        message: 'Operator assigned successfully',
        data,
      });
    } catch (error: any) {
      console.error('[API /campaigns/operators] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to assign operator' },
        { status: 500 }
      );
    }
  });
}

export const POST = assignOperatorHandler;