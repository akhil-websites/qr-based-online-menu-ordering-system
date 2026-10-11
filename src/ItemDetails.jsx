import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { rtdb } from "./firebaseConfig";
import { ref, get } from "firebase/database";
import { useCart } from "./CartContext"; // ✅ Import cart context
import "./ItemDetails.css"; // ✅ Import styles

const ItemDetails = () => {
  const { itemId } = useParams();
  const { addToCart } = useCart(); // ✅ Cart function
  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false); // ✅ State for confirmation message

  useEffect(() => {
    const fetchItem = async () => {
      const itemRef = ref(rtdb, `menu/${itemId}`);
      const snapshot = await get(itemRef);
      if (snapshot.exists()) {
        setItem(snapshot.val());
      } else {
        setItem(null);
      }
    };

    fetchItem();
  }, [itemId]);

  const handleAddToCart = () => {
    if (!item) return;

    // ✅ Correctly send item with selected quantity
    addToCart({
      id: itemId, // Ensure the item ID is included
      name: item.name,
      price: item.price, // ✅ Ensure correct price is calculated
      image: item.image,
      quantity: quantity, // ✅ Send the correct quantity
      total: item.price * quantity, // ✅ Store total price for easier calculations
    });

    setIsAdded(true); // ✅ Show confirmation message
    setTimeout(() => setIsAdded(false), 2000); // Hide after 2 seconds
  };

  if (!item) {
    return <h2 className="loading">Loading item details...</h2>;
  }

  return (
    <div className="item-details">
      <div className="item-container">
        {/* ✅ Item Image */}
        <img src={item.image} alt={item.name} className="item-image" />

        {/* ✅ Item Info */}
        <div className="item-info">
          <h2 className="item-name">{item.name}</h2>
          <p className="item-price">₹{item.price}</p>

          {/* ✅ Quantity Selector */}
          <div className="quantity-container">
            <button
              className="qty-btn"
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
            >
              ➖
            </button>
            <span className="quantity">{quantity}</span>
            <button className="qty-btn" onClick={() => setQuantity((prev) => prev + 1)}>
              ➕
            </button>
          </div>

          {/* ✅ Add to Cart Button */}
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            🛒 Add to Cart
          </button>

          {/* ✅ Confirmation Message */}
          {isAdded && <p className="added-message">✅ Added {quantity} to Cart!</p>}
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
