'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowLeft, Package } from 'lucide-react';

export default function RawMaterialsPage() {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    unit: 'KG',
  });

  const handleAddRawMaterial = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:8080/api/v1/admin/feed/add-raw-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Raw material added successfully!');
        setShowAddModal(false);
        setFormData({ name: '', unit: 'KG' });
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to add raw material');
      }
    } catch (err) {
      console.error('Error adding raw material:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </button>
            <h1 className="text-2xl font-bold text-black">Raw Materials</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Raw Material
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <Package className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Raw Materials Management</h2>
              <p className="text-blue-800 mb-2">
                Add raw materials that will be used in your feed production process. 
                These materials will be tracked in your inventory system.
              </p>
              <p className="text-sm text-blue-700">
                Common raw materials include: Maize, Soybean Meal, Fish Meal, Wheat Bran, Rice Bran, etc.
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon - Stock Management */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Stock Management Coming Soon</h3>
          <p className="text-gray-600 mb-4">
            Full raw material stock tracking, ledger, and transaction history will be available in the next update.
          </p>
          <p className="text-sm text-gray-500">
            For now, you can add raw material types to your system.
          </p>
        </div>
      </div>

      {/* Add Raw Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-black mb-4">Add Raw Material</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Material Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Maize, Soybean Meal"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Unit of Measurement *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="KG">Kilogram (KG)</option>
                  <option value="TON">Ton</option>
                  <option value="QUINTAL">Quintal</option>
                  <option value="BAG">Bag</option>
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Once added, you will be able to track stock levels and transactions in future updates.
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleAddRawMaterial}
                  disabled={loading || !formData.name}
                  className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Material'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setError('');
                    setFormData({ name: '', unit: 'KG' });
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-200 text-black py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}