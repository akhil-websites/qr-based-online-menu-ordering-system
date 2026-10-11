import React, { useState, useEffect, useRef } from "react";
import { useCart } from "./CartContext";
import { rtdb } from "./firebaseConfig";
import { ref, onValue } from "firebase/database";
import "./Hero.css";
import "./FoodSection.css";

const Veg = () => {
  const { addToCart } = useCart();
  const [menu, setMenu] = useState({ "1": [], "2": [], "3": [] });
  const [addedItems, setAddedItems] = useState({});
  const sectionRefs = useRef([]);

  // ✅ Fetch Menu from Realtime Database
  useEffect(() => {
    const vegRef = ref(rtdb, "menu");
  
    onValue(vegRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
  
      const vegMenu = { "1": [], "2": [], "3": [] };
  
      Object.keys(data).forEach((key) => {
        const item = data[key];
  
        // ✅ Normalize category check (convert to lowercase)
        if (item.category.toLowerCase() === "veg") {
          // ✅ Ensure subcategory exists
          const subcategoryKey = String(item.subcategory); // Ensure it's a string
          if (vegMenu[subcategoryKey]) {
            vegMenu[subcategoryKey].push({ ...item, quantity: 1 });
          }
        }
      });
  
      setMenu(vegMenu);
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
    <div className="veg-page">
      {/* ✅ Hero Section */}
      <div className="hero">
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>Welcome to Our Veg Menu</h1>
            <p>Delicious vegetarian meals at your fingertips.</p>
            <button className="cta-button">View All Dishes</button>
          </div>
        </div>
      </div>

      <h1 className="animated-title">Veg Menu</h1>

      {/* ✅ Display Menu Sections */}
      {Object.keys(menu).map((sectionKey, sectionIndex) => (
        <div key={`section-${sectionKey}`} className="section-container">
          <h2 className="section-title">
            {sectionKey === "1" ? "Veg Starters" : sectionKey === "2" ? "Veg Biryani" : "Veg Curries"}
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

export default Veg;
