import React, { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

interface ExampleData {
  id: string;
  name: string;
  // Add other properties based on your API response
}

const ExampleApiComponent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<ExampleData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      // Example GET request with automatic token inclusion
      const response = await apiClient.get<ExampleData[]>('/your-endpoint');
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (newItem: Partial<ExampleData>) => {
    try {
      // Example POST request
      const response = await apiClient.post<ExampleData>('/your-endpoint', newItem);
      
      if (response.success && response.data) {
        setData(prev => [...prev, response.data!]);
      }
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<ExampleData>) => {
    try {
      // Example PUT request
      const response = await apiClient.put<ExampleData>(`/your-endpoint/${id}`, updates);
      
      if (response.success && response.data) {
        setData(prev => prev.map(item => 
          item.id === id ? response.data! : item
        ));
      }
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      // Example DELETE request
      await apiClient.delete(`/your-endpoint/${id}`);
      
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      throw err;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">Please login to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Example API Component</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Data Items ({data.length})</h3>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          {data.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data available</p>
          ) : (
            <div className="grid gap-4">
              {data.map(item => (
                <div key={item.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="text-sm text-gray-600">ID: {item.id}</p>
                  
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => updateItem(item.id, { name: `${item.name} (updated)` })}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={() => createItem({ name: `New Item ${Date.now()}` })}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Add New Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExampleApiComponent;
