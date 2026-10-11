import React, { useState, useEffect , useRef } from "react";
import { useNavigate } from "react-router-dom";
import { rtdb } from "./firebaseConfig";
import { ref, onValue, update, remove, push, set ,getDatabase } from "firebase/database";

import "./Admin.css";

const categories = ["Veg", "Non-Veg", "Desserts", "Ice Cream", "Drinks", "Starters"];

const AdminPanel = () => {
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [rejectedOrders, setRejectedOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);

  const prevPendingCount = useRef(0);
  const notificationSound = useRef(new Audio('/notification.mp3'));

  useEffect(() => {
    const menuRef = ref(rtdb, "menu");
    const ordersRef = ref(rtdb, "orders");
    const couponsRef = ref(rtdb, "coupons");

    onValue(menuRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMenu(Object.entries(data).map(([key, value]) => ({ id: key, ...value })));
      }
    });

    onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orders = Object.entries(data).map(([key, value]) => ({ id: key, ...value }));

        const pending = orders.filter(order => order.status === "Pending");

        if (pending.length > prevPendingCount.current) {
          notificationSound.current.play().catch(err => console.warn("Audio play blocked:", err));
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
        }

        prevPendingCount.current = pending.length;

        setPendingOrders(pending);
        setApprovedOrders(orders.filter(order => order.status === "Approved"));
        setRejectedOrders(orders.filter(order => order.status === "Rejected"));
      }
    });

    onValue(couponsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCoupons(Object.entries(data).map(([key, value]) => ({ id: key, ...value })));
      }
    });
  }, []);

  // Update Order Status + Update Table Status
const handleOrderUpdate = async (status, orderId, tableKey) => {
  const db = getDatabase();
  const orderRef = ref(db, `orders/${orderId}`);
  const tableRef = ref(db, `tables/${tableKey}`);

  try {
    await update(orderRef, { status });

    if (tableKey) {
      let newTableStatus = "";

      if (status === "Approved" || status === "Pending") {
        newTableStatus = "Occupied";
      } else if (status === "Completed" || status === "Rejected") {
        newTableStatus = "Open";
      }

      if (newTableStatus) {
        await update(tableRef, { status: newTableStatus });
      }
    }

    alert(`Order ${status} Successfully`);
  } catch (error) {
    console.error("Error updating order:", error);
    alert("Failed to update order");
  }
};

  
  // Delete Menu Item
  const handleDeleteItem = async (itemId) => {
    await remove(ref(rtdb, `menu/${itemId}`));
    alert("❌ Item deleted successfully!");
  };
  
 

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>

      <div className="category-section">
        <h3>Manage Categories</h3>
        <div className="category-buttons">
          {categories.map((category) => (
            <button key={category} onClick={() => navigate(`/admin/category/${category}`)}>
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="pending-orders-section">
  <h3>Pending Orders</h3>
  {pendingOrders.length === 0 ? (
    <p>No pending orders</p>
  ) : (
    pendingOrders.map((order) => {
      const subtotal = parseFloat(order.subtotal) || 0;
      const discount = parseFloat(order.discount) || 0;
      const finalAmount = Math.max(0, subtotal - discount); // ✅ Corrected calculation

      return (
        <div key={order.id} className="order-card">
          <p><strong>Name:</strong> {order.user?.name || "N/A"}</p>
          <p><strong>Email:</strong> {order.user?.email || "N/A"}</p>
          <p><strong>Phone:</strong> {order.user?.phone || "N/A"}</p>
          <p><strong>Table:</strong> {order.table}</p>
          <p><strong>Coupon Code:</strong> {order.couponCode || "None"}</p>
          <p><strong>Items:</strong> {order.items.map(item => `${item.name} (${item.quantity})`).join(", ")}</p>


          {/* ✅ Corrected Total Amount Display */}
          <p><strong>Subtotal:</strong> ₹{subtotal.toFixed(2)}</p>
          <p><strong>Discount:</strong> -₹{discount.toFixed(2)}</p>
          <p><strong>Final Amount:</strong> ₹{finalAmount.toFixed(2)}</p>
          <button onClick={() => handleOrderUpdate("Approved", order.id, order.tableKey)}>Approve</button>
          <button onClick={() => handleOrderUpdate("Rejected", order.id, order.tableKey)}>Reject</button>


        </div>
      );
    })
  )}
</div>

  {/* Coupon Management */}
    <div className="coupon-data-section">
       <h3>View  Coupons</h3>
        <button className="users-btn" onClick={() => navigate("/admin/coupon")}>View coupons</button>
      </div>
      <ul></ul>

      <div className="order-history-section">
        <h3>View Order History</h3>
        <button className="history-btn" onClick={() => navigate("/admin/order-history")}>📜 View Order History</button>
      </div>

       {/* ✅ New "View Users" Section */}
      <div className="user-data-section">
       <h3>View Users</h3>
        <button className="users-btn" onClick={() => navigate("/admin/users")}>👥 View Users</button>
      </div>
      <ul></ul>

      {/* ✅ New "Qrcode " Section */}
      <div className="qrcode-data-section">
       <h3>Table Qr code</h3>
        <button className="users-btn" onClick={() => navigate("/admin/qrcode")}>Table Qr code</button>
      </div>
      <ul></ul>
     
      {/* ✅ New "Coupons History" Section */}
      <div className="coupons-history-section">
                <h3>Coupons History</h3>
                <button className="history-btn" onClick={() => navigate("/admin/coupons-history")}>
                    View Coupons History
                </button>
            </div>
            <ul></ul>
             
            {/* ✅ New "Table Management" Section */}
            <div className="table-management-section">
                <h3>Table Management</h3>
                <button className="table-btn" onClick={() => navigate("/admin/table-management")}>
                    Manage Tables
                </button>
            </div>


      <div className="admin-buttons">
        <button className="logout-btn" onClick={() => navigate("/")}>Logout</button>
      </div>
    </div>
  );
};

export default AdminPanel;
