import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';

async function unassignOperatorHandler(
  req: NextRequest,
  { params }: { params: { id: string; operatorId: string } }
) {
  return withAuth(req, async (user, request) => {
    try {
      const { id: campaignId, operatorId } = params;

      if (!operatorId) {
        return NextResponse.json(
          { error: 'Operator ID is required' },
          { status: 400 }
        );
      }

      await SipuniAPI.unassignOperator(campaignId, operatorId);

      return NextResponse.json({
        success: true,
        message: 'Operator unassigned successfully',
      });
    } catch (error: any) {
      console.error('[API /campaigns/operators/delete] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to unassign operator' },
        { status: 500 }
      );
    }
  });
}

export const DELETE = unassignOperatorHandler;
