import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProducts,
  deleteProduct,
  Product,
  ProductVariation,
} from "../../../services/api/productService";
import {
  getCategories,
  Category as apiCategory,
} from "../../../services/api/categoryService";
import { useAuth } from "../../../context/AuthContext";

// ... (interfaces remain same)

export default function SellerProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Category");
  const [statusFilter, setStatusFilter] = useState("All Products");
  const [stockFilter, setStockFilter] = useState("All Products");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set()
  );
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [totalPages, setTotalPages] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);
  const [allCategories, setAllCategories] = useState<apiCategory[]>([]);
  const { user } = useAuth();

  // Fetch categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const response = await getCategories();
        if (response.success && response.data) {
          setAllCategories(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCats();
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const params: any = {
        page: currentPage,
        limit: rowsPerPage,
        sortBy: sortColumn || "createdAt",
        sortOrder: sortDirection,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }
      if (categoryFilter !== "All Category") {
        params.category = categoryFilter;
      }
      if (statusFilter === "Published") {
        params.status = "published";
      } else if (statusFilter === "Unpublished") {
        params.status = "unpublished";
      }
      if (stockFilter === "In Stock") {
        params.stock = "inStock";
      } else if (stockFilter === "Out of Stock") {
        params.stock = "outOfStock";
      }

      const response = await getProducts(params);
      if (response.success && response.data) {
        setProducts(response.data);
        // Extract pagination info if available
        if (response.pagination) {
          setTotalPages(response.pagination.pages);
          setPaginationInfo(response.pagination);
        } else {
          // Fallback: calculate pages from data length if pagination not available
          setTotalPages(Math.ceil(response.data.length / rowsPerPage));
          setPaginationInfo(null);
        }
      } else {
        setError(response.message || "Failed to fetch products");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [
    currentPage,
    rowsPerPage,
    searchTerm,
    categoryFilter,
    statusFilter,
    stockFilter,
    sortColumn,
    sortDirection,
  ]);

  const handleDelete = async (productId: string) => {
    try {
      const response = await deleteProduct(productId);
      if (
        response.success ||
        response.message === "Product deleted successfully"
      ) {
        fetchProducts();
      } else {
        console.error("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleEdit = (productId: string) => {
    navigate(`/seller/product/edit/${productId}`);
  };

  // ... (rest of logic: flatten, filter, sort)

  // Flatten products with variations for display
  // Handle products with no variations by creating a default variation entry
  const allVariations = products.flatMap((product) => {
    // If product has no variations, create a default one
    if (!product.variations || product.variations.length === 0) {
      return [{
        variationId: `${product._id}-default`,
        productName: product.productName,
        sellerName: user?.storeName || "",
        productImage:
          product.mainImage ||
          product.mainImageUrl ||
          "/assets/product-placeholder.jpg",
        brandName: (product.brand as any)?.name || "-",
        category: (product.category as any)?.name || "-",
        subCategory: (product.subcategory as any)?.name || "-",
        price: (product as any).price || 0,
        discPrice: (product as any).discPrice || 0,
        variation: "Default",
        isPopular: product.popular,
        productId: product._id,
      }];
    }
    // If product has variations, map them
    return product.variations.map((variation, index) => ({
      variationId: variation._id || `${product._id}-${index}`,
      productName: product.productName,
      sellerName: user?.storeName || "",
      productImage:
        product.mainImage ||
        product.mainImageUrl ||
        "/assets/product-placeholder.jpg",
      brandName: (product.brand as any)?.name || "-",
      category: (product.category as any)?.name || "-",
      subCategory: (product.subcategory as any)?.name || "-",
      price: variation.price,
      discPrice: variation.discPrice,
      variation:
        variation.title || variation.value || variation.name || "Default",
      isPopular: product.popular,
      productId: product._id,
    }));
  });

  // Filter variations
  let filteredVariations = allVariations.filter((variation) => {
    const matchesSearch =
      variation.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variation.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variation.brandName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "All Category" ||
      variation.category === categoryFilter;
    const matchesStatus = statusFilter === "All Products";
    const matchesStock = stockFilter === "All Products";
    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  });

  // Sort variations
  if (sortColumn) {
    filteredVariations.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof typeof a];
      let bVal: any = b[sortColumn as keyof typeof b];
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  // When using API pagination, don't do client-side pagination on already-paginated results
  // The API already returns the correct page of products, so we use all filtered variations
  // Only do client-side pagination if we don't have server-side pagination info
  const useServerPagination = totalPages > 1 && paginationInfo !== null;
  const displayTotalPages = useServerPagination
    ? totalPages
    : Math.ceil(filteredVariations.length / rowsPerPage);

  // Calculate start and end indices for display
  const startIndex = useServerPagination
    ? (paginationInfo!.page - 1) * paginationInfo!.limit
    : (currentPage - 1) * rowsPerPage;
  const endIndex = useServerPagination
    ? Math.min(startIndex + paginationInfo!.limit, paginationInfo!.total)
    : Math.min(currentPage * rowsPerPage, filteredVariations.length);

  // Only slice if NOT using server pagination (i.e., all data is loaded)
  const displayedVariations = useServerPagination
    ? filteredVariations
    : filteredVariations.slice(startIndex, endIndex);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const toggleProduct = (productId: string) => {
    setExpandedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const SortIcon = ({ column }: { column: string }) => (
    <span className="text-neutral-300 text-[10px]">
      {sortColumn === column ? (sortDirection === "asc" ? "↑" : "↓") : "⇅"}
    </span>
  );

  // Get unique categories for filter
  const categories = allCategories.map((cat) => cat.name);

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Product Inventory
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your storefront items</p>
        </div>
        <button
          onClick={() => navigate("/seller/product/add")}
          className="bg-teal-600 hover:bg-teal-700 text-white p-2.5 sm:px-4 sm:py-2 rounded-xl transition-all shadow-lg shadow-teal-100 flex items-center gap-2 active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          <span className="hidden sm:inline text-sm font-black tracking-widest">Add Product</span>
        </button>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 flex-1 flex flex-col">
        <div className="p-4 border-b border-neutral-100 font-medium text-neutral-700">
          View Product List
        </div>

        {/* Filters and Controls */}
        <div className="p-4 border-b border-neutral-100">
          <div className="flex flex-col gap-4">
            {/* Search & Export Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </span>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 bg-neutral-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                />
              </div>
              <button
                onClick={() => {
                  const headers = [
                    "Product Id",
                    "Variation Id",
                    "Product Name",
                    "Seller Name",
                    "Brand Name",
                    "Category",
                    "Price",
                    "Disc Price",
                    "Variation",
                  ];
                  const csvContent = [
                    headers.join(","),
                    ...filteredVariations.map((v) =>
                      [
                        v.productId,
                        v.variationId,
                        `"${v.productName}"`,
                        `"${v.sellerName}"`,
                        `"${v.brandName}"`,
                        `"${v.category}"`,
                        v.price,
                        v.discPrice,
                        `"${v.variation}"`,
                      ].join(",")
                    ),
                  ].join("\n");
                  const blob = new Blob([csvContent], {
                    type: "text/csv;charset=utf-8;",
                  });
                  const link = document.createElement("a");
                  const url = URL.createObjectURL(blob);
                  link.setAttribute("href", url);
                  link.setAttribute(
                    "download",
                    `products_${new Date().toISOString().split("T")[0]}.csv`
                  );
                  link.style.visibility = "hidden";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white p-2.5 rounded-lg transition-colors shadow-sm active:scale-95"
                title="Export Products"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
              </button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 min-w-[120px] bg-white border border-neutral-300 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="All Category">All Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 min-w-[110px] bg-white border border-neutral-300 rounded-lg py-2 px-3 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="All Products">All Status</option>
                <option value="Published">Published</option>
                <option value="Unpublished">Unpublished</option>
              </select>

              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="w-16 bg-white border border-neutral-300 rounded-lg py-2 px-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center text-neutral-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
            Loading products...
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-8 text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700">
              Retry
            </button>
          </div>
        )}

        {/* Table & Cards */}
        {!loading && !error && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse border border-neutral-200">
                <thead>
                  <tr className="bg-neutral-50 text-xs font-bold text-neutral-800">
                    <th className="p-4 w-16 border border-neutral-200">
                      Product Id
                    </th>
                    <th
                      className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                      onClick={() => handleSort("variationId")}>
                      <div className="flex items-center justify-between">
                        Variation Id <SortIcon column="variationId" />
                      </div>
                    </th>
                    <th
                      className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                      onClick={() => handleSort("productName")}>
                      <div className="flex items-center justify-between">
                        Product Name <SortIcon column="productName" />
                      </div>
                    </th>
                    <th className="p-4 border border-neutral-200">
                      product Image
                    </th>
                    <th
                      className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                      onClick={() => handleSort("category")}>
                      <div className="flex items-center justify-between">
                        Category <SortIcon column="category" />
                      </div>
                    </th>
                    <th
                      className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                      onClick={() => handleSort("price")}>
                      <div className="flex items-center justify-between">
                        Price <SortIcon column="price" />
                      </div>
                    </th>
                    <th
                      className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                      onClick={() => handleSort("discPrice")}>
                      <div className="flex items-center justify-between">
                        Disc Price <SortIcon column="discPrice" />
                      </div>
                    </th>
                    <th className="p-4 border border-neutral-200 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedVariations.map((variation) => (
                    <tr
                      key={`${variation.productId}-${variation.variationId}`}
                      className="hover:bg-neutral-50 transition-colors text-sm text-neutral-700">
                      <td className="p-4 align-middle border border-neutral-200 text-[10px] font-mono">
                        {variation.productId}
                      </td>
                      <td className="p-4 align-middle border border-neutral-200 text-[10px] font-mono">
                        {variation.variationId}
                      </td>
                      <td className="p-4 align-middle border border-neutral-200 font-bold text-neutral-900">
                        {variation.productName}
                      </td>
                      <td className="p-4 border border-neutral-200 text-center">
                        <div className="w-12 h-12 bg-white border border-neutral-200 rounded p-1 flex items-center justify-center mx-auto shadow-sm">
                          <img
                            src={variation.productImage}
                            alt={variation.productName}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://placehold.co/60x40?text=Img";
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-4 align-middle border border-neutral-200">
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-[10px] font-bold tracking-wider">
                          {variation.category}
                        </span>
                      </td>
                      <td className="p-4 align-middle border border-neutral-200 font-bold">
                        ₹{variation.price.toFixed(2)}
                      </td>
                      <td className="p-4 align-middle border border-neutral-200">
                        {variation.discPrice > 0
                          ? `₹${variation.discPrice.toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="p-4 align-middle border border-neutral-200">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(variation.productId)}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button
                            onClick={() => handleDelete(variation.productId)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="lg:hidden p-4 space-y-4">
              {displayedVariations.length === 0 ? (
                <div className="py-12 text-center text-neutral-400">
                  No products found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayedVariations.map((variation) => (
                    <div key={`${variation.productId}-${variation.variationId}`} className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex gap-4 p-4">
                        <div className="w-20 h-20 bg-neutral-50 rounded-lg p-2 flex items-center justify-center flex-shrink-0">
                          <img
                            src={variation.productImage}
                            alt={variation.productName}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://placehold.co/80x80?text=Img";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-neutral-900 truncate">{variation.productName}</h4>
                          <p className="text-[10px] text-neutral-400 font-bold tracking-wider mt-0.5">{variation.category}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm font-black text-teal-600">₹{variation.price.toFixed(2)}</span>
                            {variation.discPrice > 0 && (
                              <span className="text-[10px] text-neutral-400 line-through">₹{variation.price.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex border-t border-neutral-100 bg-neutral-50/50">
                        <button
                          onClick={() => handleEdit(variation.productId)}
                          className="flex-1 py-2.5 flex items-center justify-center gap-2 text-teal-600 hover:bg-teal-50 transition-colors border-r border-neutral-100"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          <span className="text-xs font-black tracking-widest">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(variation.productId)}
                          className="flex-1 py-2.5 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                          <span className="text-xs font-black tracking-widest">Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination Footer */}
            <div className="px-4 sm:px-6 py-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-bold text-neutral-400 tracking-widest">
                Showing {startIndex + 1}-{endIndex} of {useServerPagination && paginationInfo ? paginationInfo.total : filteredVariations.length} items
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-neutral-200 rounded-lg disabled:opacity-30 active:scale-95 transition-all bg-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, displayTotalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-black transition-all ${currentPage === pageNum ? "bg-teal-600 text-white shadow-lg shadow-teal-100" : "bg-white text-neutral-600 border border-neutral-200"}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {displayTotalPages > 5 && <span className="text-neutral-400 font-black px-1">...</span>}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(displayTotalPages, prev + 1))}
                  disabled={currentPage === displayTotalPages}
                  className="p-2 border border-neutral-200 rounded-lg disabled:opacity-30 active:scale-95 transition-all bg-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
