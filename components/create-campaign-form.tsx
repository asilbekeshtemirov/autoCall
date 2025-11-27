'use client';

import { useState } from 'react';
import { getSipuniAPI } from '@/lib/sipuni-api';

interface CreateCampaignFormProps {
  onSuccess?: () => void;
}

export default function CreateCampaignForm({ onSuccess }: CreateCampaignFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'default2',
    callAttemptTime: '30',
    cooldown: '5',
    maxConnections: '1',
    minDuration: '20',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.name.trim()) {
      setError('Campaign name is required');
      return;
    }

    try {
      setLoading(true);
      const api = getSipuniAPI();

      const campaignData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        callAttemptTime: parseInt(formData.callAttemptTime),
        cooldown: parseInt(formData.cooldown),
        maxConnections: parseInt(formData.maxConnections),
        minDuration: parseInt(formData.minDuration),
      };

      const result = await api.createCampaign(campaignData);

      setSuccess(true);
      setSuccessData(result);
      setFormData({
        name: '',
        description: '',
        type: 'default2',
        callAttemptTime: '30',
        cooldown: '5',
        maxConnections: '1',
        minDuration: '20',
      });

      setTimeout(() => {
        setSuccess(false);
        setSuccessData(null);
        onSuccess?.();
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create campaign';
      setError(message);
      console.error('Error creating campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Campaign</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {success && successData && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-700">
              <p className="font-bold text-sm mb-2">✅ Campaign created successfully!</p>
              <div className="text-xs space-y-1 bg-white bg-opacity-50 p-2 rounded">
                <p><span className="font-semibold">Campaign ID:</span> {successData.id}</p>
                <p><span className="font-semibold">Name:</span> {successData.name}</p>
                <p><span className="font-semibold">Type:</span> {successData.type}</p>
                <p><span className="font-semibold">Status:</span> {successData.status}</p>
                <p><span className="font-semibold">Created:</span> {new Date(successData.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name *
          </label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Customer Outreach Q1"
            disabled={loading}
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
            onChange={handleInputChange}
            placeholder="Campaign details and notes..."
            rows={3}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Campaign Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Type *
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange as any}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="default2">Default 2</option>
            <option value="default">Default</option>
          </select>
        </div>

        {/* Call Attempt Time */}
        <div>
          <label htmlFor="callAttemptTime" className="block text-sm font-medium text-gray-700 mb-2">
            Connection Timeout (seconds) *
          </label>
          <input
            id="callAttemptTime"
            type="number"
            name="callAttemptTime"
            value={formData.callAttemptTime}
            onChange={handleInputChange}
            min="1"
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Cooldown */}
        <div>
          <label htmlFor="cooldown" className="block text-sm font-medium text-gray-700 mb-2">
            Pause Between Calls (seconds) *
          </label>
          <input
            id="cooldown"
            type="number"
            name="cooldown"
            value={formData.cooldown}
            onChange={handleInputChange}
            min="1"
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Max Connections */}
        <div>
          <label htmlFor="maxConnections" className="block text-sm font-medium text-gray-700 mb-2">
            Max Connections *
          </label>
          <input
            id="maxConnections"
            type="number"
            name="maxConnections"
            value={formData.maxConnections}
            onChange={handleInputChange}
            min="1"
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Min Duration */}
        <div>
          <label htmlFor="minDuration" className="block text-sm font-medium text-gray-700 mb-2">
            Min Call Duration (seconds) *
          </label>
          <input
            id="minDuration"
            type="number"
            name="minDuration"
            value={formData.minDuration}
            onChange={handleInputChange}
            min="1"
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> After creating the campaign, you can upload phone numbers, assign operators, and configure scheduling rules.
        </p>
      </div>
    </div>
  );
}
