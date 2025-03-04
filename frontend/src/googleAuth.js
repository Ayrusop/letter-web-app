import React, { useEffect, useState } from "react";
import axios from "axios";

const GoogleLogin = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        axios.get("http://localhost:5000/auth/user", { withCredentials: true }).then((res) => {
            setUser(res.data);
        });
    }, []);

    const handleLogin = () => {
        window.location.href = "http://localhost:5000/auth/google";
    };

    const handleLogout = () => {
        axios.get("http://localhost:5000/auth/logout", { withCredentials: true })
        .then(() => {
            // Handle the successful logout
            setUser(null); // Or update state accordingly
        })
        .catch((error) => {
            console.error("Error during logout:", error);
        });
    
    };

    return (
        <div>
            {user ? (
                <div>
                    <h2>Welcome, {user.displayName}</h2>
                    <img src={user.photos[0].value} alt="profile" />
                    <button onClick={handleLogout}>Logout</button>
                </div>
            ) : (
                <button onClick={handleLogin}>Login with Google</button>
            )}
        </div>
    );
};

export default GoogleLogin;
