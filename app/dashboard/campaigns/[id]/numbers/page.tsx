'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useProtected } from '@/lib/use-protected';
import { getSipuniAPI } from '@/lib/sipuni-api';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function UploadNumbersPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading } = useProtected();
  const { logout } = useAuth();
  const campaignId = params.id as string;

  const [numbers, setNumbers] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'paste' | 'file'>('paste');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!numbers.trim()) {
      setError('Please enter phone numbers');
      return;
    }

    setIsUploading(true);

    try {
      // Parse phone numbers from textarea (one per line)
      const phoneList = numbers
        .split('\n')
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      if (phoneList.length === 0) {
        setError('No valid phone numbers found');
        setIsUploading(false);
        return;
      }

      const api = getSipuniAPI();
      await api.uploadPhoneNumbers(campaignId, phoneList);

      setSuccess(true);
      setNumbers('');

      // Show success message
      setTimeout(() => {
        router.push(`/dashboard/campaigns/${campaignId}`);
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload numbers';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Handle Excel files
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Extract phone numbers from first column
        const phoneNumbers = jsonData
          .map(row => String(row[0] || ''))
          .filter(num => num.trim().length > 0)
          .join('\n');

        setNumbers(phoneNumbers);
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Handle text/csv files
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setNumbers(content);
      };
      reader.readAsText(file);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (authLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Upload Phone Numbers</h1>
          <p className="text-gray-600 mt-1">Add phone numbers to this campaign for autocalling</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">Phone numbers uploaded successfully! Redirecting...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-8">
          {/* Upload Method Tabs */}
          <div className="mb-8 border-b border-gray-200">
            <div className="flex gap-8">
              {['paste', 'file'].map((method) => (
                <button
                  key={method}
                  onClick={() => {
                    setUploadMethod(method as 'paste' | 'file');
                    setNumbers('');
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition ${uploadMethod === method
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                >
                  {method === 'paste' ? 'Paste Numbers' : 'Upload File'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            {uploadMethod === 'paste' ? (
              <div>
                <label htmlFor="numbers" className="block text-sm font-medium text-gray-700 mb-3">
                  Phone Numbers (one per line)
                </label>
                <textarea
                  id="numbers"
                  value={numbers}
                  onChange={(e) => setNumbers(e.target.value)}
                  placeholder="+998901234567&#10;+998911234567&#10;+998921234567"
                  disabled={isUploading}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
                />
                <p className="mt-2 text-sm text-gray-600">
                  Enter phone numbers separated by new lines. Format: +[country code][number]
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload File (.txt, .csv, or .xlsx)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".txt,.csv,.xlsx,.xls"
                    disabled={isUploading}
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-gray-700 font-medium">Click to upload or drag and drop</p>
                    <p className="text-gray-500 text-sm mt-1">File size up to 10MB</p>
                  </label>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  File should contain one phone number per line
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Number Format Requirements:</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Include country code (e.g., +998 for Uzbekistan)</li>
                <li>No special characters except +</li>
                <li>No spaces or hyphens</li>
                <li>Example: +998901234567</li>
              </ul>
            </div>

            {/* Number Count */}
            {numbers && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 font-medium">
                  {numbers
                    .split('\n')
                    .map((n) => n.trim())
                    .filter((n) => n.length > 0).length}{' '}
                  phone numbers ready to upload
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isUploading || !numbers.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  'Upload Numbers'
                )}
              </button>
              <Link
                href={`/dashboard/campaigns/${campaignId}`}
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
