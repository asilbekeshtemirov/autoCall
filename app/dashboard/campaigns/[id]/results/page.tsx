'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useProtected } from '@/lib/use-protected';
import { getSipuniAPI } from '@/lib/sipuni-api';
import Link from 'next/link';

interface CallResult {
  id: string;
  phone: string;
  status: string;
  duration?: number;
  timestamp?: string;
  operator?: string;
  [key: string]: any;
}

export default function CampaignResultsPage() {
  const params = useParams();
  const { isLoading: authLoading } = useProtected();
  const { logout } = useAuth();
  const campaignId = params.id as string;

  const [results, setResults] = useState<CallResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      loadResults();
    }
  }, [authLoading, campaignId, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadResults = async () => {
    try {
      setError(null);
      const api = getSipuniAPI();
      const data = await api.getCallResults(campaignId, 50, page * 50);
      setResults(Array.isArray(data) ? data : []);
      setTotalResults(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load results';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'answered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'no answer':
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredResults = filterStatus === 'all'
    ? results
    : results.filter((r) => r.status?.toLowerCase() === filterStatus.toLowerCase());

  const statusCounts = {
    all: results.length,
    answered: results.filter((r) => r.status?.toLowerCase() === 'answered').length,
    failed: results.filter((r) => r.status?.toLowerCase() === 'failed').length,
    busy: results.filter((r) => r.status?.toLowerCase() === 'busy').length,
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
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <Link href={`/dashboard/campaigns/${campaignId}`} className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Campaign
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
            >
              Logout
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Call Results</h1>
          <p className="text-gray-600 mt-1">Monitor and review all call attempts for this campaign</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={loadResults}
              className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Total Calls</p>
            <p className="text-3xl font-bold text-gray-900">{statusCounts.all}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Answered</p>
            <p className="text-3xl font-bold text-green-600">{statusCounts.answered}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Failed</p>
            <p className="text-3xl font-bold text-red-600">{statusCounts.failed}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Busy</p>
            <p className="text-3xl font-bold text-yellow-600">{statusCounts.busy}</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {['all', 'answered', 'failed', 'busy'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
              <p className="text-gray-600 text-lg font-medium">No results found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Phone Number</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Duration</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Operator</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Time</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50 transition">
                      <td className="py-4 px-6 font-mono font-medium text-gray-900">{result.phone}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(result.status)}`}>
                          {result.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{result.duration ? `${result.duration}s` : '-'}</td>
                      <td className="py-4 px-6 text-gray-600">{result.operator || '-'}</td>
                      <td className="py-4 px-6 text-gray-600">
                        {result.timestamp ? new Date(result.timestamp).toLocaleString() : '-'}
                      </td>
                      <td className="py-4 px-6">
                        {result.status?.toLowerCase() === 'failed' && (
                          <button className="text-blue-600 hover:text-blue-700 font-medium text-xs">
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalResults > 50 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">Page {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={filteredResults.length < 50}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
