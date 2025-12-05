'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useProtected } from '@/lib/use-protected';
import { getSipuniAPI } from '@/lib/sipuni-api';
import Link from 'next/link';

interface CampaignDetail {
  id: string;
  name: string;
  status: string;
  description?: string;
  operators?: any[];
  numbers?: any[];
  [key: string]: any;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const { isLoading: authLoading } = useProtected();
  const { logout } = useAuth();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [allOperators, setAllOperators] = useState<any[]>([]);
  const [assignedOperators, setAssignedOperators] = useState<any[]>([]);
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [selectedAssignedOperators, setSelectedAssignedOperators] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isAssigningAll, setIsAssigningAll] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [uploadedNumbers, setUploadedNumbers] = useState<any[]>([]);
  const [callResults, setCallResults] = useState<any[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [selectedNumber, setSelectedNumber] = useState('');
  const [isSelectingNumber, setIsSelectingNumber] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);
  const [selectSuccess, setSelectSuccess] = useState<string | null>(null);

  // Find currently selected number from API
  const currentlySelected = availableNumbers.find((n: any) => n.selected);
  const currentlySelectedName = currentlySelected?.name || 'None';

  useEffect(() => {
    if (!authLoading) {
      loadCampaignDetails();
      loadOperatorsData();
      loadUploadedNumbers();
      loadCallResults();
      loadAvailableNumbers();
    }
  }, [authLoading, campaignId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAvailableNumbers = async () => {
    try {
      const api = getSipuniAPI();
      // Get available lines/numbers from new endpoint with campaign ID
      const lines = await api.getAvailableLines(campaignId);

      console.log('[loadAvailableNumbers] Lines:', lines);

      // Process lines - ensure we have id, name, selected fields
      let processedLines = [];
      if (Array.isArray(lines)) {
        processedLines = lines.map((line: any) => ({
          id: line.id,
          name: line.name || `Line ${line.id}`,
          selected: line.selected || false,
        }));
      }

      console.log('[loadAvailableNumbers] Processed lines:', processedLines);
      setAvailableNumbers(processedLines);
    } catch (err) {
      console.error('Failed to load available numbers:', err);
    }
  };

  const handleSelectNumber = async () => {
    if (!selectedNumber || !campaignId) return;

    setIsSelectingNumber(true);
    setSelectError(null);
    setSelectSuccess(null);

    try {
      const api = getSipuniAPI();

      // Select the phone number/line - this sets selected: true in Sipuni using PATCH method
      await api.selectPhoneNumber(campaignId, selectedNumber);

      // Find the selected line name for success message
      const selectedLine = availableNumbers.find((n) => n.id === selectedNumber);
      const selectedLineName = selectedLine?.name || selectedNumber;

      setSelectSuccess(`✓ Phone line "${selectedLineName}" selected successfully!`);

      setSelectedNumber('');
      // Reload to show updated selection
      await loadAvailableNumbers();
      await loadCampaignDetails();

      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setSelectSuccess(null);
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to select phone number';
      setSelectError(message);
    } finally {
      setIsSelectingNumber(false);
    }
  };

  const loadOperatorsData = async () => {
    try {
      const api = getSipuniAPI();
      const [allOps, assignedOps] = await Promise.all([
        api.getEmployees(),
        api.getCampaignOperators(campaignId),
      ]);
      setAllOperators(allOps || []);
      setAssignedOperators(assignedOps || []);
    } catch (err) {
      console.error('Failed to load operators data:', err);
    }
  };

  const loadUploadedNumbers = async () => {
    try {
      const api = getSipuniAPI();
      const numbers = await api.getUploadedNumbers(campaignId, 1000, 0);
      setUploadedNumbers(numbers || []);
    } catch (err) {
      console.error('Failed to load uploaded numbers:', err);
    }
  };

  const loadCallResults = async () => {
    try {
      const api = getSipuniAPI();
      const report = await api.getCallReport(campaignId);

      // Backend already formatted it, use it directly
      setCallResults(report);
    } catch (err) {
      console.error('Failed to load call results:', err);
    }
  };

  const loadCampaignDetails = async () => {
    try {
      setError(null);
      const api = getSipuniAPI();
      const details = await api.getCampaignDetails(campaignId);
      setCampaign(details);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load campaign details';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCampaign = async () => {
    if (!campaign) return;
    setIsStarting(true);
    try {
      const api = getSipuniAPI();
      await api.startCampaign(campaignId);
      // Reload campaign details
      await loadCampaignDetails();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start campaign';
      setError(message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopCampaign = async () => {
    if (!campaign) return;
    setIsStopping(true);
    try {
      const api = getSipuniAPI();
      await api.stopCampaign(campaignId);
      // Reload campaign details
      await loadCampaignDetails();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop campaign';
      setError(message);
    } finally {
      setIsStopping(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaign) return;
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }
    setIsDeleting(true);
    try {
      const api = getSipuniAPI();
      await api.deleteCampaign(campaignId);
      // Redirect to campaigns list
      window.location.href = '/dashboard';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete campaign';
      setError(message);
      setIsDeleting(false);
    }
  };

  const handleAssignOperator = async () => {
    if (!campaign || selectedOperators.length === 0) return;
    setIsAssigning(true);
    setAssignError(null);
    try {
      const api = getSipuniAPI();
      const operatorIds = selectedOperators.map(id => parseInt(id, 10));
      await api.assignOperators(campaignId, operatorIds);
      setSelectedOperators([]);
      // Reload assigned operators
      await loadOperatorsData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign operators';
      setAssignError(message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignOperator = async (operatorId: string) => {
    if (!campaign) return;
    setAssignError(null);
    try {
      const api = getSipuniAPI();
      await api.unassignOperator(campaignId, operatorId);
      // Reload assigned operators
      await loadOperatorsData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unassign operator';
      setAssignError(message);
    }
  };

  const handleRemoveOperators = async () => {
    if (!campaign || selectedAssignedOperators.length === 0) return;
    setAssignError(null);
    try {
      const api = getSipuniAPI();
      await api.unassignOperators(campaignId, selectedAssignedOperators);
      setSelectedAssignedOperators([]);
      // Reload assigned operators
      await loadOperatorsData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unassign operators';
      setAssignError(message);
    }
  };

  const handleAssignAllOperators = async () => {
    if (!campaign) return;

    const unassignedOperators = allOperators.filter(
      op => !assignedOperators.some(assigned => assigned.id === op.id)
    );

    if (unassignedOperators.length === 0) return;

    setIsAssigningAll(true);
    setAssignError(null);
    try {
      const api = getSipuniAPI();
      const operatorIds = unassignedOperators.map(op => parseInt(op.id, 10));
      await api.assignOperators(campaignId, operatorIds);
      // Reload assigned operators
      await loadOperatorsData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign all operators';
      setAssignError(message);
    } finally {
      setIsAssigningAll(false);
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
          <p className="text-gray-600">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
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
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error || 'Campaign not found'}</p>
            <button
              onClick={loadCampaignDetails}
              className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium underline"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start mb-4">
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
              <p className="text-gray-600 mt-1">{campaign.description || 'No description provided'}</p>
            </div>
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${campaign.status === 'active'
                ? 'bg-green-100 text-green-800'
                : campaign.status === 'paused'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
                }`}
            >
              {campaign.status || 'Unknown'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8 flex gap-3">
          {campaign.status !== 'active' && (
            <button
              onClick={handleStartCampaign}
              disabled={isStarting}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isStarting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Starting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Campaign
                </>
              )}
            </button>
          )}

          {campaign.status === 'active' && (
            <button
              onClick={handleStopCampaign}
              disabled={isStopping}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isStopping ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Stopping...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4a2 2 0 012-2h4a1 1 0 011 1v12a1 1 0 001 1h3a1 1 0 001-1V7a1 1 0 011 1v7a2 2 0 01-2 2h-3a2 2 0 01-2-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2v2a1 1 0 11-2 0v-2a2 2 0 01-2-2V4z" />
                  </svg>
                  Stop Campaign
                </>
              )}
            </button>
          )}

          <Link
            href={`/dashboard/campaigns/${campaignId}/numbers`}
            onClick={() => {
              // Refresh numbers tab after upload completes
              setTimeout(() => {
                loadUploadedNumbers();
              }, 1000);
            }}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Numbers
          </Link>

          <button
            onClick={() => {
              setActiveTab('results');
              loadCallResults();
            }}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Results
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-8">
            {['details', 'operators', 'numbers', 'results'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition ${activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Campaign ID</label>
                  <p className="text-lg font-mono font-bold text-blue-900">{campaign.id}</p>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Campaign Name</label>
                  <p className="text-lg font-bold text-purple-900">{campaign.name || '—'}</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <p className="text-lg font-bold text-green-900">{campaign.status || 'Unknown'}</p>
                </div>
              </div>

              {/* Campaign Description */}
              {campaign.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{campaign.description}</p>
                </div>
              )}

              {/* Key Settings */}
              <div className="grid grid-cols-2 gap-4">
                {campaign.callAttemptTime && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <label className="text-xs font-semibold text-gray-600">Connection Timeout</label>
                    <p className="text-lg font-bold text-gray-900">{campaign.callAttemptTime}s</p>
                  </div>
                )}
                {campaign.cooldown && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <label className="text-xs font-semibold text-gray-600">Pause Between Calls</label>
                    <p className="text-lg font-bold text-gray-900">{campaign.cooldown}s</p>
                  </div>
                )}
                {campaign.maxConnections && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <label className="text-xs font-semibold text-gray-600">Max Connections</label>
                    <p className="text-lg font-bold text-gray-900">{campaign.maxConnections}</p>
                  </div>
                )}
                {campaign.minDuration && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <label className="text-xs font-semibold text-gray-600">Min Duration</label>
                    <p className="text-lg font-bold text-gray-900">{campaign.minDuration}s</p>
                  </div>
                )}
              </div>

              {/* Select Phone Number */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <div className="mb-4">
                  <h3 className="font-semibold text-indigo-900 mb-1">📞 Currently Selected</h3>
                  <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                    <p className="text-green-900 font-bold text-lg">{currentlySelectedName}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-indigo-900 mb-2">Switch to Another Number</h3>
                  <p className="text-sm text-gray-600 mb-3">Select a different phone number for this campaign</p>

                  {selectError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded mb-3">
                      <p className="text-red-700 text-sm">{selectError}</p>
                    </div>
                  )}

                  {selectSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded mb-3">
                      <p className="text-green-700 text-sm font-medium">{selectSuccess}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <select
                      value={selectedNumber}
                      onChange={(e) => setSelectedNumber(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    >
                      <option value="">Choose a phone number...</option>
                      {availableNumbers.map((number: any) => (
                        <option
                          key={number.id}
                          value={number.id}
                          disabled={number.selected}
                        >
                          {number.name} {number.selected ? '✓ (Currently Active)' : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleSelectNumber}
                      disabled={!selectedNumber || isSelectingNumber}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isSelectingNumber ? 'Switching...' : 'Switch'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'operators' && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Assign Operators</h3>
                <p className="text-sm text-gray-600 mb-3">Select operators to handle calls for this campaign</p>

                {/* Multi-select checkboxes */}
                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-white mb-3">
                  {allOperators.filter(op => !assignedOperators.some(assigned => assigned.id === op.id)).length === 0 ? (
                    <p className="text-sm text-gray-500">All operators are already assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {allOperators
                        .filter(op => !assignedOperators.some(assigned => assigned.id === op.id))
                        .map((op) => (
                          <label
                            key={op.id}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedOperators.includes(String(op.id))}
                              onChange={(e) => {
                                const operatorId = String(op.id);
                                setSelectedOperators(prev =>
                                  e.target.checked
                                    ? [...prev, operatorId]
                                    : prev.filter(id => id !== operatorId)
                                );
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {op.name || op.login || op.id}
                            </span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>

                {/* Selection counter */}
                {selectedOperators.length > 0 && (
                  <p className="text-sm text-gray-600 mb-3">
                    {selectedOperators.length} operator{selectedOperators.length !== 1 ? 's' : ''} selected
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleAssignOperator}
                    disabled={selectedOperators.length === 0 || isAssigning}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isAssigning ? 'Assigning...' : `Assign Selected (${selectedOperators.length})`}
                  </button>
                  <button
                    onClick={handleAssignAllOperators}
                    disabled={allOperators.filter(op => !assignedOperators.some(assigned => assigned.id === op.id)).length === 0 || isAssigningAll}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isAssigningAll ? 'Assigning All...' : 'Assign All'}
                  </button>
                </div>
                {assignError && <p className="text-red-600 text-sm mt-2">{assignError}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Assigned Operators</h3>
                  {selectedAssignedOperators.length > 0 && (
                    <button
                      onClick={handleRemoveOperators}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Remove Selected Operators
                    </button>
                  )}
                </div>
                {assignedOperators && assignedOperators.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="py-3 px-4">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAssignedOperators(assignedOperators.map(op => op.id));
                                } else {
                                  setSelectedAssignedOperators([]);
                                }
                              }}
                            />
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">Operator Name</th>
                          <th className="text-left py-3 px-4 font-semibold">Operator ID</th>
                          <th className="text-left py-3 px-4 font-semibold">Login</th>
                          <th className="text-left py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedOperators.map((op: any, idx: number) => (
                          <tr key={op.id || idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                value={op.id}
                                checked={selectedAssignedOperators.includes(op.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAssignedOperators([...selectedAssignedOperators, op.id]);
                                  } else {
                                    setSelectedAssignedOperators(selectedAssignedOperators.filter(id => id !== op.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="py-3 px-4">{op.name || op.login || 'N/A'}</td>
                            <td className="py-3 px-4 font-mono text-xs">{op.id}</td>
                            <td className="py-3 px-4">{op.login || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleUnassignOperator(op.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500">No operators assigned yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'numbers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold">Uploaded Phone Numbers</h3>
                  <p className="text-sm text-gray-600">List of all phone numbers uploaded to this campaign</p>
                </div>
                <button
                  onClick={loadUploadedNumbers}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-sm"
                >
                  Refresh
                </button>
              </div>
              {uploadedNumbers && uploadedNumbers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold">Phone Number</th>
                        <th className="text-left py-3 px-4 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 font-semibold">Duration</th>
                        <th className="text-left py-3 px-4 font-semibold">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedNumbers.map((num: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono text-sm">{num.phone || num.number || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${num.status === 'answered' ? 'bg-green-100 text-green-800' :
                              num.status === 'no_answer' ? 'bg-yellow-100 text-yellow-800' :
                                num.status === 'busy' ? 'bg-orange-100 text-orange-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {num.status || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-4">{num.duration || '—'}</td>
                          <td className="py-3 px-4 text-gray-600">{num.comment || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-500">No phone numbers uploaded yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">Call Results Summary</h3>
                  <p className="text-sm text-gray-600">Detailed statistics of all calls made</p>
                </div>
                <button
                  onClick={loadCallResults}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-sm"
                >
                  Refresh
                </button>
              </div>

              {callResults && Object.keys(callResults).length > 0 ? (
                <div className="space-y-6">
                  {/* Summary Stats Grid */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Total Calls</p>
                      <p className="text-3xl font-bold text-blue-600">{callResults.totalCalls || 0}</p>
                    </div>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Answered</p>
                      <p className="text-3xl font-bold text-green-600">{callResults.answeredCalls || 0}</p>
                      <p className="text-xs text-green-600 mt-1">{callResults.successRate || '0%'}</p>
                    </div>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Missed</p>
                      <p className="text-3xl font-bold text-yellow-600">{callResults.missedCalls || 0}</p>
                      <p className="text-xs text-yellow-600 mt-1">{callResults.missedRate || '0%'}</p>
                    </div>
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Active</p>
                      <p className="text-3xl font-bold text-purple-600">{callResults.activeCalls || 0}</p>
                      <p className="text-xs text-purple-600 mt-1">{callResults.activeRate || '0%'}</p>
                    </div>
                  </div>

                  {/* Timing Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Avg Duration</p>
                      <p className="text-2xl font-bold text-indigo-600">{callResults.averageDuration || '0s'}</p>
                    </div>
                    <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Avg Answer Time</p>
                      <p className="text-2xl font-bold text-teal-600">{callResults.averageAnswerTime || '0s'}</p>
                    </div>
                  </div>

                  {/* Calls Table */}
                  {callResults.calls && callResults.calls.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Call Details</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <th className="text-left py-3 px-4 font-semibold">Phone Number</th>
                              <th className="text-left py-3 px-4 font-semibold">Status</th>
                              <th className="text-left py-3 px-4 font-semibold">Duration</th>
                              <th className="text-left py-3 px-4 font-semibold">Time</th>
                              <th className="text-left py-3 px-4 font-semibold">Operator</th>
                            </tr>
                          </thead>
                          <tbody>
                            {callResults.calls.map((call: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 font-mono text-sm">{call.phoneNumber}</td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${call.status === 'answered' ? 'bg-green-100 text-green-800' :
                                    call.status === 'missed' ? 'bg-yellow-100 text-yellow-800' :
                                      call.status === 'failed' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                    {call.status === 'answered' ? '✓ Answered' :
                                      call.status === 'missed' ? '✗ Missed' :
                                        call.status === 'failed' ? '✗ Failed' :
                                          'Unknown'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">{call.duration}s</td>
                                <td className="py-3 px-4 text-gray-600 text-xs">{call.timestamp}</td>
                                <td className="py-3 px-4">{call.operator}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <p className="text-gray-500 font-medium">No call results available yet</p>
                  <p className="text-sm text-gray-400 mt-1">Calls will appear here once the campaign runs</p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
