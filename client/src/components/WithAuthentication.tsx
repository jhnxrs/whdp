import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuth } from '@/providers/authentication-provider';
import { Navigate } from 'react-router';

type Props = {
    children: React.ReactNode;
}

export const WithAuthentication = (props: Props) => {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    if (!user) return <Navigate to="/sign-in" replace />;

    return props.children;
}