import React, { useState, useEffect, useRef } from "react";
import { getDatabase, ref, onValue, update } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./table.css";

const TableManagement = () => {
    const [tables, setTables] = useState([]);
    const [restaurantName, setRestaurantName] = useState("");
    const auth = getAuth();
    const timersRef = useRef({});
    const navigate = useNavigate();
    const [tablesLoaded, setTablesLoaded] = useState(false);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) return;
            const userId = user.uid;
            const db = getDatabase();

            const restaurantRef = ref(db, `restaurantName/${userId}`);
            const tablesRef = ref(db, `tables/${userId}`);
            const statusRef = ref(db, `tableStatus/${userId}`);
            const ordersRef = ref(db, `orders/${userId}`);

            fixTableStatusFormat(userId);

            onValue(restaurantRef, (snapshot) => {
                const name = snapshot.val();
                if (name) setRestaurantName(name);
            });

            onValue(tablesRef, (snapshot) => {
                const tablesData = snapshot.val() || {};
                const tablesArray = Object.entries(tablesData)
                    .filter(([key]) => key !== "lastGenerated")
                    .map(([key, value]) => ({
                        id: key,
                        name: value.name || key,
                        createdAt: value.createdAt || 0,
                        status: value.status || "Unknown",
                    }))
                    .sort((a, b) => a.createdAt - b.createdAt);
                setTables(tablesArray);
            });

            onValue(statusRef, (snapshot) => {
                const statusData = snapshot.val() || {};
                setTables((prev) =>
                    prev.map((table) => ({
                        ...table,
                        status: statusData[table.id]?.status || table.status,
                    }))
                );
            });

            onValue(ordersRef, (snapshot) => {
                const ordersData = snapshot.val() || {};
                Object.values(ordersData).forEach((order) => {
                    if (
                        order.status === "Approved" &&
                        order.table &&
                        order.table.startsWith(userId)
                    ) {
                        const tableKey = order.table.split("/")[1];
                        if (tableKey) {
                            updateTableStatus(userId, tableKey, "Occupied");
                        }
                    }
                });
            });
        });

        return () => {
            unsubscribe();
            Object.values(timersRef.current).forEach(clearTimeout);
        };
    }, []);

    const fixTableStatusFormat = (userId) => {
        const db = getDatabase();
        const statusRef = ref(db, `tableStatus/${userId}`);

        onValue(
            statusRef,
            (snapshot) => {
                const data = snapshot.val() || {};
                Object.entries(data).forEach(([tableId, value]) => {
                    if (typeof value === "string") {
                        update(ref(db, `tableStatus/${userId}/${tableId}`), { status: value });
                    }
                });
            },
            { onlyOnce: true }
        );
    };

    const updateTableStatus = (userId, tableId, status) => {
        const db = getDatabase();

        if (timersRef.current[tableId]) {
            clearTimeout(timersRef.current[tableId]);
            delete timersRef.current[tableId];
        }

        Promise.all([
            update(ref(db, `tableStatus/${userId}/${tableId}`), { status }),
            update(ref(db, `tables/${userId}/${tableId}`), { status }),
        ])
            .then(() => {
                alert(`Table status successfully updated to "${status}"`);
            })
            .catch((error) => {
                alert("Failed to update table status: " + error.message);
            });

        if (status === "Occupied" || status === "Reserved") {
            timersRef.current[tableId] = setTimeout(() => {
                updateTableStatus(userId, tableId, "Open");
            }, 45 * 60 * 1000); // 45 mins auto-open
        }
    };

    return (
        <div className="table-container">
            <h2 className="table-title">{restaurantName} - Table Management</h2>
            <button onClick={() => navigate("/history")}>View History</button>

            <div className="tables-grid">
                {tables.length > 0 ? (
                    tables.map(({ id, name, status }) => (
                        <div
                            key={id}
                            className={`table-box ${status?.toLowerCase() || "unknown"}`}
                        >
                            <h3>{name}</h3>
                            <p>
                                Status: <strong>{status}</strong>
                            </p>
                            <div className="button-group">
                                <button onClick={() => updateTableStatus(auth.currentUser.uid, id, "Open")}>Open</button>
                                <button onClick={() => updateTableStatus(auth.currentUser.uid, id, "Occupied")}>Occupied</button>
                                <button onClick={() => updateTableStatus(auth.currentUser.uid, id, "Reserved")}>Reserved</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No tables found.</p>
                )}
            </div>

            <button className="back-btn" onClick={() => navigate("/admin")}>
                    Back to Admin
                </button>
        </div>
    );
};

export default TableManagement;
