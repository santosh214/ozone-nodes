import React, { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

interface PeerNode {
  name: string;
  ip: string;
  node: string;
  online: boolean;
  peerCount: number;
}

interface PeerCountData {
  checkedAt: string;
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  totalPeers: number;
  results: PeerNode[];
}

const PeerCountInfo: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [peerData, setPeerData] = useState<PeerCountData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [sortField, setSortField] = useState<keyof PeerNode>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedNode, setSelectedNode] = useState<PeerNode | null>(null);

  // Fetch peer count data
  const fetchPeerCountData = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.get<PeerCountData>('/nodes/peer-count');
      if (response.success && response.data) {
        setPeerData(response.data);
      } else {
        setError('Failed to fetch peer count data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching peer count data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !peerData) return;

    const interval = setInterval(fetchPeerCountData, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, peerData]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchPeerCountData();
    }
  }, [isAuthenticated]);

  // Filter and sort nodes
  const filteredAndSortedNodes = React.useMemo(() => {
    if (!peerData) return [];

    let filtered = peerData.results.filter(node => {
      const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           node.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           node.node.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'online' && node.online) ||
                           (statusFilter === 'offline' && !node.online);
      
      return matchesSearch && matchesStatus;
    });

    // Sort nodes
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [peerData, searchTerm, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedNodes.length / itemsPerPage);
  const paginatedNodes = filteredAndSortedNodes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sort
  const handleSort = (field: keyof PeerNode) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status badge
  const getStatusBadge = (online: boolean) => {
    if (online) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100/80 text-green-800 border border-green-200/50">
          <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3"></circle>
          </svg>
          Online
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100/80 text-red-800 border border-red-200/50">
          <svg className="w-2 h-2 mr-1" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3"></circle>
          </svg>
          Offline
        </span>
      );
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">Peer Count Information</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Real-time peer connections across all Ozone network nodes</p>
          </div>
          <button
            onClick={fetchPeerCountData}
            disabled={loading}
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto justify-center shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>

        {/* Stats Cards */}
        {peerData && (
          <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-gray-200/50">
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Nodes</dt>
                      <dd className="text-lg sm:text-xl font-bold text-gray-900">{peerData.totalNodes}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-gray-200/50">
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Online Nodes</dt>
                      <dd className="text-lg sm:text-xl font-bold text-green-600">{peerData.onlineNodes}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-gray-200/50">
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Offline Nodes</dt>
                      <dd className="text-lg sm:text-xl font-bold text-red-600">{peerData.offlineNodes}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-gray-200/50">
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Peers</dt>
                      <dd className="text-lg sm:text-xl font-bold text-purple-600">{peerData.totalPeers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 sm:mb-6 bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-2xl shadow-xl border border-gray-200/50">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, IP, or node URL..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-xl bg-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 hover:bg-white/70 focus:bg-white/80 cursor-text placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'online' | 'offline')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 hover:bg-white/70 focus:bg-white/80 cursor-pointer appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNCA2bDQgMCAxLjQxNCAxLjQxNCAwIDAgMS40MTQgMCAwLjQxNEwtMS40MTQtMS40MTR6TTggMTBMOCAxMGwxLjQxNCAxLjQxNEwxLjQxNCAxLjQxNEwxLjQxNCAxLjQxNEwxLjQxNCAxLjQxNHpNMTIgNEwxMiA0bDEuNDE0IDEuNDE0TDEzLjQxNCAxLjQxNEwxLjQxNCAxLjQxNHpNMTQgMTBMMTQgMTBsMS40MTQgMS40MTRMMTUuNDE0IDEuNDE0TDE1LjQxNCAxLjQxNHpNMTYgNEwxNiA0bDEuNDE0IDEuNDE0TDE3LjQxNCAxLjQxNEwxNy40MTQgMS40MTR6IiBmaWxsPSIjNjY3MDhBIi8+PC9zdmc+')] bg-no-repeat bg-[length:16px_16px] bg-[right_8px_center] pr-8"
            >
              <option value="all">All Nodes</option>
              <option value="online">Online Only</option>
              <option value="offline">Offline Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200/50 p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden rounded-2xl border border-gray-200/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 hover:text-gray-900 transition-all duration-300 select-none"
                >
                  <div className="flex items-center">
                    Name
                    {sortField === 'name' && (
                      <svg className={`ml-1 h-3 w-3 sm:h-4 sm:w-4 ${sortDirection === 'asc' ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}></path>
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                  IP Address
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                  Node URL
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Peer Count
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-200/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                    <div className="flex justify-center">
                      <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <p className="mt-2 text-sm sm:text-base text-gray-500">Loading peer count data...</p>
                  </td>
                </tr>
              ) : paginatedNodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
                    {peerData ? 'No nodes found matching your criteria.' : 'No data available.'}
                  </td>
                </tr>
              ) : (
                paginatedNodes.map((node) => (
                  <tr key={node.name} className="hover:bg-gray-50/50 transition-all duration-300">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none" title={node.name}>
                        {node.name}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-xs sm:text-sm text-gray-500">{node.ip}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                      <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-xs" title={node.node}>
                        {node.node}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {getStatusBadge(node.online)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">{node.peerCount}</span>
                        {node.peerCount > 0 && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100/80 text-purple-800 border border-purple-200/50">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      <button
                        onClick={() => setSelectedNode(node)}
                        className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50/50 px-2 py-1 rounded-lg transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] cursor-pointer font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white/90 backdrop-blur-sm px-3 sm:px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200/50 gap-4 sm:gap-0">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white/50 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white/50 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredAndSortedNodes.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredAndSortedNodes.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-xl border border-gray-300 bg-white/50 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-3 py-2 border text-xs sm:text-sm font-medium transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                          currentPage === pageNum
                            ? 'z-10 bg-gradient-to-r from-blue-500 to-indigo-600 border-indigo-500 text-white shadow-lg'
                            : 'bg-white/50 border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-xl border border-gray-300 bg-white/50 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Last Updated */}
      {peerData && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Last updated: {formatDate(peerData.checkedAt)} • Auto-refresh every 30 seconds
        </div>
      )}

      {/* Node Details Modal */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-0 mx-auto p-4 sm:p-6 border w-full max-w-4xl sm:max-w-5xl shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent pr-2">Node Details: {selectedNode.name}</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-2 rounded-lg hover:bg-gray-100/50 transition-all duration-300 hover:scale-[1.1] active:scale-[0.95] cursor-pointer"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-h-[70vh] overflow-y-auto">
              <div className="bg-white/50 rounded-2xl p-4 border border-gray-200/50">
                <h4 className="font-bold text-gray-900 mb-3 text-sm sm:text-base bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">Basic Information</h4>
                <dl className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Name:</dt>
                    <dd className="text-xs sm:text-sm text-gray-900 truncate max-w-[120px]">{selectedNode.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">IP Address:</dt>
                    <dd className="text-xs sm:text-sm text-gray-900">{selectedNode.ip}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Node URL:</dt>
                    <dd className="text-xs sm:text-sm text-gray-900 truncate max-w-[120px]" title={selectedNode.node}>
                      {selectedNode.node}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Status:</dt>
                    <dd>{getStatusBadge(selectedNode.online)}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white/50 rounded-2xl p-4 border border-gray-200/50">
                <h4 className="font-bold text-gray-900 mb-3 text-sm sm:text-base bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">Peer Information</h4>
                <dl className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Peer Count:</dt>
                    <dd className="text-xs sm:text-sm text-gray-900">{selectedNode.peerCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Connection Status:</dt>
                    <dd>
                      {selectedNode.peerCount > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100/80 text-green-800 border border-green-200/50">
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100/80 text-gray-800 border border-gray-200/50">
                          No Connections
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Network Activity:</dt>
                    <dd>
                      {selectedNode.online && selectedNode.peerCount > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100/80 text-purple-800 border border-purple-200/50">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100/80 text-red-800 border border-red-200/50">
                          Inactive
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex justify-end">
              <button
                onClick={() => setSelectedNode(null)}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeerCountInfo;
