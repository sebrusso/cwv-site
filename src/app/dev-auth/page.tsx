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
        <h2 className="text-lg font-semibold">Email Confirmation in Local Development</h2>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-medium text-yellow-800 mb-2">⚠️ Email Delivery Issue</h3>
          <p className="text-sm text-yellow-700 mb-3">
            In local development, Supabase requires email confirmation but emails are not sent unless 
            you configure an SMTP provider. This is a common issue.
          </p>
          
          <h4 className="font-medium text-yellow-800 mb-2">Solutions:</h4>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>
              <strong>For Testing:</strong> Use the Supabase Dashboard to manually confirm users
            </li>
            <li>
              <strong>For Development:</strong> Configure Supabase auth settings to disable email confirmation
            </li>
            <li>
              <strong>For Production:</strong> Set up a proper email service (SendGrid, etc.)
            </li>
          </ol>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-medium text-green-800 mb-2">✅ Quick Fix Instructions</h3>
          <ol className="text-sm text-green-700 space-y-2 list-decimal list-inside">
            <li>
              Go to your Supabase project dashboard: <br />
              <code className="bg-white px-2 py-1 rounded text-xs">
                https://supabase.com/dashboard/project/huavbzsevepndkbgikoi
              </code>
            </li>
            <li>Navigate to Authentication → Settings</li>
            <li>Under &quot;Email Confirmation&quot;, toggle off &quot;Enable email confirmations&quot;</li>
            <li>Save the changes</li>
            <li>Try creating a new account - it should work immediately!</li>
          </ol>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Current Authentication State</h2>
        <AuthDebugPanel />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/auth/signup" className="p-4 border rounded-md hover:bg-gray-50">
            <h3 className="font-medium">Test Signup</h3>
            <p className="text-sm text-gray-600">Try creating a new account</p>
          </Link>
          <Link href="/login" className="p-4 border rounded-md hover:bg-gray-50">
            <h3 className="font-medium">Test Login</h3>
            <p className="text-sm text-gray-600">Try signing in</p>
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
              <span className="font-medium">Debug Mode:</span>
              <span className={config.debugMode ? "text-green-600" : "text-gray-600"}>
                {config.debugMode ? " On" : " Off"}
              </span>
            </div>
            <div>
              <span className="font-medium">Site URL:</span>
              <span className="text-gray-600"> {process.env.NEXT_PUBLIC_SITE_URL || "Not set"}</span>
            </div>
            <div>
              <span className="font-medium">Environment:</span>
              <span className="text-gray-600"> {process.env.NODE_ENV}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}