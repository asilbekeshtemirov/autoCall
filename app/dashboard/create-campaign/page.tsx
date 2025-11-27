'use client';

'use client';

'use client';

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useProtected } from '@/lib/use-protected';
import { getSipuniAPI } from '@/lib/sipuni-api';
import Link from 'next/link';

interface FormData {
  name: string;
  description: string;
  operatorId?: string;
  lineId?: string;
  answerText?: string;
  maxRetries?: number;
  retryInterval?: number;
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useProtected();
  const { logout } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    operatorId: '',
    lineId: '',
    answerText: '',
    maxRetries: 3,
    retryInterval: 60,
  });

  const [operators, setOperators] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      loadOperatorsAndLines();
    }
  }, [authLoading]);

  const loadOperatorsAndLines = async () => {
    try {
      setError(null);
      const api = getSipuniAPI();

      const [operatorsData, linesData] = await Promise.all([
        api.getEmployees().catch(() => []),
        api.getEmployeeExtensions().catch(() => []),
      ]);

      console.log('Operators Data:', operatorsData);
      console.log('Lines Data:', linesData);

      setOperators(Array.isArray(operatorsData) ? operatorsData : []);
      setLines(Array.isArray(linesData) ? linesData : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load operators and lines';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      const result = await api.createCampaign(formData);

      if (result && result.id) {
        router.push(`/dashboard/campaigns/${result.id}`);
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
                onChange={handleChange}
                placeholder="e.g., Summer Promotion 2024"
                disabled={isSubmitting}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the purpose and details of this campaign"
                disabled={isSubmitting}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
              />
            </div>

            {/* Operator Selection */}
            <div>
              <label htmlFor="operatorId" className="block text-sm font-medium text-gray-700 mb-2">
                Assign Operator
              </label>
              <select
                id="operatorId"
                name="operatorId"
                value={formData.operatorId}
                onChange={handleChange}
                disabled={isSubmitting || operators.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select an operator...</option>
                {operators.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.name || op.email || op.id}
                  </option>
                ))}
              </select>
              {operators.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">No operators available</p>
              )}
            </div>

            {/* Line Selection */}
            <div>
              <label htmlFor="lineId" className="block text-sm font-medium text-gray-700 mb-2">
                Assign Line
              </label>
              <select
                id="lineId"
                name="lineId"
                value={formData.lineId}
                onChange={handleChange}
                disabled={isSubmitting || lines.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select a line...</option>
                {lines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.name || line.number || line.id}
                  </option>
                ))}
              </select>
              {lines.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">No lines available</p>
              )}
            </div>

            {/* Answer Text */}
            <div>
              <label htmlFor="answerText" className="block text-sm font-medium text-gray-700 mb-2">
                Answer Text / Message
              </label>
              <textarea
                id="answerText"
                name="answerText"
                value={formData.answerText}
                onChange={handleChange}
                placeholder="Message to be played when call is answered"
                disabled={isSubmitting}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
              />
            </div>

            {/* Max Retries */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="maxRetries" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Retries
                </label>
                <input
                  id="maxRetries"
                  type="number"
                  name="maxRetries"
                  value={formData.maxRetries}
                  onChange={handleChange}
                  min="0"
                  max="10"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Retry Interval */}
              <div>
                <label htmlFor="retryInterval" className="block text-sm font-medium text-gray-700 mb-2">
                  Retry Interval (seconds)
                </label>
                <input
                  id="retryInterval"
                  type="number"
                  name="retryInterval"
                  value={formData.retryInterval}
                  onChange={handleChange}
                  min="0"
                  max="3600"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Campaign Setup Steps:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Create the campaign with basic settings</li>
                <li>Upload phone numbers to the campaign</li>
                <li>Assign additional operators if needed</li>
                <li>Review and start the campaign</li>
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
