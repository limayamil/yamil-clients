import { getCurrentUser } from '@/lib/auth/simple-auth';

export const dynamic = 'force-dynamic';

export default async function TestProviderPage() {
  console.log('🧪 TestProvider: Starting simple provider test');

  try {
    const user = await getCurrentUser();
    console.log('🧪 TestProvider: getCurrentUser result:', {
      hasUser: !!user,
      userEmail: user?.email,
      userRole: user?.role,
      userId: user?.id
    });

    if (!user) {
      console.log('🧪 TestProvider: No user found, this should not happen if auth is working');
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-red-600">❌ No User Found</h1>
          <p>This page should only be accessible to authenticated users.</p>
        </div>
      );
    }

    if (user.role !== 'provider') {
      console.log('🧪 TestProvider: User is not a provider:', user.role);
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-yellow-600">⚠️ Wrong Role</h1>
          <p>User role: {user.role}</p>
          <p>Expected: provider</p>
        </div>
      );
    }

    console.log('🧪 TestProvider: SUCCESS - Provider auth working correctly');

    return (
      <div className="p-8 space-y-4">
        <h1 className="text-2xl font-bold text-green-600">✅ Provider Auth Test SUCCESS</h1>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h2 className="font-semibold text-green-800">User Details:</h2>
          <ul className="mt-2 space-y-1 text-green-700">
            <li><strong>Email:</strong> {user.email}</li>
            <li><strong>Role:</strong> {user.role}</li>
            <li><strong>ID:</strong> {user.id}</li>
            <li><strong>Name:</strong> {user.name || 'Not set'}</li>
            <li><strong>Active:</strong> {user.active ? 'Yes' : 'No'}</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h2 className="font-semibold text-blue-800">Environment Check:</h2>
          <ul className="mt-2 space-y-1 text-blue-700">
            <li><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</li>
            <li><strong>Has Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Yes' : 'No'}</li>
            <li><strong>Has Service Role:</strong> {process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No'}</li>
            <li><strong>Has JWT Secret:</strong> {process.env.JWT_SECRET ? 'Yes' : 'No'}</li>
          </ul>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            This test page confirms that provider authentication is working correctly.
            If you can see this message, the JWT auth system is functioning properly.
          </p>
        </div>
      </div>
    );

  } catch (error) {
    console.error('🧪 TestProvider: ERROR during test:', error);

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">💥 Test Failed</h1>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4">
          <p className="text-red-800 font-semibold">Error Details:</p>
          <pre className="mt-2 text-sm text-red-700 overflow-x-auto">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    );
  }
}