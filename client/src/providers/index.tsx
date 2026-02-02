import { AuthenticationProvider } from "@/providers/authentication-provider";
import { Toaster } from "react-hot-toast";

type Props = {
    children: React.ReactNode;
}

export const Providers = (props: Props) => {
    return (
        <AuthenticationProvider>
            <Toaster />

            {props.children}
        </AuthenticationProvider>
    )
}