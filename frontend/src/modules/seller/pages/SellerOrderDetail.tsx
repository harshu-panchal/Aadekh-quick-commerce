import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  getOrderById,
  updateOrderStatus,
  OrderDetail,
} from "../../../services/api/orderService";
import jsPDF from "jspdf";

export default function SellerOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [orderStatus, setOrderStatus] = useState<string>("Out For Delivery");

  // Fetch order detail from API
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) return;

      setLoading(true);
      setError("");
      try {
        const response = await getOrderById(id);
        if (response.success && response.data) {
          setOrderDetail(response.data);
          setOrderStatus(response.data.status);
        } else {
          setError(response.message || "Failed to fetch order details");
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
          err.message ||
          "Failed to fetch order details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!orderDetail) return;

    try {
      const response = await updateOrderStatus(orderDetail.id, {
        status: newStatus as any,
      });
      if (response.success) {
        setOrderStatus(newStatus);
        setOrderDetail({ ...orderDetail, status: newStatus as any });
      } else {
        alert("Failed to update order status");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update order status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-neutral-500">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/seller/orders")}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition-colors">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">
            Order Not Found
          </h2>
          <button
            onClick={() => navigate("/seller/orders")}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition-colors">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    const day = date.getDate();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    let suffix = "th";
    if (day === 1 || day === 21 || day === 31) suffix = "st";
    else if (day === 2 || day === 22) suffix = "nd";
    else if (day === 3 || day === 23) suffix = "rd";
    return `${day}${suffix} ${month}, ${year}`;
  };

  const handleExportPDF = () => {
    if (!orderDetail) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredHeight: number) => {
      if (yPos + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Header - Company Info
    doc.setFillColor(22, 163, 74); // Green color
    doc.rect(margin, yPos, contentWidth, 15, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Grihinee - 10 Minute App", margin + 5, yPos + 10);

    yPos += 20;

    // Company Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Grihinee - 10 Minute App", margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("From: Grihinee - 10 Minute App", margin, yPos);
    yPos += 6;
    doc.text("Phone: 8956656429", margin, yPos);
    yPos += 6;
    doc.text("Email: info@grihinee.com", margin, yPos);
    yPos += 6;
    doc.text("Website: https://grihinee.com", margin, yPos);
    yPos += 12;

    // Invoice Details (Right aligned)
    const rightX = pageWidth - margin;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${formatDate(orderDetail.orderDate)}`, rightX, yPos - 30, {
      align: "right",
    });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Invoice #${orderDetail.invoiceNumber}`, rightX, yPos - 20, {
      align: "right",
    });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Order ID: ${orderDetail.id}`, rightX, yPos - 14, {
      align: "right",
    });
    doc.text(
      `Delivery Date: ${formatDate(orderDetail.deliveryDate)}`,
      rightX,
      yPos - 8,
      { align: "right" }
    );
    doc.text(`Time Slot: ${orderDetail.timeSlot}`, rightX, yPos - 2, {
      align: "right",
    });

    // Status badge
    const statusWidth = doc.getTextWidth(orderStatus) + 8;
    doc.setFillColor(59, 130, 246); // Blue for status
    doc.roundedRect(rightX - statusWidth, yPos + 2, statusWidth, 6, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(orderStatus, rightX - statusWidth / 2, yPos + 5.5, {
      align: "center",
    });

    yPos += 15;
    doc.setTextColor(0, 0, 0);

    // Draw a line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Table Header
    checkPageBreak(20);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, contentWidth, 10, "F");

    const colWidths = [
      contentWidth * 0.08, // Sr. No.
      contentWidth * 0.4, // Product
      contentWidth * 0.15, // Price
      contentWidth * 0.15, // Tax
      contentWidth * 0.1, // Qty
      contentWidth * 0.12, // Subtotal
    ];

    let xPos = margin;
    const headers = [
      "Sr. No.",
      "Product",
      "Price",
      "Tax ₹ (%)",
      "Qty",
      "Subtotal",
    ];

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);

    headers.forEach((header, index) => {
      doc.text(header, xPos + 2, yPos + 7);
      xPos += colWidths[index];
    });

    yPos += 12;

    // Table Rows
    orderDetail.items.forEach((item) => {
      checkPageBreak(15);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      xPos = margin;
      const rowData = [
        item.srNo.toString(),
        item.product,
        `₹${item.price.toFixed(2)}`,
        `${item.tax.toFixed(2)} (${item.taxPercent.toFixed(2)}%)`,
        item.qty.toString(),
        `₹${item.subtotal.toFixed(2)}`,
      ];

      rowData.forEach((data, index) => {
        // Truncate long text
        const maxWidth = colWidths[index] - 4;
        let text = data;
        if (doc.getTextWidth(text) > maxWidth && index === 1) {
          // Truncate product name if too long
          while (doc.getTextWidth(text + "...") > maxWidth && text.length > 0) {
            text = text.slice(0, -1);
          }
          text += "...";
        }
        doc.text(text, xPos + 2, yPos + 5);
        xPos += colWidths[index];
      });

      // Draw row separator
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8);

      yPos += 10;
    });

    // Calculate totals
    const totalSubtotal = orderDetail.items.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    const totalTax = orderDetail.items.reduce((sum, item) => sum + item.tax, 0);
    const grandTotal = totalSubtotal + totalTax;

    yPos += 5;
    checkPageBreak(30);

    // Totals Section
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", pageWidth - margin - 60, yPos, { align: "right" });
    doc.text(`₹${totalSubtotal.toFixed(2)}`, pageWidth - margin, yPos, {
      align: "right",
    });
    yPos += 7;

    doc.text("Tax:", pageWidth - margin - 60, yPos, { align: "right" });
    doc.text(`₹${totalTax.toFixed(2)}`, pageWidth - margin, yPos, {
      align: "right",
    });
    yPos += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Grand Total:", pageWidth - margin - 60, yPos, { align: "right" });
    doc.text(`₹${grandTotal.toFixed(2)}`, pageWidth - margin, yPos, {
      align: "right",
    });
    yPos += 15;

    // Footer
    checkPageBreak(20);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Bill Generated by Grihinee - 10 Minute App", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 8;

    doc.setFontSize(8);
    doc.text(
      "Copyright © 2025. Developed By Grihinee - 10 Minute App",
      pageWidth / 2,
      yPos,
      { align: "center" }
    );

    // Save the PDF
    const fileName = `Invoice_${orderDetail.invoiceNumber}_${orderDetail.id}.pdf`;
    doc.save(fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-teal-50 text-teal-600 border border-teal-200";
      case "On the way":
        return "bg-teal-100 text-teal-800 border border-teal-300";
      case "Delivered":
        return "bg-teal-50 text-teal-700 border border-teal-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border border-red-400";
      case "Out For Delivery":
        return "bg-teal-600 text-white border border-teal-700";
      case "Received":
        return "bg-teal-50 text-teal-600 border border-teal-100";
      case "Payment Pending":
        return "bg-orange-50 text-orange-600 border border-orange-200";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  const formatUnit = (unit: string, qty: number) => {
    if (!unit || unit === "N/A") return "N/A";

    // improved regex to handle decimals and various spacing
    const match = unit.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
    if (match) {
      const val = parseFloat(match[1]);
      const u = match[2];
      // check if val is a valid number
      if (!isNaN(val)) {
        const total = val * qty;
        // Format to remove trailing zeros if integer (e.g. 1.0 -> 1)
        return `${parseFloat(total.toFixed(2))}${u}`;
      }
    }
    return `${unit} x ${qty}`;
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-8">
      {/* Order Action Section */}
      <div className="bg-white mb-6 rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
          <h2 className="text-base sm:text-lg font-semibold">
            Order Action Section
          </h2>
        </div>
        <div className="bg-neutral-50 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              {orderStatus === "Received" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate("Accepted")}
                    className="flex-1 bg-teal-600 hover:bg-neutral-900 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm">
                    Accept Order
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to reject this order? This cannot be undone."
                        )
                      ) {
                        handleStatusUpdate("Rejected");
                      }
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm">
                    Reject Order
                  </button>
                </div>
              ) : (
                <select
                  value={orderStatus}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  disabled={
                    orderStatus === "Rejected" ||
                    orderStatus === "Cancelled" ||
                    orderStatus === "Delivered"
                  }>
                  <option value="Accepted">Accepted</option>
                  <option value="On the way">On the way</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  {orderStatus === "Rejected" && (
                    <option value="Rejected">Rejected</option>
                  )}
                </select>
              )}
            </div>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-teal-600 hover:bg-neutral-900 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Export Invoice PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-teal-600 hover:bg-neutral-900 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print Invoice
            </button>
          </div>
        </div>
      </div>

      {/* View Order Details Section */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="bg-teal-600 text-white px-4 sm:px-6 py-3">
          <h2 className="text-base sm:text-lg font-semibold">
            View Order Details
          </h2>
        </div>
        <div className="bg-white px-4 sm:px-6 py-4 sm:py-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
            {/* Left: Company Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-100">
                  <span className="text-white text-base font-black">G</span>
                </div>
                <div>
                  <div className="text-sm text-teal-600 font-bold tracking-wider">
                    Grihinee
                  </div>
                  <div className="text-[10px] text-neutral-400 font-medium">
                    10 Minute Delivery Service
                  </div>
                </div>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 leading-tight">
                  Grihinee - 10 Minute App
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1">Providing fresh groceries in minutes.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                  <p className="text-[10px] text-neutral-400 font-bold tracking-tighter">Phone</p>
                  <p className="text-sm text-neutral-800 font-semibold">8956656429</p>
                </div>
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                  <p className="text-[10px] text-neutral-400 font-bold tracking-tighter">Email</p>
                  <p className="text-sm text-neutral-800 font-semibold truncate">info@grihinee.com</p>
                </div>
              </div>
            </div>

            {/* Right: Invoice Details */}
            <div className="flex-1 md:text-right flex flex-col justify-between">
              <div className="space-y-1 mb-4">
                <span className="inline-block px-3 py-1 bg-teal-50 text-teal-600 text-[10px] font-black tracking-widest rounded-full border border-teal-100 mb-2">
                  Invoice Summary
                </span>
                <h2 className="text-lg font-black text-neutral-900">#{orderDetail.invoiceNumber}</h2>
                <p className="text-xs text-neutral-500">Order ID: <span className="text-neutral-900 font-bold">{orderDetail.id}</span></p>
              </div>

              <div className="space-y-2 lg:space-y-4">
                <div className="flex flex-col md:items-end">
                  <span className="text-[10px] text-neutral-400 font-bold tracking-tighter">Ordered On</span>
                  <span className="text-sm text-neutral-800 font-bold">{formatDate(orderDetail.orderDate)}</span>
                </div>
                <div className="flex flex-col md:items-end">
                  <span className="text-[10px] text-neutral-400 font-bold tracking-tighter">Delivery Slot</span>
                  <div className="flex items-center gap-1.5 md:justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    <span className="text-sm text-neutral-800 font-bold">{orderDetail.timeSlot}</span>
                  </div>
                </div>
                <div className="flex flex-col md:items-end">
                  <span className="text-[10px] text-neutral-400 font-bold tracking-tighter">Status</span>
                  <span className={`mt-1 inline-flex items-center px-4 py-1 rounded-full text-[10px] font-black tracking-widest ${getStatusBadgeClass(orderStatus)}`}>
                    {orderStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Table & Cards */}
          <div className="mb-8">
            <h3 className="text-sm font-black text-neutral-900 tracking-widest mb-4 border-l-4 border-teal-600 pl-3">Order Items</h3>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-4 text-left text-[10px] font-black text-neutral-500 tracking-widest">Sr.</th>
                    <th className="px-4 py-4 text-left text-[10px] font-black text-neutral-500 tracking-widest">Product</th>
                    <th className="px-4 py-4 text-left text-[10px] font-black text-neutral-500 tracking-widest">Unit</th>
                    <th className="px-4 py-4 text-left text-[10px] font-black text-neutral-500 tracking-widest">Price</th>
                    <th className="px-4 py-4 text-left text-[10px] font-black text-neutral-500 tracking-widest">Qty</th>
                    <th className="px-4 py-4 text-right text-[10px] font-black text-neutral-500 tracking-widest">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-100">
                  {orderDetail.items.map((item) => (
                    <tr key={item.srNo} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-4 text-sm text-neutral-500">{item.srNo}</td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-neutral-800">{item.product}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600">{formatUnit(item.unit, item.qty)}</td>
                      <td className="px-4 py-4 text-sm text-neutral-600">₹{item.price.toFixed(2)}</td>
                      <td className="px-4 py-4 text-sm text-neutral-900 font-bold">{item.qty}</td>
                      <td className="px-4 py-4 text-sm text-neutral-900 font-bold text-right">₹{item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-neutral-50">
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-right text-sm font-bold text-neutral-500">Total Amount</td>
                    <td className="px-4 py-4 text-right text-lg font-black text-teal-600">₹{orderDetail.items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {orderDetail.items.map((item) => (
                <div key={item.srNo} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <span className="w-6 h-6 rounded bg-neutral-100 text-neutral-500 flex items-center justify-center text-[10px] font-bold">
                      {item.srNo}
                    </span>
                    <span className="text-lg font-black text-neutral-900">₹{item.subtotal.toFixed(2)}</span>
                  </div>
                  <h4 className="font-black text-neutral-800 text-sm mb-1">{item.product}</h4>
                  <div className="flex items-center gap-4 text-xs text-neutral-500 font-bold tracking-tighter">
                    <span>{formatUnit(item.unit, item.qty)}</span>
                    <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                    <span>₹{item.price.toFixed(2)} x {item.qty}</span>
                  </div>
                </div>
              ))}

              <div className="bg-teal-600 p-4 rounded-xl shadow-lg shadow-teal-100 mt-6 flex justify-between items-center text-white">
                <span className="text-sm font-black tracking-widest">Total Payable</span>
                <span className="text-xl font-black">₹{orderDetail.items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Bill Generation Note */}
          <div className="border-t border-dashed border-neutral-200 pt-6">
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-neutral-400 font-bold tracking-widest">
                Official Bill Receipt
              </p>
              <p className="text-xs text-neutral-500 text-center font-medium">
                Generated by <span className="text-teal-600 font-bold underline">Grihinee - 10 Minute App</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 px-4 sm:px-6 text-center py-4 bg-neutral-100 rounded-lg">
        <p className="text-xs sm:text-sm text-neutral-600">
          Copyright © 2025. Developed By{" "}
          <span className="font-semibold text-teal-600">
            Grihinee - 10 Minute App
          </span>
        </p>
      </footer>
    </div>
  );
}
