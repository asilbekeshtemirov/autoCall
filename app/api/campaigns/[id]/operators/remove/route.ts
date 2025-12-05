/**
 * POST /api/campaigns/[id]/operators/remove - Unassign multiple operators from campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';

interface RouteParams {
    params: {
        id: string;
    };
}

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

            console.log('[API /operators/remove] Unassigning from campaign:', id, 'operators:', operatorIds);

            const results = [];
            for (const operatorId of operatorIds) {
                try {
                    const response = await SipuniAPI.unassignOperator(id, operatorId);
                    results.push({ operatorId, success: true, response });
                } catch (err) {
                    console.error(`Failed to unassign operator ${operatorId}:`, err);
                    results.push({ operatorId, success: false, error: err instanceof Error ? err.message : 'Error' });
                }
            }

            const successCount = results.filter(r => r.success).length;

            return NextResponse.json({
                success: successCount > 0,
                message: `Unassigned ${successCount} of ${operatorIds.length} operator(s)`,
                data: results,
            });
        } catch (error: any) {
            console.error('[API /operators/remove] Error:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to unassign operators' },
                { status: 500 }
            );
        }
    });
}
