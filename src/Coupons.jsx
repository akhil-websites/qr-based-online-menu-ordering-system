import React, { useState, useEffect } from "react";
import { ref, onValue, push, set, remove } from "firebase/database";
import { rtdb } from "./firebaseConfig";
import "./Coupons.css";
import { useNavigate } from "react-router-dom";


const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [expiry, setExpiry] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const navigate = useNavigate();


  useEffect(() => {
    const couponsRef = ref(rtdb, "coupons");

    // Fetch coupons in real-time
    onValue(couponsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allCoupons = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));

        setCoupons(allCoupons);
      }
    });
  }, []);

  const handleAddCoupon = async () => {
    if (!couponCode || !discount || !minAmount || !expiry) {
      alert("⚠️ Please fill in all fields!");
      return;
    }

    const createdAt = new Date().toISOString(); // Store created date
    const newCouponRef = push(ref(rtdb, "coupons"));
    const newCoupon = {
      code: couponCode,
      discount: parseFloat(discount),
      minAmount: parseFloat(minAmount),
      expiry,
      createdAt, // Save creation date
    };

    await set(newCouponRef, newCoupon);
    alert("✅ Coupon added successfully!");

    // Reset input fields
    setCouponCode("");
    setDiscount("");
    setMinAmount("");
    setExpiry("");
  };

  const handleDeleteCoupon = async (couponId) => {
    await remove(ref(rtdb, `coupons/${couponId}`));
    alert("❌ Coupon deleted successfully!");
  };

  return (
    <div className="coupon-section">
      <h3>Coupon Management</h3>

      {/* Coupon Form */}
      <div className="add-coupon-form">
        <input
          type="text"
          placeholder="Enter Coupon Code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
        />
        <input
          type="number"
          placeholder="Discount Amount"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
        />
        <input
          type="number"
          placeholder="Min Purchase Amount"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
        />
        <input
          type="datetime-local"
          placeholder="Expiry Date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
        />
        <button className="add-btn" onClick={handleAddCoupon}>
          ➕ Add Coupon
        </button>
        <button className="back-btn" onClick={() => navigate("/admin")}>Back to Admin Panel</button>

      </div>

      {/* All Coupons List */}
      <h4>All Coupons</h4>
      {coupons.length === 0 ? (
        <p>No coupons found</p>
      ) : (
        coupons.map((coupon) => (
          <div key={coupon.id} className="coupon-card">
            <p><strong>Code:</strong> {coupon.code}</p>
            <p><strong>Discount:</strong> ₹{coupon.discount}</p>
            <p><strong>Min Purchase:</strong> ₹{coupon.minAmount}</p>
            <p><strong>Created on:</strong> {new Date(coupon.createdAt).toLocaleString()}</p>
            <p>
              <strong>Expires on:</strong>{" "}
              {new Date(coupon.expiry).toLocaleString()} 
            </p>
            <button
              className="delete-btn"
              onClick={() => handleDeleteCoupon(coupon.id)}
            >
              ❌ Delete
            </button>
            
          </div>
          
        ))
      )}
    </div>
  );
};

export default Coupons;
