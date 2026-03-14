import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "../api/auth.api";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children } : { children: React.ReactNode }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const data = await getCurrentUser();
            setUser(data.user);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(AuthContext);
}