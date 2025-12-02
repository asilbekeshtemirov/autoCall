'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSipuniAPI } from '@/lib/sipuni-api';
import type { SipuniCampaign, SipuniOperator } from '@/lib/sipuni-api';

interface CampaignDetailsProps {
  campaignId: string;
  onClose?: () => void;
}

interface CallResult {
  id: string;
  number: string;
  operator?: string;
  status: string;
  duration?: number;
  timestamp?: string;
  [key: string]: any;
}

export default function CampaignDetails({ campaignId, onClose }: CampaignDetailsProps) {
  const [campaign, setCampaign] = useState<SipuniCampaign | null>(null);
  const [operators, setOperators] = useState<any[]>([]);
  const [callResults, setCallResults] = useState<CallResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'operators' | 'results'>('overview');

  useEffect(() => {
    loadCampaignDetails();
  }, [loadCampaignDetails]);

  const loadCampaignDetails = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const api = getSipuniAPI();

      const [campaignData, operatorsData, resultsData] = await Promise.all([
        api.getCampaignDetails(campaignId),
        api.getCampaignOperators(campaignId),
        api.getCallResults(campaignId, 50, 0),
      ]);

      setCampaign(campaignData);
      setOperators(operatorsData);
      setCallResults(resultsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load campaign details';
      setError(message);
      console.error('Error loading campaign details:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-700">Campaign not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{campaign.name}</h2>
          {campaign.description && (
            <p className="text-gray-600">{campaign.description}</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {(['overview', 'operators', 'results'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'operators' ? 'Operators' : 'Call Results'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Campaign ID</p>
            <p className="font-mono text-sm break-all">{campaign.id}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
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

          {campaign.created_at && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Created Date</p>
              <p className="text-sm">{new Date(campaign.created_at).toLocaleString()}</p>
            </div>
          )}

          {/* Display additional campaign properties */}
          {Object.entries(campaign).map(([key, value]) => {
            if (['id', 'name', 'description', 'status', 'created_at'].includes(key)) return null;
            return (
              <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                <p className="text-sm font-mono">{String(value)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Operators Tab */}
      {activeTab === 'operators' && (
        <div>
          {operators.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600">No operators assigned to this campaign</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map((op, idx) => (
                    <tr key={op.id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{op.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{op.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{op.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div>
          {callResults.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600">No call results yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Number</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Duration</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Operator</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {callResults.map((result, idx) => (
                    <tr key={result.id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono">{result.number}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            result.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : result.status === 'missed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {result.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{result.duration ? `${result.duration}s` : '-'}</td>
                      <td className="px-4 py-3">{result.operator || '-'}</td>
                      <td className="px-4 py-3 text-xs">
                        {result.timestamp ? new Date(result.timestamp).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={loadCampaignDetails}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
