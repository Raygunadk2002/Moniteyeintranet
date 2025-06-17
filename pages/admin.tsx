import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import RoleBasedAccessControl from '../components/RoleBasedAccessControl'
import Dashboard from '../components/Dashboard'
import SimpleDashboard from '../components/SimpleDashboard'

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

interface DatabaseStatus {
  success: boolean;
  message: string;
  instructions?: string[];
  tables?: Record<string, { accessible: boolean; recordCount?: number; error?: string }>;
}

interface CustomKPI {
  id: string;
  title: string;
  value: string;
  emoji: string;
  enabled: boolean;
}

export default function Admin() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null);
  const [testingDatabase, setTestingDatabase] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userDatabaseStatus, setUserDatabaseStatus] = useState<any>(null);
  const [settingUpUserDatabase, setSettingUpUserDatabase] = useState(false);

  // Default custom KPIs
  const defaultKPIs: CustomKPI[] = [
    { id: 'custom1', title: '', value: '', emoji: '📊', enabled: false },
    { id: 'custom2', title: '', value: '', emoji: '🎯', enabled: false }
  ];

  const [customKPIs, setCustomKPIs] = useState<CustomKPI[]>(defaultKPIs);

  // Check authentication and admin access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('moniteye-user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        if (user.role !== 'admin') {
          // Redirect non-admin users
          window.location.href = '/';
          return;
        }
      } else {
        // Redirect non-authenticated users
        window.location.href = '/login';
        return;
      }
      setIsLoading(false);
    }

    // Load custom KPIs from localStorage
    const savedKPIs = localStorage.getItem('moniteye-custom-kpis');
    if (savedKPIs) {
      try {
        setCustomKPIs(JSON.parse(savedKPIs));
      } catch (error) {
        console.error('Error loading custom KPIs:', error);
      }
    }
  }, []);

  const saveCustomKPIs = (kpis: CustomKPI[]) => {
    setCustomKPIs(kpis);
    localStorage.setItem('moniteye-custom-kpis', JSON.stringify(kpis));
  };

  const handleCustomKPIChange = (id: string, field: keyof CustomKPI, value: string | boolean) => {
    const updatedKPIs = customKPIs.map(kpi => 
      kpi.id === id ? { ...kpi, [field]: value } : kpi
    );
    saveCustomKPIs(updatedKPIs);
  };

  const resetCustomKPI = (id: string) => {
    const updatedKPIs = customKPIs.map(kpi => 
      kpi.id === id ? { ...kpi, title: '', value: '', emoji: kpi.id === 'custom1' ? '📊' : '🎯', enabled: false } : kpi
    );
    saveCustomKPIs(updatedKPIs);
  };

  const setupUserDatabase = async () => {
    setSettingUpUserDatabase(true);
    setUserDatabaseStatus(null);

    try {
      const response = await fetch('/api/setup-user-database', {
        method: 'POST',
      });

      const result = await response.json();
      setUserDatabaseStatus(result);
    } catch (error) {
      setUserDatabaseStatus({
        success: false,
        error: `User database setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setSettingUpUserDatabase(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/upload-revenue', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setUploadResult(result);

      if (result.success) {
        // Clear the selected file after successful upload
        setSelectedFile(null);
        // Reset the file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const testDatabase = async () => {
    setTestingDatabase(true);
    setDatabaseStatus(null);

    try {
      const response = await fetch('/api/test-database');
      const result = await response.json();
      setDatabaseStatus(result);
    } catch (error) {
      setDatabaseStatus({
        success: false,
        message: `Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setTestingDatabase(false);
    }
  };

  const runMigration = async () => {
    setIsRunning(true);
    setMessageType("info");
    setMessage("🔄 Running migration...");

    try {
      const response = await fetch('/api/migrate-equipment-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessageType("success");
        setMessage(`✅ Migration completed successfully: ${data.message}`);
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
    setMessageType("info");
    setMessage("🔄 Setting up tasks database...");

    try {
      const response = await fetch('/api/execute-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessageType("success");
        setMessage(`✅ Tasks database setup completed: ${data.message}`);
      } else {
        setMessageType("error");
        setMessage(`❌ Tasks database setup failed: ${data.error}`);
      }
    } catch (error) {
      setMessageType("error");
      setMessage(`❌ Tasks database setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin panel...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-6">
          <div className="bg-white border-b border-gray-200 px-6 py-4 -mx-6 -mt-6 mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">System administration and configuration</p>
            {currentUser && (
              <div className="mt-2 text-sm text-blue-600">
                Logged in as {currentUser.name} ({currentUser.role})
              </div>
            )}
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* User Database Setup Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">👥 User Management Setup</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">🎯 User Authentication System</h3>
                  <p className="text-sm text-blue-700">
                    Set up the user profiles table in Supabase to enable proper user management. 
                    This will create the necessary database schema and your admin account.
                  </p>
                </div>

                <button
                  onClick={setupUserDatabase}
                  disabled={settingUpUserDatabase}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {settingUpUserDatabase ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Setting Up User Database...
                    </>
                  ) : (
                    '🚀 Set Up User Database'
                  )}
                </button>

                {userDatabaseStatus && (
                  <div className={`rounded-md p-4 ${userDatabaseStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <h3 className={`text-sm font-medium mb-2 ${userDatabaseStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                      {userDatabaseStatus.success ? '✅ User Database Ready' : '❌ Setup Failed'}
                    </h3>
                    <p className={`text-sm mb-3 ${userDatabaseStatus.success ? 'text-green-700' : 'text-red-700'}`}>
                      {userDatabaseStatus.message}
                    </p>
                    
                    {userDatabaseStatus.success && userDatabaseStatus.adminCredentials && (
                      <div className="bg-white border border-green-300 rounded-md p-3 mt-3">
                        <h4 className="text-sm font-medium text-green-800 mb-2">🔐 Admin Login Credentials</h4>
                        <div className="text-sm text-green-700">
                          <p><strong>Email:</strong> {userDatabaseStatus.adminCredentials.email}</p>
                          <p><strong>Password:</strong> {userDatabaseStatus.adminCredentials.password}</p>
                        </div>
                        <p className="text-xs text-green-600 mt-2">
                          You can now use these credentials to log in with the "User Account" option and access the Users page to create new team members.
                        </p>
                      </div>
                    )}

                    {userDatabaseStatus.profilesTableExists && userDatabaseStatus.adminUserExists && (
                      <div className="bg-white border border-green-300 rounded-md p-3 mt-3">
                        <h4 className="text-sm font-medium text-green-800 mb-2">🎉 Next Steps</h4>
                        <div className="text-sm text-green-700">
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Go to the <strong>Users</strong> page from the navigation menu</li>
                            <li>Click <strong>"+ Add User"</strong> to create new team members</li>
                            <li>Check the console logs for generated passwords</li>
                            <li>Share credentials securely with new users</li>
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Database Setup Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">🔧 Revenue Database Setup</h2>
              
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
                  </div>
                )}
              </div>
            </div>

            {/* Custom KPI Management Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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

              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <button
                  onClick={() => saveCustomKPIs(customKPIs)}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  💾 Save Custom KPIs
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Changes are saved automatically. This button forces a manual save.
                </p>
              </div>
            </div>

            {/* Revenue Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">📊 Revenue Data Upload</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">📋 Supported Formats</h3>
                  <p className="text-sm text-blue-700 mb-2">
                    Upload CSV files with revenue data. The system will automatically detect and process various formats.
                  </p>
                  <ul className="text-xs text-blue-600 list-disc list-inside space-y-1">
                    <li>CSV files with Date and Revenue/Amount columns</li>
                    <li>Automatic date format detection (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)</li>
                    <li>Automatic currency symbol removal (£, $, €)</li>
                    <li>Monthly aggregation for dashboard display</li>
                  </ul>
                </div>

                <div>
                  <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                    Select CSV File
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {selectedFile && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Selected file:</span> {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Size: {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Upload Revenue Data'
                  )}
                </button>

                {uploadResult && (
                  <div className={`rounded-md p-4 ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <h3 className={`text-sm font-medium mb-2 ${uploadResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {uploadResult.success ? '✅ Upload Successful' : '❌ Upload Failed'}
                    </h3>
                    <p className={`text-sm mb-3 ${uploadResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {uploadResult.message || uploadResult.error}
                    </p>
                    
                    {uploadResult.success && (
                      <div className="bg-white border border-green-300 rounded-md p-3 mt-3">
                        <h4 className="text-sm font-medium text-green-800 mb-2">📊 Processing Summary</h4>
                        <div className="text-sm text-green-700 space-y-1">
                          {uploadResult.recordsProcessed && (
                            <p><strong>Records processed:</strong> {uploadResult.recordsProcessed}</p>
                          )}
                          {uploadResult.monthsGenerated && (
                            <p><strong>Months generated:</strong> {uploadResult.monthsGenerated}</p>
                          )}
                          {uploadResult.totalRevenue && (
                            <p><strong>Total revenue:</strong> £{uploadResult.totalRevenue.toLocaleString()}</p>
                          )}
                          {uploadResult.dateRange && (
                            <p><strong>Date range:</strong> {uploadResult.dateRange}</p>
                          )}
                          {uploadResult.detectedFormat && (
                            <p><strong>Detected format:</strong> {uploadResult.detectedFormat}</p>
                          )}
                        </div>
                        {uploadResult.summary && (
                          <div className="mt-2">
                            <p className="text-xs text-green-600">{uploadResult.summary}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {!uploadResult.success && uploadResult.suggestions && (
                      <div className="bg-white border border-red-300 rounded-md p-3 mt-3">
                        <h4 className="text-sm font-medium text-red-800 mb-2">💡 Suggestions</h4>
                        <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                          {uploadResult.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* System Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">⚙️ System Actions</h2>
              
              <div className="space-y-4">
                {message && (
                  <div className={`rounded-md p-4 ${
                    messageType === 'success' ? 'bg-green-50 border border-green-200' :
                    messageType === 'error' ? 'bg-red-50 border border-red-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <p className={`text-sm ${
                      messageType === 'success' ? 'text-green-700' :
                      messageType === 'error' ? 'text-red-700' :
                      'text-blue-700'
                    }`}>
                      {message}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={runMigration}
                    disabled={isRunning}
                    className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isRunning ? 'Running...' : '🔄 Run Equipment Migration'}
                  </button>

                  <button
                    onClick={setupTasksDatabase}
                    disabled={isRunning}
                    className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isRunning ? 'Setting up...' : '📋 Setup Tasks Database'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 