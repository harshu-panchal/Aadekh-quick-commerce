import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrders, Order, GetOrdersParams } from '../../../services/api/orderService';


type SortField = 'orderId' | 'deliveryDate' | 'orderDate' | 'status' | 'amount';
type SortDirection = 'asc' | 'desc';

export default function SellerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dateRange, setDateRange] = useState('');
  const [status, setStatus] = useState('All Status');
  const [entriesPerPage, setEntriesPerPage] = useState('10');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const params: GetOrdersParams = {
          page: currentPage,
          limit: parseInt(entriesPerPage),
          sortBy: sortField || 'orderDate',
          sortOrder: sortDirection,
        };

        // Parse date range
        if (dateRange) {
          const [startDate, endDate] = dateRange.split(' - ');
          if (startDate && endDate) {
            params.dateFrom = startDate;
            params.dateTo = endDate;
          }
        }

        // Add status filter
        if (status !== 'All Status') {
          params.status = status;
        }

        // Add search
        if (searchQuery) {
          params.search = searchQuery;
        }

        const response = await getOrders(params);
        if (response.success && response.data) {
          setOrders(response.data);
        } else {
          setError(response.message || 'Failed to fetch orders');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [dateRange, status, entriesPerPage, searchQuery, currentPage, sortField, sortDirection]);

  const handleClearDate = () => {
    setDateRange('');
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Order ID', 'Delivery Date', 'Order Date', 'Status', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...orders.map(order =>
        [order.orderId, order.deliveryDate, order.orderDate, order.status, order.amount].join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination (client-side for now, can be moved to backend later)
  const entriesPerPageNum = parseInt(entriesPerPage);
  const totalPages = Math.ceil(orders.length / entriesPerPageNum);
  const startIndex = (currentPage - 1) * entriesPerPageNum;
  const endIndex = startIndex + entriesPerPageNum;
  const paginatedOrders = orders.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Accepted':
        return 'bg-teal-50 text-teal-600';
      case 'On the way':
        return 'bg-teal-600 text-white';
      case 'Delivered':
        return 'bg-teal-100 text-teal-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 -mx-3 sm:-mx-4 md:-mx-6 -mt-3 sm:-mt-4 md:-mt-6">
      {/* Header Section */}
      <div className="bg-white border-b border-neutral-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          {/* Page Title */}
          <h1 className="text-xl font-bold text-gray-800">Orders List</h1>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Link to="/seller" className="text-teal-600 hover:text-teal-700">
              Home
            </Link>
            <span className="text-neutral-500">/</span>
            <span className="text-neutral-700">Orders List</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-4 md:px-6">
        {/* White Card Container */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {/* Green Banner */}
          <div className="bg-teal-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-t-lg">
            <h2 className="text-base sm:text-lg font-semibold">View Order List</h2>
          </div>

          {/* Filter and Action Bar */}
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-neutral-200">
            <div className="flex flex-col gap-4">
              {/* Row 1: Search & Export */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Search Order ID..."
                  />
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex-shrink-0"
                  aria-label="Export CSV"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                </button>
              </div>

              {/* Row 2: Filters (Horizontal scroll on mobile if needed, or wrap) */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[120px]">
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs sm:text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option>All Status</option>
                    <option>Pending</option>
                    <option>Accepted</option>
                    <option>On the way</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
                  </select>
                </div>

                <div className="flex-1 min-w-[150px]">
                  <div className="relative">
                    <input
                      type="text"
                      value={dateRange}
                      onChange={(e) => {
                        setDateRange(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs sm:text-sm text-neutral-600 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Date Range"
                    />
                    {dateRange && (
                      <button
                        onClick={handleClearDate}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-20">
                  <select
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-2 py-2 border border-neutral-300 rounded-lg text-xs sm:text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                    <option>100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="text-neutral-500">Loading orders...</div>
            </div>
          )}
          {error && !loading && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg m-4">
              {error}
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-neutral-700 tracking-wider">
                        <button
                          onClick={() => handleSort('orderId')}
                          className="flex items-center gap-2 hover:text-neutral-900 transition-colors"
                        >
                          O. Id
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`cursor-pointer ${sortField === 'orderId' ? 'text-green-600' : 'text-neutral-400'
                              }`}
                          >
                            <path
                              d={sortField === 'orderId' && sortDirection === 'asc'
                                ? "M7 14L12 9L17 14"
                                : sortField === 'orderId' && sortDirection === 'desc'
                                  ? "M7 10L12 15L17 10"
                                  : "M7 10L12 5L17 10M7 14L12 19L17 14"}
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-neutral-700 tracking-wider">
                        <button
                          onClick={() => handleSort('deliveryDate')}
                          className="flex items-center gap-2 hover:text-neutral-900 transition-colors"
                        >
                          D. Date
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`cursor-pointer ${sortField === 'deliveryDate' ? 'text-green-600' : 'text-neutral-400'
                              }`}
                          >
                            <path
                              d={sortField === 'deliveryDate' && sortDirection === 'asc'
                                ? "M7 14L12 9L17 14"
                                : sortField === 'deliveryDate' && sortDirection === 'desc'
                                  ? "M7 10L12 15L17 10"
                                  : "M7 10L12 5L17 10M7 14L12 19L17 14"}
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-neutral-700 tracking-wider">
                        <button
                          onClick={() => handleSort('orderDate')}
                          className="flex items-center gap-2 hover:text-neutral-900 transition-colors"
                        >
                          O. Date
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`cursor-pointer ${sortField === 'orderDate' ? 'text-green-600' : 'text-neutral-400'
                              }`}
                          >
                            <path
                              d={sortField === 'orderDate' && sortDirection === 'asc'
                                ? "M7 14L12 9L17 14"
                                : sortField === 'orderDate' && sortDirection === 'desc'
                                  ? "M7 10L12 15L17 10"
                                  : "M7 10L12 5L17 10M7 14L12 19L17 14"}
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-neutral-700 tracking-wider">
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center gap-2 hover:text-neutral-900 transition-colors"
                        >
                          Status
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`cursor-pointer ${sortField === 'status' ? 'text-green-600' : 'text-neutral-400'
                              }`}
                          >
                            <path
                              d={sortField === 'status' && sortDirection === 'asc'
                                ? "M7 14L12 9L17 14"
                                : sortField === 'status' && sortDirection === 'desc'
                                  ? "M7 10L12 15L17 10"
                                  : "M7 10L12 5L17 10M7 14L12 19L17 14"}
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-neutral-700 tracking-wider">
                        <button
                          onClick={() => handleSort('amount')}
                          className="flex items-center gap-2 hover:text-neutral-900 transition-colors"
                        >
                          Amount
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`cursor-pointer ${sortField === 'amount' ? 'text-green-600' : 'text-neutral-400'
                              }`}
                          >
                            <path
                              d={sortField === 'amount' && sortDirection === 'asc'
                                ? "M7 14L12 9L17 14"
                                : sortField === 'amount' && sortDirection === 'desc'
                                  ? "M7 10L12 15L17 10"
                                  : "M7 10L12 5L17 10M7 14L12 19L17 14"}
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-neutral-700 tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {paginatedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 sm:px-4 md:px-6 py-8 sm:py-12 text-center text-xs sm:text-sm text-neutral-500">
                          No data available in table
                        </td>
                      </tr>
                    ) : (
                      paginatedOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-3 sm:px-4 md:px-6 py-3 text-xs sm:text-sm text-neutral-900">
                            {order.orderId}
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 text-xs sm:text-sm text-neutral-700">
                            {order.deliveryDate}
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 text-xs sm:text-sm text-neutral-700">
                            {order.orderDate}
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 text-xs sm:text-sm text-neutral-900 font-medium">
                            ₹{order.amount.toFixed(2)}
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3">
                            <button
                              onClick={() => navigate(`/seller/orders/${order.id}`)}
                              className="text-teal-600 hover:text-teal-700 text-xs sm:text-sm font-medium transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="sm:hidden divide-y divide-neutral-100 p-1">
                {paginatedOrders.length === 0 ? (
                  <div className="py-12 text-center text-sm text-neutral-500">
                    No data available
                  </div>
                ) : (
                  paginatedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 bg-white hover:bg-neutral-50 active:bg-neutral-100 transition-all rounded-lg mb-2 border border-neutral-100 shadow-sm"
                      onClick={() => navigate(`/seller/orders/${order.id}`)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-teal-600 text-sm">#{order.orderId}</h4>
                          <span className="text-[10px] text-neutral-400 font-medium tracking-wider">{order.orderDate}</span>
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-end mt-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-neutral-500 font-semibold">Delivery By</span>
                          <span className="text-xs font-medium text-neutral-700">{order.deliveryDate}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-neutral-900">₹{order.amount.toFixed(2)}</p>
                          <span className="text-teal-600 text-[10px] font-bold tracking-wider flex items-center justify-end gap-1">
                            View Details
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Pagination */}
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm text-neutral-700">
              Showing {orders.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, orders.length)} of {orders.length} entries
            </div>
            <div className="flex items-center gap-4 sm:gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium transition-all ${currentPage === 1
                  ? 'text-neutral-400 cursor-not-allowed bg-neutral-50'
                  : 'text-neutral-700 hover:bg-neutral-50 active:scale-95'
                  }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                <span>Prev</span>
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className={`flex items-center gap-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium transition-all ${currentPage >= totalPages
                  ? 'text-neutral-400 cursor-not-allowed bg-neutral-50'
                  : 'text-neutral-700 hover:bg-neutral-50 active:scale-95'
                  }`}
              >
                <span>Next</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-3 sm:px-4 md:px-6 text-center py-4 sm:py-6">
        <p className="text-xs sm:text-sm text-neutral-600">
          Copyright © 2025. Developed By{' '}
          <Link to="/seller" className="text-teal-600 hover:text-teal-700">
            Grihinee
          </Link>
        </p>
      </footer>
    </div>
  );
}

