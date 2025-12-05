/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, ArrowLeft } from 'lucide-react';

interface FeedProduct {
  id: string;
  animalType: 'PIG' | 'CATTLE';
  feedType: 'STARTER' | 'GROWER' | 'FINISHER' | 'GESTATION' | 'LACTATING';
  name: string;
  unit: string;
  unitSize: number;
  pricePerUnit: number;
}

export default function FeedsPage() {
  const router = useRouter();
  const [feeds, setFeeds] = useState<FeedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newUnitSize, setNewUnitSize] = useState<number>(0);

  const [formData, setFormData] = useState({
    animalType: 'PIG' as 'PIG' | 'CATTLE',
    feedType: 'STARTER' as 'STARTER' | 'GROWER' | 'FINISHER' | 'GESTATION' | 'LACTATING',
    name: '',
    unit: 'KG',
    unitSize: 25,
    pricePerUnit: 0,
    initalStock: 0,
  });

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/admin/feed/bulk', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setFeeds(data.feedProducts);
      }
    } catch (err) {
      console.error('Error fetching feeds:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeed = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/admin/feed/add-finished-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setShowAddModal(false);
        fetchFeeds();
        setFormData({
          animalType: 'PIG',
          feedType: 'STARTER',
          name: '',
          unit: 'KG',
          unitSize: 25,
          pricePerUnit: 0,
          initalStock: 0,
        });
      }
    } catch (err) {
      console.error('Error adding feed:', err);
    }
  };

  const handleUpdateUnitSize = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/v1/admin/feed/update/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ unitSize: newUnitSize }),
      });
      const data = await response.json();
      if (data.success) {
        setEditingId(null);
        fetchFeeds();
      }
    } catch (err) {
      console.error('Error updating unit size:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-black">Loading...</p>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-black">Feed Products</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Feed Product
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Feed Products List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-black">Animal Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-black">Feed Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-black">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-black">Unit Size</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-black">Price/Unit</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {feeds.map((feed) => (
                <tr key={feed.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{feed.animalType}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{feed.feedType}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{feed.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {editingId === feed.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={newUnitSize}
                          onChange={(e) => setNewUnitSize(Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-black"
                        />
                        <button
                          onClick={() => handleUpdateUnitSize(feed.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span>{feed.unitSize} {feed.unit}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">₹{feed.pricePerUnit}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => {
                        setEditingId(feed.id);
                        setNewUnitSize(feed.unitSize);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Feed Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-black mb-4">Add Feed Product</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Animal Type</label>
                <select
                  value={formData.animalType}
                  onChange={(e) => setFormData({ ...formData, animalType: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                >
                  <option value="PIG">Pig</option>
                  <option value="CATTLE">Cattle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Feed Type</label>
                <select
                  value={formData.feedType}
                  onChange={(e) => setFormData({ ...formData, feedType: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                >
                  <option value="STARTER">Starter</option>
                  <option value="GROWER">Grower</option>
                  <option value="FINISHER">Finisher</option>
                  <option value="GESTATION">Gestation</option>
                  <option value="LACTATING">Lactating</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Unit Size (KG)</label>
                <input
                  type="number"
                  value={formData.unitSize}
                  onChange={(e) => setFormData({ ...formData, unitSize: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Price per Unit (₹)</label>
                <input
                  type="number"
                  value={formData.pricePerUnit}
                  onChange={(e) => setFormData({ ...formData, pricePerUnit: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Initial Stock</label>
                <input
                  type="number"
                  value={formData.initalStock}
                  onChange={(e) => setFormData({ ...formData, initalStock: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleAddFeed}
                  className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Add Product
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-black py-2 rounded-lg hover:bg-gray-300 transition-colors"
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