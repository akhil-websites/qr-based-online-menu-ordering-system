import React, { useState, useEffect, useRef, useContext } from "react";
import { useCart } from "./CartContext";
import { AuthContext } from "./AuthContext";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { rtdb } from "./firebaseConfig";
import { getDatabase,ref, push, set, update, get, onValue } from "firebase/database";
import "./Cart.css";

const Cart = () => {
  const { cart, removeFromCart, clearCart } = useCart();
  const { user } = useContext(AuthContext);
  const [totalAmount, setTotalAmount] = useState(0);
  const [scannedTable, setScannedTable] = useState(null);
  const [qrMatched, setQrMatched] = useState(false);
  const [phone, setPhone] = useState(user?.phone || "");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(false);
  const [validCoupons, setValidCoupons] = useState({});
  const [qrScannerActive, setQrScannerActive] = useState(false);
  const [usedCoupons, setUsedCoupons] = useState([]);
  const [isPhoneSaved, setIsPhoneSaved] = useState(false);
  const realtimeDb = getDatabase(); // ✅ Good
  const [qrError, setQrError] = useState("");
  const [rawTotalAmount, setRawTotalAmount] = useState(0); // 💡 Add this
  const qrReaderRef = useRef(null);
  const scannerInstance = useRef(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);


  const navigate = useNavigate();

  // ✅ Fetch Coupons from Firebase
  useEffect(() => {
    const couponsRef = ref(rtdb, "coupons");
    get(couponsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedCoupons = Object.entries(data).reduce((acc, [key, value]) => {
          acc[value.code.toUpperCase()] = { discount: value.discount, expiry: value.expiry };
          return acc;
        }, {});
        setValidCoupons(formattedCoupons);
      }
    });
  }, []);

  //phone number
  useEffect(() => {
    if (!user || !user.uid) return;
  // ✅ Save Phone Number to Firebase
  const userRef = ref(realtimeDb, `users/${user.uid}`);
  get(userRef).then((snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.val();
      if (userData.phone) {
        setPhone(userData.phone);
        setIsPhoneSaved(true);
      }
    }
  });
}, [user]);


  // ✅ Calculate Total Amount
  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity) || 0), 0);
    setRawTotalAmount(total);
    setTotalAmount((total - discount).toFixed(2));
  }, [cart, discount]);

  
// ✅ QR Code Scanning Logic
// ✅ QR Code Scanning Logic
const handleScan = async (decodedText) => {
  if (!decodedText) return;

  console.log("📦 Decoded QR Text:", decodedText);

  const db = getDatabase();
  const tablesRef = ref(db, "tables");

  onValue(
    tablesRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        setQrError("❌ Invalid table QR code.");
        setQrMatched(false);
        setScannedTable("");
        return;
      }

      const tablesData = snapshot.val();
      const normalizedDecodedText = decodedText.trim().toLowerCase();

      let matchedEntry = null;

      for (const [key, value] of Object.entries(tablesData)) {
        if (typeof value === 'object' && !value.qrText) {
          for (const [subKey, subValue] of Object.entries(value)) {
            if (typeof subValue === 'object' && subValue.qrText) {
              const normalizedQrText = subValue.qrText.trim().toLowerCase();
              console.log(`🟡 Checking table ${key}/${subKey}:`, normalizedQrText);
              if (normalizedQrText === normalizedDecodedText) {
                matchedEntry = [`${key}/${subKey}`, subValue];
                break;
              }
            }
          }
        } else if (value && value.qrText) {
          const normalizedQrText = value.qrText.trim().toLowerCase();
          console.log(`🟡 Checking table ${key}:`, normalizedQrText);
          if (normalizedQrText === normalizedDecodedText) {
            matchedEntry = [key, value];
            break;
          }
        } else {
          console.log(`⏩ Skipping non-table entry ${key}`);
        }
        if (matchedEntry) break;
      }

      if (!matchedEntry) {
        console.warn("❌ Scanned QR not found:", decodedText);
        setQrError("❌ Invalid table QR code.");
        setQrMatched(false);
        setScannedTable("");
        return;
      }

      const [tableKey, tableData] = matchedEntry;

      if ((tableData.status || "").toLowerCase() !== "open") {
        setQrError("❌ This table is not open.");
        setQrMatched(false);
        setScannedTable(tableKey);
        return;
      }

      setScannedTable(tableKey);
      listenTableStatus(tableKey);
      setQrMatched(true);
      setQrError("");
      setQrScannerActive(false);
    },
    { onlyOnce: true }
  );
};

// ✅ Handle scanner errors
const handleError = (err) => {
  console.error("QR Scan Error:", err);
};

// ✅ Initialize QR Code Scanner
useEffect(() => {
  if (qrScannerActive && !scannerInstance.current) {
    scannerInstance.current = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scannerInstance.current.render(handleScan, handleError);
  }

  return () => {
    if (scannerInstance.current) {
      scannerInstance.current.clear();
      scannerInstance.current = null;
    }
  };
}, [qrScannerActive]);

// ✅ Listen for real-time table status updates
const listenTableStatus = (tableKey) => {
  if (!tableKey) return;

  const db = getDatabase();
  const tableRef = ref(db, `tables/${tableKey}`);

  onValue(tableRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log(`🔄 Real-time Status Update for ${tableKey}:`, data.status);

      if (data.status && data.status.toLowerCase() !== "open") {
        setQrError(`❌ Table is now ${data.status}.`);
        setQrMatched(false);
      } else {
        setQrError("");
        setQrMatched(true);
      }
    }
  });
};


// ✅ Save phone number to Firebase
const savePhoneNumber = async () => {
  if (!phone || phone.length !== 10) {
    alert("❌ Please enter a valid 10-digit phone number.");
    return;
  }

  if (!user || !user.uid) {
    alert("❌ User details not found. Please log in again.");
    return;
  }

  const userRef = ref(realtimeDb, `users/${user.uid}`);
  await update(userRef, { phone });
  setIsPhoneSaved(true);
  alert("✅ Phone number saved successfully!");
};

 // ✅ Apply Coupon with Firebase Validation
const applyCoupon = async () => {
  if (appliedCoupon) {
    setCouponMessage("❌ Only one coupon can be used per order.");
    return;
  }

  const couponCodeUpper = coupon.toUpperCase();

  if (!validCoupons[couponCodeUpper]) {
    setCouponMessage("❌ Invalid or expired coupon.");
    return;
  }

  const userCouponRef = ref(rtdb, `users/${user.uid}/usedCoupons/${couponCodeUpper}`);
  const snapshot = await get(userCouponRef);

  if (snapshot.exists()) {
    setCouponMessage("❌ You have already used this coupon.");
    return;
  }

  setDiscount(validCoupons[couponCodeUpper].discount);
  setAppliedCoupon(true);
  setAppliedCouponCode(couponCodeUpper);  // ✅ Store applied coupon code
  setCouponMessage(`✅ ₹${validCoupons[couponCodeUpper].discount} discount applied!`);

  await set(userCouponRef, true);
};


  // ✅ Handle Order Placement
  const handlePlaceOrder = async () => {
    if (!qrMatched) {
      alert("❌ Please scan a valid table QR code to proceed!");
      return;
    }
  
    if (!user || !user.uid) {
      alert("❌ User details not found. Please log in again.");
      return;
    }
  
    if (!phone || phone.length !== 10) {
      alert("❌ Please enter a valid 10-digit phone number.");
      return;
    }
  

    const handlePlaceOrderClick = async () => {
      if (!qrMatched || isPlacingOrder) return;
      setIsPlacingOrder(true);
    
      try {
        await handlePlaceOrder(); // your existing function
        // Optional: navigate("/success");
      } catch (error) {
        console.error("Order Failed:", error);
        setIsPlacingOrder(false); // enable retry only on error
      }
    };

    
  // Save phone to user profile
const userRef = ref(rtdb, `users/${user.uid}`);
await update(userRef, { phone });

const subtotal = cart.reduce(
  (sum, item) => sum + (Number(item.price) * Number(item.quantity) || 0),
  0
);

const finalAmount = (subtotal - discount).toFixed(2);

const orderDetails = {
  table: scannedTable,
  items: cart,
  subtotal: subtotal.toFixed(2),
  discount,
  finalAmount,
  couponCode: appliedCouponCode, // ✅ added coupon code
  status: "Pending",
  timestamp: new Date().toISOString(),
  user: {
    uid: user.uid,
    name: user.displayName || "Guest",
    email: user.email || "No Email",
    phone: phone,
  },
};


// Save order
const orderRef = push(ref(rtdb, "orders"));
await set(orderRef, orderDetails);

// Mark table as occupied
const tableRef = ref(rtdb, `tableStatus/${scannedTable}`);
await set(tableRef, "occupied");

alert(`✅ Your order has been placed successfully! Redirecting to Order Tracking.`);

clearCart();
navigate("/Order");

  };
  

  return (
    <div className="cart-page">
      <h2>Your Cart</h2>

      {cart.length === 0 ? (
        <p className="empty-cart">Your cart is empty.</p>
      ) : (
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <img src={item.image} alt={item.name} />
              <div className="cart-item-info">
                <h3>{item.name}</h3>
                <p>₹{Number(item.price).toFixed(2)}</p>
                <p>Qty: {item.quantity}</p>
                <p>Total: ₹{Number(item.price * item.quantity).toFixed(2)}</p>
              </div>
              <button className="remove-btn" onClick={() => removeFromCart(item.id)}>❌</button>
            </div>
          ))}

          <h2 className="cart-total">Total: ₹{isNaN(totalAmount) ? "0.00" : totalAmount}</h2>

          {/* ✅ Phone Number Section */}
<div className="phone-section">
  <h3>Your Phone Number</h3>

  {isPhoneSaved ? (
    <p>📱 {phone}</p>
  ) : (
    <>
      <input
        type="text"
        placeholder="Enter 10-digit phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <button className="save-btn" onClick={savePhoneNumber}>
        Save
      </button>
    </>
  )}
</div>



               {/* ✅ Coupon Section with Buttons & Input */}
      <div className="coupon-section">
        <h3>Apply Coupon</h3>
        <div className="coupon-list">
          {Object.keys(validCoupons).length === 0 ? (
            <p>No coupons available.</p>
          ) : (
            Object.keys(validCoupons).map((code) => (
              <button
                key={code}
                className={`coupon-btn ${usedCoupons.includes(code) ? "used" : "valid"}`}
                onClick={() => setCoupon(code)}
                disabled={usedCoupons.includes(code) || appliedCoupon}
              >
                {code} - ₹{validCoupons[code].discount} Off {usedCoupons.includes(code) && "(Used)"}
              </button>
            ))
          )}
        </div>

        {/* ✅ Manual Coupon Entry */}
        <input
          type="text"
          placeholder="Enter Coupon Code"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
          disabled={appliedCoupon}
        />
        <button className="apply-coupon-btn" onClick={applyCoupon} disabled={appliedCoupon}>Apply</button>
        {couponMessage && <p className="coupon-message">{couponMessage}</p>}
      </div>

          {/* ✅ QR Scanner Section */}
          <div className="qr-section">
        <h3>Scan Table QR Code</h3>
        <button onClick={() => setQrScannerActive(true)}>Start QR Scanner</button>
        {qrError && <p style={{ color: "red" }}>{qrError}</p>}
        <div id="qr-reader" ref={qrReaderRef}></div>
      </div>

      <button
  className="place-order-btn"
  onClick={() => {
    if (!isPlacingOrder) {
      setIsPlacingOrder(true);
      handlePlaceOrder().finally(() => setIsPlacingOrder(false));
    }
  }}
  disabled={!qrMatched || isPlacingOrder}
>
  {isPlacingOrder ? "Placing Order..." : "Place Order"}
</button>
        </div>
      )}
    </div>
  );
};

export default Cart;
