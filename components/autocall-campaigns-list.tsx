'use client';

import { useEffect, useState } from 'react';
import { getSipuniAPI } from '@/lib/sipuni-api';
import type { SipuniCampaign } from '@/lib/sipuni-api';

interface CampaignWithStatus extends SipuniCampaign {
  isLoading?: boolean;
}

export default function AutocallCampaignsList() {
  const [campaigns, setCampaigns] = useState<CampaignWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setError(null);
      setLoading(true);
      const api = getSipuniAPI();
      const data = await api.getCampaigns(50, 0);
      setCampaigns(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load campaigns';
      setError(message);
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCampaign = async (campaignId: string) => {
    try {
      setCampaigns(prev =>
        prev.map(c => c.id === campaignId ? { ...c, isLoading: true } : c)
      );
      const api = getSipuniAPI();
      await api.startCampaign(campaignId);
      await loadCampaigns();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start campaign';
      setError(message);
      console.error('Error starting campaign:', err);
    }
  };

  const handleStopCampaign = async (campaignId: string) => {
    try {
      setCampaigns(prev =>
        prev.map(c => c.id === campaignId ? { ...c, isLoading: true } : c)
      );
      const api = getSipuniAPI();
      await api.stopCampaign(campaignId);
      await loadCampaigns();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop campaign';
      setError(message);
      console.error('Error stopping campaign:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Autocall Campaigns</h2>
        <button
          onClick={loadCampaigns}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Refresh
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg">
          <p className="text-gray-600">No campaigns found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
              {/* Campaign Name */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {campaign.name}
              </h3>

              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    campaign.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : campaign.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {campaign.status || 'inactive'}
                </span>
              </div>

              {/* Description */}
              {campaign.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {campaign.description}
                </p>
              )}

              {/* Created Date */}
              {campaign.created_at && (
                <p className="text-xs text-gray-500 mb-4">
                  Created: {new Date(campaign.created_at).toLocaleDateString()}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {campaign.status === 'active' ? (
                  <button
                    onClick={() => handleStopCampaign(campaign.id)}
                    disabled={campaign.isLoading}
                    className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
                  >
                    {campaign.isLoading ? 'Stopping...' : 'Stop'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartCampaign(campaign.id)}
                    disabled={campaign.isLoading}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
                  >
                    {campaign.isLoading ? 'Starting...' : 'Start'}
                  </button>
                )}

                <button
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Details
                </button>
              </div>

              {/* Campaign ID */}
              <p className="text-xs text-gray-400 mt-4 break-all">
                ID: {campaign.id}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
