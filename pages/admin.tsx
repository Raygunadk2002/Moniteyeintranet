import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

interface UploadResult {
  success: boolean;
  message?: string;
  recordsProcessed?: number;
  monthsGenerated?: number;
  totalRevenue?: number;
  detectedFormat?: string;
  dateRange?: string;
  summary?: string;
  error?: string;
  suggestions?: string[];
}

interface CustomKPI {
  id: string;
  title: string;
  value: string;
  emoji: string;
  enabled: boolean;
}

export default function Admin() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [testingDatabase, setTestingDatabase] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<any>(null);
  
  // Custom KPI Management
  const [customKPIs, setCustomKPIs] = useState<CustomKPI[]>([
    { id: '1', title: '', value: '', emoji: '📊', enabled: false },
    { id: '2', title: '', value: '', emoji: '💰', enabled: false }
  ]);
  const [isClient, setIsClient] = useState(false);

  // Load custom KPIs from localStorage after component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('customKPIs');
      if (stored) {
        try {
          const parsedKPIs = JSON.parse(stored);
          setCustomKPIs(parsedKPIs);
        } catch (error) {
          console.warn('Failed to load custom KPIs from localStorage:', error);
        }
      }
    }
  }, []);

  const saveCustomKPIs = (kpis: CustomKPI[]) => {
    setCustomKPIs(kpis);
    if (typeof window !== 'undefined') {
      localStorage.setItem('customKPIs', JSON.stringify(kpis));
    }
  };

  const handleCustomKPIChange = (id: string, field: keyof CustomKPI, value: string | boolean) => {
    const updatedKPIs = customKPIs.map(kpi => 
      kpi.id === id ? { ...kpi, [field]: value } : kpi
    );
    saveCustomKPIs(updatedKPIs);
  };

  const resetCustomKPI = (id: string) => {
    const updatedKPIs = customKPIs.map(kpi => 
      kpi.id === id ? { ...kpi, title: '', value: '', emoji: '📊', enabled: false } : kpi
    );
    saveCustomKPIs(updatedKPIs);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null); // Clear previous results
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-revenue', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          recordsProcessed: data.recordsProcessed,
          monthsGenerated: data.monthsGenerated,
          totalRevenue: data.totalRevenue,
          detectedFormat: data.detectedFormat,
          dateRange: data.dateRange,
          summary: data.summary,
        });
      } else {
        setResult({
          success: false,
          error: data.error,
          suggestions: data.suggestions,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Upload failed. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  const testDatabase = async () => {
    setTestingDatabase(true);
    setDatabaseStatus(null);

    try {
      const response = await fetch('/api/test-supabase');
      const data = await response.json();
      setDatabaseStatus(data);
    } catch (error) {
      setDatabaseStatus({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTestingDatabase(false);
    }
  };

  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const runMigration = async () => {
    setIsRunning(true);
    setMessage("");
    
    try {
      const response = await fetch('/api/migrate-man-days', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setMessageType("success");
        setMessage(`✅ Migration completed successfully! ${data.message}`);
      } else {
        setMessageType("error");
        setMessage(`❌ Migration failed: ${data.error}`);
      }
    } catch (error) {
      setMessageType("error");
      setMessage(`❌ Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const setupTasksDatabase = async () => {
    setIsRunning(true);
    setMessage("");
    
    try {
      const response = await fetch('/api/setup-tasks-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setMessageType("success");
        setMessage(`✅ Database setup completed successfully!`);
      } else {
        setMessageType("error");
        setMessage(`❌ Setup failed: ${data.error}`);
      }
    } catch (error) {
      setMessageType("error");
      setMessage(`❌ Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-6">
          <div className="bg-white border-b border-gray-200 px-6 py-4 -mx-6 -mt-6 mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Upload invoice data to update revenue trends</p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Database Setup Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">🔧 Database Setup</h2>
              
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-amber-800 mb-2">⚠️ Setup Required</h3>
                  <p className="text-sm text-amber-700">
                    Before uploading files, you need to set up the required database tables. Click "Test Database" to check if they exist.
                  </p>
                </div>

                <button
                  onClick={testDatabase}
                  disabled={testingDatabase}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {testingDatabase ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Testing Database...
                    </>
                  ) : (
                    'Test Database Setup'
                  )}
                </button>

                {databaseStatus && (
                  <div className={`rounded-md p-4 ${databaseStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <h3 className={`text-sm font-medium mb-2 ${databaseStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                      {databaseStatus.success ? '✅ Database Ready' : '❌ Database Setup Required'}
                    </h3>
                    <p className={`text-sm mb-3 ${databaseStatus.success ? 'text-green-700' : 'text-red-700'}`}>
                      {databaseStatus.message}
                    </p>
                    
                    {!databaseStatus.success && databaseStatus.instructions && (
                      <div className="bg-white rounded border border-red-300 p-3">
                        <h4 className="text-sm font-medium text-red-800 mb-2">Setup Instructions:</h4>
                        <ol className="text-sm text-red-700 list-decimal list-inside space-y-1">
                          {databaseStatus.instructions.map((instruction: string, index: number) => (
                            <li key={index}>{instruction}</li>
                          ))}
                        </ol>
                        <div className="mt-3 p-2 bg-gray-100 rounded text-xs font-mono">
                          <p className="font-medium mb-1">Copy this file to your Supabase SQL Editor:</p>
                          <p className="text-blue-600">database-schema.sql</p>
                        </div>
                      </div>
                    )}

                    {databaseStatus.tables && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-800 mb-2">Table Status:</h4>
                        <div className="space-y-1">
                          {Object.entries(databaseStatus.tables).map(([tableName, tableInfo]: [string, any]) => (
                            <div key={tableName} className="flex items-center justify-between text-xs">
                              <span className="font-medium">{tableName}</span>
                              <span className={tableInfo.accessible ? 'text-green-600' : 'text-red-600'}>
                                {tableInfo.accessible ? `✓ Ready (${tableInfo.recordCount} records)` : `✗ ${tableInfo.error || 'Missing'}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Custom KPI Management Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">🎯 Custom KPI Management</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Custom KPI Tiles</h3>
                <p className="text-sm text-blue-700">
                  Add up to 2 additional KPI tiles to your dashboard with custom titles, values, and emojis. 
                  These are static values that you can update manually anytime.
                </p>
              </div>

              <div className="space-y-6">
                {customKPIs.map((kpi, index) => (
                  <div key={kpi.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium text-gray-900">Custom KPI #{index + 1}</h3>
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={kpi.enabled}
                            onChange={(e) => handleCustomKPIChange(kpi.id, 'enabled', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">Enable</span>
                        </label>
                        <button
                          onClick={() => resetCustomKPI(kpi.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Emoji
                        </label>
                        <input
                          type="text"
                          value={kpi.emoji}
                          onChange={(e) => handleCustomKPIChange(kpi.id, 'emoji', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-2xl"
                          placeholder="📊"
                          maxLength={2}
                        />
                        <p className="text-xs text-gray-500 mt-1">Single emoji only</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={kpi.title}
                          onChange={(e) => handleCustomKPIChange(kpi.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Customer Satisfaction"
                          maxLength={50}
                        />
                        <p className="text-xs text-gray-500 mt-1">Max 50 characters</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Value
                        </label>
                        <input
                          type="text"
                          value={kpi.value}
                          onChange={(e) => handleCustomKPIChange(kpi.id, 'value', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 98.5% or £125,000"
                          maxLength={20}
                        />
                        <p className="text-xs text-gray-500 mt-1">Max 20 characters</p>
                      </div>
                    </div>

                    {/* Preview */}
                    {kpi.enabled && kpi.title && kpi.value && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-600 font-medium mb-2">Preview:</p>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                              <p className="text-xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                            </div>
                            <div className="text-2xl">{kpi.emoji}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-green-800 mb-2">✅ Quick Setup Tips</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Enable the toggle to show the KPI tile on your dashboard</li>
                  <li>• Use clear, descriptive titles (e.g., "Customer Satisfaction", "Team Size")</li>
                  <li>• Include units in your values (e.g., "98.5%", "£125,000", "42 people")</li>
                  <li>• Choose relevant emojis that represent your metric (📈, 👥, ⭐, 🎯)</li>
                  <li>• Changes are saved automatically and appear immediately on the dashboard</li>
                </ul>
              </div>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">📊 Upload Invoice Data</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-800 mb-2">🔍 Smart Auto-Detection Features</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Automatic column detection:</strong> Finds invoice dates and amounts automatically</li>
                  <li>• <strong>Flexible date formats:</strong> Supports DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, "January 15, 2025", etc.</li>
                  <li>• <strong>Intelligent grouping:</strong> Groups individual invoices by month and sums totals</li>
                  <li>• <strong>Multi-language headers:</strong> Recognizes date/amount columns in English, Spanish, and more</li>
                  <li>• <strong>Flexible layout:</strong> Columns can be in any order (A, B, C, etc.)</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Excel File with Invoice Data
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload your Excel file containing individual invoice records with dates and amounts
                  </p>
                </div>

                {file && (
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm text-gray-600">
                      <strong>Selected file:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Invoice Data...
                    </>
                  ) : (
                    'Upload & Process Invoices'
                  )}
                </button>
              </div>

              {/* Results */}
              {result && (
                <div className="mt-6">
                  {result.success ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">✅ {result.message}</h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p><strong>Processed:</strong> {result.recordsProcessed} individual invoices</p>
                            <p><strong>Generated:</strong> {result.monthsGenerated} monthly revenue entries</p>
                            <p><strong>Total Revenue:</strong> £{result.totalRevenue?.toLocaleString()}</p>
                            <p><strong>Date Range:</strong> {result.dateRange}</p>
                            {result.detectedFormat && (
                              <p><strong>Auto-detected:</strong> {result.detectedFormat}</p>
                            )}
                            {result.summary && (
                              <p className="mt-2 font-medium">{result.summary}</p>
                            )}
                          </div>
                          <div className="mt-3">
                            <button 
                              onClick={() => window.location.href = '/'}
                              className="text-sm bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md"
                            >
                              View Updated Dashboard →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">❌ Upload Failed</h3>
                          <p className="text-sm text-red-700 mt-1">{result.error}</p>
                          {result.suggestions && result.suggestions.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-red-800">💡 Suggestions:</p>
                              <ul className="text-sm text-red-700 mt-1 list-disc list-inside space-y-1">
                                {result.suggestions.map((suggestion, index) => (
                                  <li key={index}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Documentation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">📖 Supported Excel Formats</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">✅ Date Column Examples:</h3>
                  <div className="bg-gray-50 rounded-md p-3 text-sm font-mono">
                    <div className="text-green-600">• 2025-01-15</div>
                    <div className="text-green-600">• 15/01/2025</div>
                    <div className="text-green-600">• 01/15/2025</div>
                    <div className="text-green-600">• January 15, 2025</div>
                    <div className="text-green-600">• 15 January 2025</div>
                    <div className="text-green-600">• 15-01-2025</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">✅ Amount Column Examples:</h3>
                  <div className="bg-gray-50 rounded-md p-3 text-sm font-mono">
                    <div className="text-green-600">• 1250.50</div>
                    <div className="text-green-600">• 850</div>
                    <div className="text-green-600">• 12500.00</div>
                    <div className="text-red-600">• £1,250.50 (remove currency)</div>
                    <div className="text-red-600">• $850.00 (remove currency)</div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">🎯 How It Works:</h3>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li><strong>1. Upload Individual Invoices:</strong> Each row should contain one invoice with its date and amount</li>
                  <li><strong>2. Automatic Detection:</strong> System finds date and amount columns using smart content analysis</li>
                  <li><strong>3. Monthly Grouping:</strong> All invoices are automatically grouped by month (e.g., all January 2025 invoices summed together)</li>
                  <li><strong>4. Dashboard Update:</strong> Monthly totals are used to create the revenue trend chart</li>
                  <li><strong>5. Real-time Metrics:</strong> Total revenue and growth calculations update automatically</li>
                </ol>
              </div>

              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">💡 Pro Tips:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Include headers like "Date", "Invoice Date", "Amount", "Value" for best detection</li>
                  <li>• Remove currency symbols (£, $, €) from amount columns</li>
                  <li>• Ensure dates are in a consistent format within the same column</li>
                  <li>• Use separate columns for dates and amounts (don't combine in one cell)</li>
                  <li>• System handles mixed date formats and flexible column orders automatically</li>
                </ul>
              </div>
            </div>

            {/* Database Management Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Database Management</h2>
              
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Setup Tasks Database</h3>
                  <p className="text-gray-600 mb-4">
                    Initialize the tasks database with default columns and sample data.
                  </p>
                  <button
                    onClick={setupTasksDatabase}
                    disabled={isRunning}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isRunning ? "Setting up..." : "Setup Tasks Database"}
                  </button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Add Man Days Migration</h3>
                  <p className="text-gray-600 mb-4">
                    Add the "man_days" column to the tasks table to track estimated work duration for each task.
                  </p>
                  <button
                    onClick={runMigration}
                    disabled={isRunning}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isRunning ? "Running Migration..." : "Run Man Days Migration"}
                  </button>
                </div>
              </div>

              {message && (
                <div className={`mt-4 p-4 rounded-lg ${
                  messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                  messageType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                  'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  {message}
                </div>
              )}
            </div>

            {/* Quick Links Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quick Links</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <a
                  href="/tasks"
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <h3 className="font-semibold text-blue-800">📋 Tasks</h3>
                  <p className="text-sm text-blue-600">Manage project tasks</p>
                </a>
                <a
                  href="/calendar"
                  className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <h3 className="font-semibold text-green-800">📅 Calendar</h3>
                  <p className="text-sm text-green-600">View team calendars</p>
                </a>
                <a
                  href="/equipment"
                  className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <h3 className="font-semibold text-purple-800">🔧 Equipment</h3>
                  <p className="text-sm text-purple-600">Manage equipment inventory</p>
                </a>
              </div>
            </div>

            {/* Feature Info Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">New Features</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-800">Man Days Tracking</h3>
                  <p className="text-gray-600">
                    Tasks now support estimated man days to help with project planning and resource allocation. 
                    The man days are displayed on each task card and totaled at the column level.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-gray-800">Enhanced Task Cards</h3>
                  <p className="text-gray-600">
                    Task cards now show man days estimation alongside priority and assignee information.
                    Column headers display the total man days for all tasks in that column.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 