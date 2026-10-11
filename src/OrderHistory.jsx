import React, { useState, useEffect } from "react";
import { rtdb } from "./firebaseConfig";
import { ref, onValue } from "firebase/database";
import "./OrderHistory.css";
import { useNavigate } from "react-router-dom";


const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState({});
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const navigate = useNavigate();
  

  useEffect(() => {
    const ordersRef = ref(rtdb, "orders");
    onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const allOrders = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data,
        }));
        setOrders(allOrders);
        setFilteredOrders(allOrders);
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
    });

    const couponsRef = ref(rtdb, "coupons");
    onValue(couponsRef, (snapshot) => {
      if (snapshot.exists()) {
        setCoupons(snapshot.val());
      }
    });
  }, []);

  useEffect(() => {
    let filtered = orders;
    if (selectedDate) {
      filtered = filtered.filter((order) =>
        order.timestamp.startsWith(selectedDate)
      );
    }
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (order) =>
          order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.user?.phone?.includes(searchQuery) ||
          order.table?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredOrders(filtered);
  }, [searchQuery, selectedDate, orders]);

  const getCouponInfo = (couponCode) => {
    if (couponCode && coupons[couponCode]) {
      const coupon = coupons[couponCode];
      return `${couponCode} (₹${coupon.discount || coupon.value || 0})`;
    }
    return couponCode || "N/A";
  };

  const downloadCSV = () => {
    const csvContent = [
      [
        "Order ID",
        "User",
        "Email",
        "Phone",
        "Table",
        "Order Items",
        "Total Price",
        "Discount",
        "Coupon Used",
        "Status",
        "Date & Time",
      ],
      ...filteredOrders.map((order) => [
        order.id,
        order.user?.name || "N/A",
        order.user?.email || "N/A",
        order.user?.phone || "N/A",
        order.table.split("/").pop() || "N/A",
        order.items.map((item) => `${item.name} (x${item.quantity})`).join(", "),
        `₹${order.finalAmount || order.totalAmount}`,
        `₹${order.discount || 0}`,
        getCouponInfo(order.couponCode),
        order.status,
        new Date(order.timestamp).toLocaleString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "order_history.csv";
    link.click();
  };

  return (
    <div className="order-history-container">
      <h2>📜 Order History</h2>

      <div className="filter-section">
        <input
          type="text"
          placeholder="🔍 Search by Name, Email, Phone, Table..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-box"
        />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-filter"
        />
        <button className="download-btn" onClick={downloadCSV}>
          📥 Download CSV
        </button>
      </div>
      <button className="back-btn" onClick={() => navigate("/admin")}>Back to Admin Panel</button>

      <div className="order-table-container">
        {filteredOrders.length === 0 ? (
          <p className="no-orders">
            No orders found for the selected filters.
          </p>
        ) : (
          <table className="order-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Table</th>
                <th>Order Items</th>
                <th>Total Price</th>
                <th>Discount</th>
                <th>Coupon Used</th>
                <th>Status</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.user?.name || "N/A"}</td>
                  <td>{order.user?.email || "N/A"}</td>
                  <td>{order.user?.phone || "N/A"}</td>
                  <td>{order.table.split("/").pop() || "N/A"}</td>
                  <td>
                    {order.items
                      .map(
                        (item) => `${item.name} (x${item.quantity})`
                      )
                      .join(", ")}
                  </td>
                  <td>₹{order.finalAmount || order.totalAmount}</td>
                  <td>₹{order.discount || 0}</td>
                  <td>{getCouponInfo(order.couponCode)}</td>
                  <td>{order.status}</td>
                  <td>{new Date(order.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
