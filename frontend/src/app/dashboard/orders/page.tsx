/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowLeft, ShoppingCart } from 'lucide-react';

interface FeedProduct {
  id: string;
  name: string;
  pricePerUnit: number;
  animalType: string;
  feedType: string;
}

interface OrderItem {
  feedProductId: string;
  quantity: number;
}

interface OrderPreview {
  items: Array<{
    feedProductId: string;
    name: string;
    quantity: number;
    pricePerUnit: number;
    subtotal: number;
  }>;
  totalAmount: number;
  discountType: 'FLAT' | 'PERCENTAGE' | null;
  discountValue: number;
  finalAmount: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const [step, setStep] = useState<'customer' | 'items' | 'preview'>('customer');
  const [feeds, setFeeds] = useState<FeedProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // Customer data
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  // Order data
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CREDIT' | 'ONLINE'>('CASH');
  const [discountType, setDiscountType] = useState<'FLAT' | 'PERCENTAGE' | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [orderPreview, setOrderPreview] = useState<OrderPreview | null>(null);

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
    }
  };

  const handleCustomerSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/v1/admin/order/check-customer-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(customerData),
      });
      const data = await response.json();
      if (data.success) {
        setStep('items');
      }
    } catch (err) {
      console.error('Error checking customer:', err);
    } finally {
      setLoading(false);
    }
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { feedProductId: '', quantity: 1 }]);
  };

  const updateOrderItem = (index: number, field: 'feedProductId' | 'quantity', value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handlePreviewOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/v1/admin/order/preview-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: orderItems,
          paymentMethod,
          discountType,
          discountValue,
          deliveryDate: deliveryDate || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setOrderPreview(data.data);
        setStep('preview');
      }
    } catch (err) {
      console.error('Error previewing order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/v1/admin/order/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: orderItems,
          paymentMethod,
          discountType,
          discountValue,
          deliveryDate: deliveryDate || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Order placed successfully!');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Error placing order:', err);
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
            <h1 className="text-2xl font-bold text-black">New Order</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'customer' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
            <div className="w-16 h-1 bg-gray-200"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'items' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
            <div className="w-16 h-1 bg-gray-200"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preview' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
          </div>
        </div>

        {/* Step 1: Customer Information */}
        {step === 'customer' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-black mb-4">Customer Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Name</label>
                <input
                  type="text"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Phone</label>
                <input
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  maxLength={10}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Address</label>
                <textarea
                  value={customerData.address}
                  onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  rows={3}
                  required
                />
              </div>
              <button
                onClick={handleCustomerSubmit}
                disabled={loading || !customerData.name || !customerData.phone || !customerData.address}
                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Order Items */}
        {step === 'items' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-black mb-4">Order Items</h2>
            <div className="space-y-4 mb-4">
              {orderItems.map((item, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <select
                    value={item.feedProductId}
                    onChange={(e) => updateOrderItem(index, 'feedProductId', e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-black"
                  >
                    <option value="">Select Product</option>
                    {feeds.map((feed) => (
                      <option key={feed.id} value={feed.id}>
                        {feed.name} - ₹{feed.pricePerUnit}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateOrderItem(index, 'quantity', Number(e.target.value))}
                    min="1"
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg text-black"
                  />
                  <button
                    onClick={() => removeOrderItem(index)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addOrderItem}
              className="mb-6 px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300"
            >
              + Add Item
            </button>

            <div className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                >
                  <option value="CASH">Cash</option>
                  <option value="CREDIT">Credit</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Discount Type</label>
                <select
                  value={discountType || ''}
                  onChange={(e) => setDiscountType(e.target.value as any || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                >
                  <option value="">No Discount</option>
                  <option value="FLAT">Flat Amount</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </div>
              {discountType && (
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Discount Value</label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Delivery Date (Optional)</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black"
                />
              </div>
              <button
                onClick={handlePreviewOrder}
                disabled={loading || orderItems.length === 0 || orderItems.some(i => !i.feedProductId)}
                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Processing...' : 'Preview Order'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Confirm */}
        {step === 'preview' && orderPreview && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-black mb-4">Order Preview</h2>
            <div className="space-y-4">
              {orderPreview.items.map((item, index) => (
                <div key={index} className="flex justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-black">{item.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity} × ₹{item.pricePerUnit}</p>
                  </div>
                  <p className="font-bold text-black">₹{item.subtotal}</p>
                </div>
              ))}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-black">
                  <span>Subtotal:</span>
                  <span>₹{orderPreview.totalAmount}</span>
                </div>
                {orderPreview.discountType && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({orderPreview.discountType}):</span>
                    <span>-₹{orderPreview.totalAmount - orderPreview.finalAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-black">
                  <span>Total:</span>
                  <span>₹{orderPreview.finalAmount}</span>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setStep('items')}
                  className="flex-1 bg-gray-200 text-black py-3 rounded-lg hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
                >
                  {loading ? 'Placing Order...' : 'Confirm Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}