import { auth } from "@/lib/firebase";
import { onIdTokenChanged, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
    user: User | null;
    idToken: string | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    idToken: null,
    loading: true,
});

export const AuthenticationProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [idToken, setIdToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setUser(null);
                setIdToken(null);
                setLoading(false);
                return;
            }

            const token = await firebaseUser.getIdToken();

            setUser(firebaseUser);
            setIdToken(token);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, idToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);