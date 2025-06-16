import { useState } from 'react';
import Link from 'next/link';

export default function MigrateEquipment() {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    if (!confirm('This will change the equipment database schema to use serial_number as the primary key. This is a significant change. Are you sure you want to proceed?')) {
      return;
    }

    setMigrating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/migrate-equipment-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Migration failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Equipment Schema Migration
            </h1>
            <p className="text-lg text-gray-600">
              Update equipment system to use serial number as primary key
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important: Database Schema Change
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>This migration will:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Change the primary key from UUID to serial_number</li>
                    <li>Make serial_number a required field</li>
                    <li>Update all related tables (notes, maintenance, calibration)</li>
                    <li>Preserve all existing data where serial numbers exist</li>
                    <li>Skip equipment records without serial numbers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                What this migration does:
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Backs up all existing equipment data</li>
                <li>• Recreates tables with serial_number as primary key</li>
                <li>• Migrates existing data to new schema</li>
                <li>• Updates foreign key references in related tables</li>
                <li>• Preserves all equipment information and history</li>
              </ul>
            </div>

            <div className="flex justify-center space-x-4">
              <Link
                href="/equipment"
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel - Back to Equipment
              </Link>
              <button
                onClick={runMigration}
                disabled={migrating}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {migrating ? 'Running Migration...' : 'Run Migration'}
              </button>
            </div>

            {migrating && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">
                  Migration in progress... This may take a few minutes.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Migration Failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Migration Completed Successfully!
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>{result.message}</p>
                      {result.details && (
                        <div className="mt-2">
                          <p>Details:</p>
                          <ul className="list-disc list-inside mt-1">
                            <li>Backed up: {result.details.backedUpRecords} records</li>
                            <li>Migrated: {result.details.migratedRecords} records</li>
                            <li>Skipped: {result.details.skippedRecords} records (no serial number)</li>
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <Link
                        href="/equipment"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-800 bg-green-100 hover:bg-green-200"
                      >
                        Go to Equipment List
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 