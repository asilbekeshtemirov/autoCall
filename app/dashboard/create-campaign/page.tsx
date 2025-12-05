'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useProtected } from '@/lib/use-protected';
import { getSipuniAPI } from '@/lib/sipuni-api';
import Link from 'next/link';

interface FormData {
  name: string;
  operatorIds: string[];
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useProtected();
  const { logout } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    operatorIds: [],
  });

  const [operators, setOperators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      loadOperators();
    }
  }, [authLoading]);

  const loadOperators = async () => {
    try {
      setError(null);
      const api = getSipuniAPI();

      console.log('[CreateCampaignPage] Loading operators...');

      const operatorsData = await api.getEmployees().catch((err) => {
        console.warn('[CreateCampaignPage] Failed to fetch operators:', err);
        return [];
      });

      console.log('[CreateCampaignPage] Operators Data:', operatorsData);

      setOperators(Array.isArray(operatorsData) ? operatorsData : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load operators';
      console.error('[CreateCampaignPage] Error loading data:', message, err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Campaign name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const api = getSipuniAPI();

      // Aynan Sipuni dashboard yuborgan format
      const campaignData = {
        type: 'default2',
        workMode: 'default',
        file: null,
        fileName: null,
        id: 0,
        name: formData.name.trim(),
        cooldown: '5',
        audioId: null,
        audioName: '',
        autoAnswer: false,
        callAttemptTime: 30,
        day_0: false,
        day_1: false,
        day_2: false,
        day_3: false,
        day_4: false,
        day_5: false,
        day_6: false,
        defaultInTree: false,
        distributor: false,
        inTree: '',
        lines: '',
        maxConnections: 1,
        minDuration: '20',
        predictCoef: 1,
        priority: '',
        recallMissed: '',
        recallMissedTimeout: '',
        statUrl: '',
        timeEnd: null,
        timeMax: '',
        timeMin: '',
        timeStart: null,
        timezone: 'Europe/Moscow',
      };

      console.log('[CreateCampaignPage] Submitting campaign data:', campaignData);
      const result = await api.createCampaign(campaignData);

      console.log('[CreateCampaignPage] Campaign created:', result);

      // Campaign ID ni olish: result.data.autocall.id
      const campaignId = result?.data?.autocall?.id || result?.autocall?.id || result?.id;

      // Operatorlarni biriktirish
      if (formData.operatorIds.length > 0 && campaignId) {
        try {
          console.log('[CreateCampaignPage] Assigning operators:', formData.operatorIds);
          await api.assignOperators(String(campaignId), formData.operatorIds.map(id => parseInt(id)));
          console.log('[CreateCampaignPage] Operators assigned successfully');
        } catch (opError) {
          console.error('[CreateCampaignPage] Failed to assign operators:', opError);
        }
      }

      if (campaignId) {
        router.push(`/dashboard/campaigns/${campaignId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create campaign';
      setError(message);
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Campaigns
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
            >
              Logout
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="text-gray-600 mt-1">Set up a new autocall campaign</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name <span className="text-red-600">*</span>
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Summer Promotion 2024"
                disabled={isSubmitting}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Operator Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Operators <span className="text-red-600">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-white">
                {operators.length === 0 ? (
                  <p className="text-sm text-gray-500">No operators available</p>
                ) : (
                  <div className="space-y-2">
                    {operators.map((op) => (
                      <label
                        key={op.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.operatorIds.includes(String(op.id))}
                          onChange={(e) => {
                            const operatorId = String(op.id);
                            setFormData((prev) => ({
                              ...prev,
                              operatorIds: e.target.checked
                                ? [...prev.operatorIds, operatorId]
                                : prev.operatorIds.filter((id) => id !== operatorId),
                            }));
                          }}
                          disabled={isSubmitting}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {op.name || op.email || op.id}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {formData.operatorIds.length > 0 && (
                <p className="text-sm text-green-600 mt-2 font-medium">
                  ✓ {formData.operatorIds.length} operator{formData.operatorIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">📋 Next Steps:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Enter campaign name and select operators</li>
                <li>Select phone line from campaign details page</li>
                <li>Upload phone numbers to call</li>
                <li>Start the campaign</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Campaign'
                )}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
