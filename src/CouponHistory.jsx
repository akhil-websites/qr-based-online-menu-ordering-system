import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";

import "./CouponHistory.css";

const CouponHistory = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const db = getDatabase();
        const ordersRef = ref(db, "orders");
        const couponsRef = ref(db, "coupons");

        const fetchData = async () => {
            const couponUsageCount = {};

            onValue(ordersRef, (ordersSnapshot) => {
                const ordersData = ordersSnapshot.val();
                if (ordersData) {
                    Object.values(ordersData).forEach(order => {
                        if (order.couponCode) {
                            const code = order.couponCode.toUpperCase();
                            couponUsageCount[code] = (couponUsageCount[code] || 0) + 1;
                        }
                    });
                }

                onValue(couponsRef, (couponsSnapshot) => {
                    const couponsData = couponsSnapshot.val();
                    if (couponsData) {
                        const couponsArray = Object.keys(couponsData).map(key => {
                            const coupon = couponsData[key];
                            const code = coupon.code?.toUpperCase() || "N/A";

                            return {
                                id: key,
                                code,
                                discount: coupon.discount || 0,
                                expiry: coupon.expiry || "Unknown",
                                createdAt: coupon.createdAt || "Unknown",
                                expiredAt: coupon.expiredAt || "N/A",
                                minAmount: coupon.minAmount || 0,
                                totalUsed: couponUsageCount[code] || 0,
                            };
                        });
                        setCoupons(couponsArray);
                        setLoading(false);
                    }
                });
            });
        };

        fetchData();
    }, []);

    const downloadCSV = () => {
        let csvContent = "Coupon Code,Discount Amount (INR),Expiry Date,Created Date,Expired Date,Min. Amount,Total Used\n";
        coupons.forEach(({ code, discount, expiry, createdAt, expiredAt, minAmount, totalUsed }) => {
            csvContent += `"${code}","${discount} INR","${expiry}","${createdAt}","${expiredAt}","${minAmount}","${totalUsed}"\n`;
        });
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, "coupons_history.csv");
    };

    return (
        <div className="coupon-history-container">
            <h2 className="coupon-history-title">Coupon History (INR)</h2>

            {loading ? (
                <p>Loading...</p>
            ) : coupons.length > 0 ? (
                <>
                    <table className="coupon-history-table" border="1">
                        <thead>
                            <tr className="coupon-history-header-row">
                                <th className="coupon-history-header">Coupon Code</th>
                                <th className="coupon-history-header">Discount Amount (INR)</th>
                                <th className="coupon-history-header">Created Date</th>
                                <th className="coupon-history-header">Expiry Date</th>
                                <th className="coupon-history-header">Expired Date</th>
                                <th className="coupon-history-header">Min. Amount</th>
                                <th className="coupon-history-header">Total Used</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map(({ id, code, discount, createdAt, expiry, expiredAt, minAmount, totalUsed }) => (
                                <tr key={id} className="coupon-history-row">
                                    <td className="coupon-history-data">{code}</td>
                                    <td className="coupon-history-data">{discount} INR</td>
                                    <td className="coupon-history-data">{createdAt}</td>
                                    <td className="coupon-history-data">{expiry}</td>
                                    <td className="coupon-history-data">{expiredAt}</td>
                                    <td className="coupon-history-data">{minAmount}</td>
                                    <td className="coupon-history-data">{totalUsed}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <button className="download-csv-button" onClick={downloadCSV}>
                        Download CSV
                    </button>

                    <button className="back-btn" onClick={() => navigate(-1)}>
                        Back to Admin Panel
                    </button>
                </>
            ) : (
                <p>No Coupons Found.</p>
            )}
        </div>
    );
};

export default CouponHistory;
