import React, { useState, useEffect, useRef } from "react";
import { useCart } from "./CartContext";
import { rtdb } from "./firebaseConfig"; // ✅ Use rtdb
import { ref, onValue } from "firebase/database";
import "./Hero.css";
import "./FoodSection.css";

const Starters = () => {
  const { addToCart } = useCart();
  const [menu, setMenu] = useState({ "1": [], "2": [], "3": [] });
  const [addedItems, setAddedItems] = useState({});
  const sectionRefs = useRef([]);

  useEffect(() => {
    const startersRef = ref(rtdb, "menu"); // ✅ Use rtdb
  
    onValue(startersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
  
      const startersMenu = { "1": [], "2": [], "3": [] };
  
      Object.keys(data).forEach((key) => {
        const item = data[key];
  
        // ✅ Ensure category check is case-insensitive
        if (item.category?.trim().toLowerCase() === "starters") {
          const subcategoryKey = String(item.subcategory || "1"); // ✅ Ensure subcategory exists
  
          if (!startersMenu[subcategoryKey]) {
            startersMenu[subcategoryKey] = []; // ✅ Initialize if missing
          }
  
          startersMenu[subcategoryKey].push({ ...item, quantity: 1 });
        }
      });
  
      setMenu(startersMenu);
    });
  }, []);
  

  // ✅ Auto-scroll Effect
  useEffect(() => {
    sectionRefs.current.forEach((ref) => {
      if (ref) {
        const scrollInterval = setInterval(() => {
          ref.scrollBy({ left: 220, behavior: "smooth" });
          if (ref.scrollLeft + ref.clientWidth >= ref.scrollWidth) {
            ref.scrollTo({ left: 0, behavior: "smooth" });
          }
        }, 3000);
        return () => clearInterval(scrollInterval);
      }
    });
  }, []);

  // ✅ Handle Quantity Change
  const handleQuantityChange = (sectionKey, itemId, type) => {
    setMenu((prevMenu) => {
      const updatedMenu = { ...prevMenu };
      updatedMenu[sectionKey] = updatedMenu[sectionKey].map((item) =>
        item.id === itemId
          ? { ...item, quantity: type === "increase" ? item.quantity + 1 : Math.max(1, item.quantity - 1) }
          : item
      );
      return updatedMenu;
    });
  };

  // ✅ Handle Add to Cart
  const handleAddToCart = (itemId, sectionKey) => {
    const itemToAdd = menu[sectionKey].find((item) => item.id === itemId);
    if (!itemToAdd) return;

    addToCart({
      id: itemToAdd.id,
      name: itemToAdd.name,
      price: itemToAdd.price,
      quantity: itemToAdd.quantity,
      totalPrice: (itemToAdd.price * itemToAdd.quantity).toFixed(2),
      image: itemToAdd.image,
    });

    // ✅ Show "Added" text for 5 seconds
    setAddedItems((prev) => ({ ...prev, [itemId]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [itemId]: false }));
    }, 5000);
  };

  return (
    <div className="starters-page">
      {/* ✅ Hero Section */}
      <div className="hero">
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>Welcome to Our Starters</h1>
            <p>Delicious appetizers to start your meal.</p>
            <button className="cta-button">View All Starters</button>
          </div>
        </div>
      </div>

      <h1 className="animated-title">Starters Menu</h1>

      {/* ✅ Display Menu Sections */}
      {Object.keys(menu).map((sectionKey, sectionIndex) => (
        <div key={`section-${sectionKey}`} className="section-container">
          <h2 className="section-title">
            {sectionKey === "1" ? "Veg Starters" : sectionKey === "2" ? "Non-Veg Starters" : "Special Starters"}
          </h2>
          <div className="food-section">
            <div className="food-grid" ref={(el) => (sectionRefs.current[sectionIndex] = el)}>
              {(menu[sectionKey] || []).map((item) => (
                <div key={item.id} className={`food-item ${!item.available ? "unavailable" : ""}`}>
                  <img src={item.image} alt={item.name} className="food-image" />
                  <h3 className="food-name">{item.name}</h3>
                  <p className="food-price">₹{Number(item.price).toFixed(2)}</p>

                  {item.available ? (
                    <div className="food-controls">
                      <div className="quantity-controls">
                        <button className="decrease" onClick={() => handleQuantityChange(sectionKey, item.id, "decrease")}>-</button>
                        <span>{item.quantity}</span>
                        <button className="increase" onClick={() => handleQuantityChange(sectionKey, item.id, "increase")}>+</button>
                      </div>
                      <button className="add-to-cart" onClick={() => handleAddToCart(item.id, sectionKey)}>
                        {addedItems[item.id] ? "Added ✅" : "Add to Cart"}
                      </button>
                    </div>
                  ) : (
                    <p className="not-available">Not Available</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Starters;
