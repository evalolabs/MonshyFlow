import { useState } from 'react';
import { useParams } from 'react-router-dom';

export function WebhookTestPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const [testData, setTestData] = useState('{"message": "Hello from webhook test!"}');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testWebhook = async () => {
    if (!workflowId) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch(`/api/webhook/${workflowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: testData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setResponse(data);
      } else {
        setError(data.message || 'Webhook test failed');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getWorkflowStatus = async () => {
    if (!workflowId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/webhook/${workflowId}/status`);
      const data = await response.json();
      
      if (response.ok) {
        setResponse(data);
      } else {
        setError(data.message || 'Failed to get workflow status');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Webhook Test</h1>
          
          {workflowId && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Workflow ID</h2>
              <code className="text-blue-600 font-mono">{workflowId}</code>
            </div>
          )}

          <div className="space-y-6">
            {/* Test Data Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Data (JSON)
              </label>
              <textarea
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder='{"message": "Hello from webhook test!"}'
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={testWebhook}
                disabled={loading || !workflowId}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium"
              >
                {loading ? 'Testing...' : 'Test Webhook'}
              </button>
              
              <button
                onClick={getWorkflowStatus}
                disabled={loading || !workflowId}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium"
              >
                {loading ? 'Loading...' : 'Get Status'}
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold mb-2">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Response Display */}
            {response && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-gray-800 font-semibold mb-2">Response</h3>
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}

            {/* Webhook URL Display */}
            {workflowId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-yellow-800 font-semibold mb-2">Webhook URL</h3>
                <div className="flex items-center gap-2">
                  <code className="text-yellow-700 font-mono bg-yellow-100 px-2 py-1 rounded">
                    POST {window.location.origin}/api/webhook/{workflowId}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/webhook/${workflowId}`)}
                    className="text-yellow-600 hover:text-yellow-800"
                    title="Copy URL"
                  >
                    📋
                  </button>
                </div>
                <p className="text-yellow-700 text-sm mt-2">
                  Use this URL to trigger the workflow from external systems
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
