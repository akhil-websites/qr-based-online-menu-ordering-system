import React, { useEffect, useState, useContext } from "react";
import { rtdb } from "./firebaseConfig";
import { AuthContext } from "./AuthContext";
import { ref, onValue } from "firebase/database";
import "./Order.css";

const ORDER_EXPIRY_TIME = 25 * 60 * 1000; // 25 minutes

const Order = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  

  useEffect(() => {
    if (!user) return;

    const ordersRef = ref(rtdb, "orders");

    onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const allOrders = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data,
        }));

        // ✅ Filter & sort orders (recent first)
        const userOrders = allOrders
          .filter((order) => order.user?.email === user.email)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setOrders(userOrders);
      } else {
        setOrders([]);
      }
    });
  }, [user]);

  return (
    <div className="order-container">
      <h1>Your Orders</h1>

      {orders.length === 0 ? (
        <p className="empty-order">No orders found.</p>
      ) : (
        orders.map((order) => {
          const orderTime = new Date(order.timestamp).getTime();
          const currentTime = new Date().getTime();
          const timeLeft = ORDER_EXPIRY_TIME - (currentTime - orderTime);
          const isExpired = timeLeft <= 0;

          // ✅ Correct calculation for total amount
          const subtotal = order.items.reduce(
            (sum, item) => sum + item.quantity * item.price,
            0
          );

          const discount = order.discount ? parseFloat(order.discount) : 0;
          const finalAmount = subtotal - discount; // ✅ Corrected calculation
          const couponCode = order.couponCode || "None";  // ✅ New line

          console.log("Debug Order:", order); // ✅ Debugging

          return (
            <div key={order.id} className={`order-details ${order.status.toLowerCase()}`}>
              <h2>Table: {order.table.split("/").pop()}</h2>
              <h3>Status: <span className={order.status.toLowerCase()}>{order.status}</span></h3>
              <h4>Order Time: {new Date(order.timestamp).toLocaleString()}</h4>

              <table className="order-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.price.toFixed(2)}</td>
                      <td>₹{(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ✅ Correct price breakdown */}
              <h3>Subtotal: ₹{subtotal.toFixed(2)}</h3>
              <h3>Discount: -₹{discount.toFixed(2)}</h3>
              <h3>Coupon Code: {couponCode}</h3>   {/* ✅ New line */}
              <h2>Final Amount: ₹{finalAmount.toFixed(2)}</h2>

              {/* ⏳ Countdown Timer */}
              {order.status === "Pending" && !isExpired && (
                <p className="order-expiry">
                  ⏳ This order will expire in {Math.floor(timeLeft / 60000)} minutes.
                </p>
              )}

              {/* ❌ Expired Order Warning */}
              {isExpired && <p className="expired">❌ This order has expired.</p>}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Order;
