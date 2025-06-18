import { AuthDebugPanel } from '@/components/AuthDebugPanel';
import { config } from '@/lib/config-client';
import Link from 'next/link';

export default function DevAuthPage() {
  // Only show this page in development
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-xl font-semibold mb-4">Page Not Available</h1>
        <p className="text-gray-600 mb-4">
          This page is only available in development mode.
        </p>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Authentication Debug</h1>
      
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h2 className="font-medium text-blue-800 mb-2">Development Mode Active</h2>
        <p className="text-sm text-blue-700">
          This page helps debug authentication issues during local development.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Expected Behavior Test</h2>
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-medium text-green-800 mb-2">Correct Anonymous User Flow:</h3>
          <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
            <li><strong>Visit homepage</strong> → Should see profile button with login form (no sign out button)</li>
            <li><strong>Use website features</strong> → Should work normally without authentication</li>
            <li><strong>See signup encouragement</strong> → Should see banners encouraging account creation</li>
            <li><strong>After signing up/in</strong> → Should see profile info + sign out button</li>
            <li><strong>After signing out</strong> → Should return to anonymous mode (login form in profile button)</li>
          </ol>
        </div>
        
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="font-medium text-red-800 mb-2">Current Issue:</h3>
          <p className="text-sm text-red-700">
            Anonymous users are seeing a &quot;Sign out&quot; button when they should only see login/signup options.
            This suggests mock user data is being set when it shouldn&apos;t be.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Debug Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            href="/" 
            className="block p-4 bg-gray-50 border rounded-md hover:bg-gray-100 transition-colors"
          >
            <h3 className="font-medium">Test Home Page</h3>
            <p className="text-sm text-gray-600">Go to homepage and check profile button behavior</p>
          </Link>
          
          <Link 
            href="/dashboard" 
            className="block p-4 bg-gray-50 border rounded-md hover:bg-gray-100 transition-colors"
          >
            <h3 className="font-medium">Test Dashboard</h3>
            <p className="text-sm text-gray-600">Check if dashboard shows anonymous encouragement</p>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Configuration</h2>
        <div className="p-4 bg-gray-50 border rounded-md">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Authentication:</span>
              <span className={config.disableAuthentication ? "text-red-600" : "text-green-600"}>
                {config.disableAuthentication ? " Disabled" : " Enabled"}
              </span>
            </div>
            <div>
              <span className="font-medium">Mode:</span>
              <span className="text-blue-600">
                {config.disableAuthentication ? " Mock User Mode" : " Hybrid Mode"}
              </span>
            </div>
            <div>
              <span className="font-medium">Debug Mode:</span>
              <span className={config.debugMode ? "text-green-600" : "text-gray-600"}>
                {config.debugMode ? " On" : " Off"}
              </span>
            </div>
            <div>
              <span className="font-medium">Environment:</span>
              <span className="text-gray-600"> {process.env.NODE_ENV}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Instructions</h2>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
            <li>Open browser dev tools console to see debug logs</li>
            <li>Check the red dot on the profile button (AUTH = authenticated, ANON = anonymous)</li>
            <li>Click the profile button and see what&apos;s displayed</li>
            <li>If you see a sign out button for anonymous users, that&apos;s the bug</li>
            <li>Try the &quot;Clear Auth State&quot; button in the debug panel if needed</li>
          </ol>
        </div>
      </div>

      <AuthDebugPanel />

      <div className="text-center">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}