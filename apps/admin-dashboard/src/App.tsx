export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 mb-6">
          Welcome to the RetailPlatform Administrative Panel. Monitor metrics, manage products, and fulfill customer orders.
        </p>
        <div className="flex gap-3">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
            Vite + React
          </span>
          <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
            Nx Workspace
          </span>
        </div>
      </div>
    </div>
  );
}
