/**
 * Server-side Sipuni API Client
 *
 * IMPORTANT: This file should ONLY be used in server-side code (API routes, server components)
 * NEVER import this in client components - it exposes the Sipuni token!
 *
 * Usage in API routes:
 * import { callSipuni } from '@/lib/sipuni-server';
 * const campaigns = await callSipuni('/autocall/', 'GET');
 */

const SIPUNI_API_BASE_URL = process.env.SIPUNI_API_BASE_URL || 'https://apilk.sipuni.com/api/ver2';
const SIPUNI_TOKEN = process.env.SIPUNI_TOKEN;
const SIPUNI_AUTOCALL_TOKEN = process.env.SIPUNI_AUTOCALL_TOKEN || SIPUNI_TOKEN; // Separate token for autocall endpoint if needed

if (!SIPUNI_TOKEN) {
  console.warn('⚠️ SIPUNI_TOKEN not found in environment variables. API calls will fail.');
} else {
  console.log('✅ SIPUNI_TOKEN loaded.');
  console.log('   Length:', SIPUNI_TOKEN.length);
  console.log('   Starts:', SIPUNI_TOKEN.substring(0, 50));
  console.log('   Ends:', SIPUNI_TOKEN.substring(SIPUNI_TOKEN.length - 50));
}

if (SIPUNI_AUTOCALL_TOKEN !== SIPUNI_TOKEN) {
  console.log('✅ SIPUNI_AUTOCALL_TOKEN loaded (separate token for /autocall endpoint).');
}

/**
 * Make authenticated requests to Sipuni API
 * All requests use the admin token from .env (server-side only)
 */
export async function callSipuni<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  data?: any
): Promise<T> {
  if (!SIPUNI_TOKEN) {
    throw new Error('Sipuni token not configured. Check your .env file.');
  }

  const url = `${SIPUNI_API_BASE_URL}${endpoint}`;

  // Use separate token for /autocall endpoint if configured
  const token = endpoint.includes('/autocall') ? SIPUNI_AUTOCALL_TOKEN : SIPUNI_TOKEN;
  const authHeader = `Bearer ${token}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    },
  };

  console.log('🔐 Auth header length:', authHeader.length);
  console.log('🔐 Auth header first 30 chars:', authHeader.substring(0, 30));
  console.log('🔐 Auth header last 30 chars:', authHeader.substring(authHeader.length - 30));

  if (method !== 'GET' && data) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log('📤 Sipuni API Request:', {
      endpoint,
      method,
      url,
      body: data,
      authHeader: `Bearer ${SIPUNI_TOKEN.substring(0, 20)}...${SIPUNI_TOKEN.substring(SIPUNI_TOKEN.length - 10)}`,
    });

    // Use AbortController for proper timeout handling in Node.js
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout
    options.signal = controller.signal;

    console.log('📨 Sending request with Authorization header');
    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    console.log('📥 Sipuni API Response Status:', response.status);

    // Handle non-200 responses
    if (!response.ok) {
      let errorData: any = { error: 'Unknown error' };
      try {
        const text = await response.text();
        if (text) {
          errorData = JSON.parse(text);
        }
      } catch (parseError) {
        // If JSON parsing fails, use the status text
        errorData = { error: response.statusText, status: response.status };
      }

      console.error('❌ Sipuni API Error Response:', {
        endpoint,
        method,
        status: response.status,
        statusText: response.statusText,
        errorData,
        fullResponse: errorData,
      });

      const errorMessage =
        errorData.error ||
        errorData.message ||
        errorData.msg ||
        errorData.description ||
        `Sipuni API error: ${response.status} ${response.statusText}`;

      console.error(`❌ Error for endpoint ${endpoint}: ${errorMessage}`);

      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log('✅ Sipuni API Success:', {
      endpoint,
      method,
      responseData,
    });

    return responseData;
  } catch (error) {
    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError = new Error('Sipuni API request timed out after 90 seconds');
      console.error('⏱️ Sipuni API Timeout:', {
        endpoint,
        method,
        url,
        error: timeoutError.message,
      });
      throw timeoutError;
    }

    console.error('🔴 Sipuni API Error:', {
      endpoint,
      method,
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Type-safe Sipuni API Methods
 * These provide autocomplete and type checking for common endpoints
 */
export const SipuniAPI = {
  /**
   * Get list of campaigns
   */
  getCampaigns: async (max: number = 50, pos: number = 0) => {
    return callSipuni(`/autocall/?max=${max}&pos=${pos}`, 'GET');
  },

  /**
   * Get campaign details
   */
  getCampaign: async (id: string) => {
    return callSipuni(`/autocall-outline/?autocall=${id}`, 'GET');
  },

  /**
   * Select/Mark line as selected in campaign
   * PATCH to /autocall-outline/ with NO query parameters (like Sipuni dashboard does)
   * Body: { autocall: campaignId, id: lineId, selected: true }
   */
  selectLine: async (campaignId: string, lineId: string, selected: boolean = true) => {
    const lineIdInt = parseInt(lineId, 10);
    const campaignIdInt = parseInt(campaignId, 10);
    const endpoint = `/autocall-outline/`;
    const body = { autocall: campaignIdInt, id: lineIdInt, selected };
    console.log('[SipuniAPI.selectLine] PATCH /autocall-outline/ endpoint:', endpoint);
    console.log('[SipuniAPI.selectLine] PATCH body:', JSON.stringify(body));
    const response = await callSipuni(endpoint, 'PATCH', body);
    console.log('[SipuniAPI.selectLine] PATCH Response status code:', response?.statusCode);
    console.log('[SipuniAPI.selectLine] PATCH Response success:', response?.success);
    console.log('[SipuniAPI.selectLine] PATCH Response data selected values:', response?.data?.map((d: any) => ({ id: d.id, selected: d.selected })));
    return response;
  },

  /**
   * Create new campaign
   */
  createCampaign: async (data: any) => {
    return callSipuni('/autocall/', 'POST', data);
  },

  /**
   * Update campaign
   */
  updateCampaign: async (id: string, data: any) => {
    return callSipuni(`/autocall/${id}`, 'PUT', data);
  },

  /**
   * Delete campaign
   */
  deleteCampaign: async (id: string) => {
    return callSipuni(`/autocall/${id}`, 'DELETE');
  },

  /**
   * Start campaign
   */
  startCampaign: async (id: string) => {
    return callSipuni(`/autocall/${id}/start`, 'GET');
  },

  /**
   * Stop campaign
   */
  stopCampaign: async (id: string) => {
    return callSipuni(`/autocall/${id}/stop`, 'GET');
  },

  /**
   * Get campaign operators/results
   */
  getCampaignOperators: async (id: string) => {
    return callSipuni(`/autocall-operator/?autocall=${id}`, 'GET');
  },

  /**
   * Assign operators to campaign
   * Endpoint: POST /autocall-operator/?autocall={campaignId}
   * Body: {"operators": [operatorId1, operatorId2, ...]}
   */
  assignOperators: async (campaignId: string, operatorIds: number[]) => {
    return callSipuni(`/autocall-operator/?autocall=${campaignId}`, 'POST', { operators: operatorIds });
  },

  /**
   * Unassign operator from campaign
   * Endpoint: DELETE /autocall-operator/{operatorId}/?autocall={campaignId}
   */
  unassignOperator: async (campaignId: string, operatorId: string) => {
    return callSipuni(`/autocall-operator/${operatorId}/?autocall=${campaignId}`, 'DELETE');
  },

  /**
   * Get call results for campaign
   */
  getCallResults: async (id: string, max: number = 100, pos: number = 0) => {
    return callSipuni(`/autocall/${id}/results?max=${max}&pos=${pos}`, 'GET');
  },

  /**
   * Get call report for campaign
   */
  getCallReport: async (id: string) => {
    return callSipuni(`/autocall/report/${id}`, 'GET');
  },

  /**
   * Get uploaded numbers for campaign
   */
  getUploadedNumbers: async (id: string, max: number = 1000, pos: number = 0) => {
    return callSipuni(`/autocall-number/?autocall=${id}&max=${max}&pos=${pos}`, 'GET');
  },

  /**
   * Upload phone numbers to campaign
   * Endpoint: POST /autocall-number/
   * Body per number: { autocall: campaignId, number: numberValue, comment: "" }
   * Note: Must send one request per number
   */
  uploadPhoneNumbers: async (id: string, numbers: string[]) => {
    const results = [];

    for (const num of numbers) {
      try {
        // Parse number - remove + if present, then convert to number
        const phoneNumber = parseInt(num.replace(/\D/g, ''), 10);

        const response = await callSipuni(`/autocall-number/`, 'POST', {
          autocall: id,
          number: phoneNumber,
          comment: ''
        });

        results.push({ number: num, success: true, response });
      } catch (error) {
        console.error(`Failed to upload number ${num}:`, error);
        results.push({ number: num, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // Return aggregated results
    const successCount = results.filter(r => r.success).length;
    return {
      success: successCount > 0,
      totalCount: numbers.length,
      successCount,
      failureCount: numbers.length - successCount,
      results
    };
  },

  /**
   * Get employees/operators
   */
  getEmployees: async () => {
    return callSipuni('/employees/', 'GET');
  },

  /**
   * Get employee extensions
   */
  getEmployeeExtensions: async () => {
    return callSipuni('/employees/empExt', 'GET');
  },

  /**
   * Get available phone lines/outlines
   */
  getPhoneLines: async () => {
    return callSipuni('/lines/', 'GET');
  },
};

/**
 * TypeScript interfaces for Sipuni API responses
 */
export interface SipuniCampaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  created_at?: string;
  description?: string;
  [key: string]: any;
}

export interface SipuniOperator {
  id: string;
  name: string;
  email?: string;
  [key: string]: any;
}

export interface SipuniCallResult {
  id: string;
  phone: string;
  status: string;
  duration?: number;
  [key: string]: any;
}
