/**
 * GET /api/employees - Get list of employees/operators
 *
 * All requests require authentication (JWT token)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { SipuniAPI } from '@/lib/sipuni-server';

/**
 * GET /api/employees
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (user, req) => {
    try {
      console.log('[API /employees] Fetching employees from Sipuni...');
      const response = await SipuniAPI.getEmployees();

      console.log('[API /employees] Sipuni response:', JSON.stringify(response, null, 2));

      // Sipuni API returns { employees: [...] } or { data: [...] } or direct array
      let employees = [];
      if (Array.isArray(response)) {
        employees = response;
      } else if (response && Array.isArray(response.employees)) {
        // Sipuni returns { employees: [...], success: true, ... }
        employees = response.employees;
      } else if (response && Array.isArray(response.data)) {
        employees = response.data;
      } else if (response && response.data && typeof response.data === 'object') {
        // Convert object to array if needed
        employees = Object.values(response.data);
      }

      console.log('[API /employees] Returning employees:', employees.length);

      return NextResponse.json({
        success: true,
        data: employees,
      });
    } catch (error: any) {
      console.error('[API /employees] Error:', error);
      console.error('[API /employees] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return NextResponse.json(
        { error: error.message || 'Failed to fetch employees' },
        { status: 500 }
      );
    }
  });
}
