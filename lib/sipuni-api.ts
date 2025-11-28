/**
 * Frontend Sipuni API Client
 *
 * This client ONLY communicates with our backend API routes (/api/campaigns, etc.)
 * It does NOT communicate directly with Sipuni API (that's handled server-side)
 * Authentication is handled via JWT token from our auth system
 */

import axios, { AxiosInstance } from 'axios';

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

export class SipuniAPI {
  private client: AxiosInstance;

  constructor(token?: string) {
    this.client = axios.create({
      baseURL: '/', // Ensure all requests are relative to the current origin
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to all requests
    this.client.interceptors.request.use((config) => {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
      }
      return config;
    });

    // Handle 401 errors (redirect to login)
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get list of campaigns
   */
  async getCampaigns(max: number = 50, pos: number = 0): Promise<SipuniCampaign[]> {
    const response = await this.client.get(`/api/campaigns?max=${max}&pos=${pos}`);
    return response.data.data || [];
  }

  /**
   * Get campaign details
   */
  async getCampaign(id: string): Promise<SipuniCampaign> {
    const response = await this.client.get(`/api/campaigns/${id}`);
    return response.data.data || {};
  }

  /**
   * Get campaign details (alias for getCampaign)
   */
  async getCampaignDetails(id: string): Promise<SipuniCampaign> {
    return this.getCampaign(id);
  }

  /**
   * Create new campaign
   */
  async createCampaign(data: any): Promise<any> {
    const response = await this.client.post('/api/campaigns', data);
    return response.data.data;
  }

  /**
   * Update campaign
   */
  async updateCampaign(id: string, data: any): Promise<any> {
    const response = await this.client.put(`/api/campaigns/${id}`, data);
    return response.data.data;
  }

  /**
   * Get available phone numbers/lines
   */
  async getAvailableLines(): Promise<any[]> {
    const response = await this.client.get(`/api/campaigns/lines`);
    return response.data.data || [];
  }

  /**
   * Select a phone number/line for campaign
   */
  async selectPhoneNumber(lineId: string): Promise<any> {
    const response = await this.client.put(`/api/campaigns/select-line`, { lineId });
    return response.data.data;
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(id: string): Promise<any> {
    const response = await this.client.delete(`/api/campaigns/${id}`);
    return response.data.data;
  }

  /**
   * Start campaign
   */
  async startCampaign(id: string): Promise<any> {
    const response = await this.client.post(`/api/campaigns/${id}/start`);
    return response.data.data;
  }

  /**
   * Stop campaign
   */
  async stopCampaign(id: string): Promise<any> {
    const response = await this.client.post(`/api/campaigns/${id}/stop`);
    return response.data.data;
  }

  /**
   * Get campaign operators/results
   */
  async getCampaignOperators(id: string): Promise<any[]> {
    const response = await this.client.get(`/api/campaigns/${id}/operators`);
    return response.data.data || [];
  }

  /**
   * Assign operators to campaign
   */
  async assignOperators(campaignId: string, operatorIds: number[]): Promise<any> {
    const response = await this.client.post(`/api/campaigns/${campaignId}/operators`, { operatorIds });
    return response.data.data;
  }

  /**
   * Get call results
   */
  async getCallResults(id: string, max: number = 100, pos: number = 0): Promise<SipuniCallResult[]> {
    const response = await this.client.get(`/api/campaigns/${id}/results?max=${max}&pos=${pos}`);
    return response.data.data || [];
  }

  /**
   * Get call report for campaign
   */
  async getCallReport(id: string): Promise<any> {
    const response = await this.client.get(`/api/campaigns/${id}/report`);
    return response.data.data || {};
  }

  /**
   * Get uploaded numbers for campaign
   */
  async getUploadedNumbers(id: string, max: number = 1000, pos: number = 0): Promise<any[]> {
    const response = await this.client.get(`/api/campaigns/${id}/numbers?max=${max}&pos=${pos}`);
    return response.data.data || [];
  }

  /**
   * Get employees/operators
   */
  async getEmployees(): Promise<any[]> {
    const response = await this.client.get('/api/employees');
    return response.data.data || [];
  }

  /**
   * Get employee extensions
   */
  async getEmployeeExtensions(): Promise<any[]> {
    const response = await this.client.get('/api/employees/extensions');
    return response.data.data || [];
  }

  /**
   * Get available phone lines
   */
  async getPhoneLines(): Promise<any[]> {
    const response = await this.client.get('/api/lines');
    return response.data.data || [];
  }

  /**
   * Upload phone numbers to campaign
   */
  async uploadPhoneNumbers(campaignId: string, numbers: string[]): Promise<any> {
    const response = await this.client.post(`/api/campaigns/${campaignId}/numbers`, { numbers });
    return response.data.data;
  }
}

// Singleton instance
let apiInstance: SipuniAPI | null = null;

export function getSipuniAPI(token?: string): SipuniAPI {
  if (!apiInstance) {
    apiInstance = new SipuniAPI(token);
  }
  return apiInstance;
}
