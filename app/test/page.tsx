'use client';

import { useState } from 'react';

export default function TestPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testEndpoints = async () => {
    setLoading(true);
    const endpoints = [
      '/auth',
      '/user/login',
      '/user/auth',
      '/login',
      '/users/login',
      '/api/auth',
      '/authenticate',
      '/account/login',
      '/system/login',
    ];

    const testEmail = 'test@example.com';
    const testPassword = 'testpass';

    const endpointResults: any = {};

    for (const endpoint of endpoints) {
      try {
        const response = await fetch('/api/sipuni', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint,
            method: 'POST',
            data: { email: testEmail, password: testPassword },
          }),
        });

        const data = await response.json();
        endpointResults[endpoint] = {
          status: response.status,
          hasData: !!data,
          dataKeys: typeof data === 'object' ? Object.keys(data).slice(0, 5) : 'not-object',
        };
      } catch (error) {
        endpointResults[endpoint] = { error: String(error) };
      }
    }

    setResults(endpointResults);
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Sipuni API Endpoint Tester</h1>
      <button onClick={testEndpoints} disabled={loading} style={{ padding: '10px 20px' }}>
        {loading ? 'Testing...' : 'Test All Endpoints'}
      </button>

      <pre style={{ marginTop: '20px', background: '#f0f0f0', padding: '10px' }}>
        {JSON.stringify(results, null, 2)}
      </pre>

      <div style={{ marginTop: '20px', color: '#666' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Click &quot;Test All Endpoints&quot; button</li>
          <li>Check the results to see which endpoint doesn&apos;t return 404</li>
          <li>Report the working endpoint</li>
        </ol>
      </div>
    </div>
  );
}
