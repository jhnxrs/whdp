"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import toast from "react-hot-toast"
import { useNavigate } from "react-router"

const formSchema = z
    .object({
        email: z.email("Please enter a valid email."),
        password: z.string().min(8, "Password must be at least 8 characters."),
    });

type FormValues = z.infer<typeof formSchema>

export function SigninForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const navigate = useNavigate();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(data: FormValues) {
        try {
            await signInWithEmailAndPassword(auth, data.email, data.password)

            toast.success("Welcome back! 🎉");

            setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 1000);
        } catch (error: any) {
            console.error("Signin error:", error)

            switch (error.code) {
                case "auth/user-not-found":
                    toast.error("No account found with this email.")
                    break

                case "auth/wrong-password":
                    toast.error("Incorrect password. Please try again.")
                    break

                case "auth/invalid-email":
                    toast.error("That email address is not valid.")
                    break

                case "auth/user-disabled":
                    toast.error("This account has been disabled. Contact support.")
                    break

                case "auth/too-many-requests":
                    toast.error("Too many failed attempts. Try again later or reset your password.")
                    break

                case "auth/network-request-failed":
                    toast.error("Network error. Check your connection and try again.")
                    break

                default:
                    toast.error("Unable to sign in. Please try again.")
            }
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Welcome back</CardTitle>
                    <CardDescription>
                        Enter your access details below to continue
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form id="signup-form" onSubmit={form.handleSubmit(onSubmit)}>
                        <FieldGroup>
                            <Controller
                                name="email"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="signup-email">
                                            Email
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id="signup-email"
                                            type="email"
                                            placeholder="m@example.com"
                                            autoComplete="email"
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />

                            <Controller
                                name="password"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="signup-password">
                                            Password
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id="signup-password"
                                            type="password"
                                            aria-invalid={fieldState.invalid}
                                            autoComplete="new-password"
                                        />
                                        <FieldDescription>
                                            Must be at least 8 characters long.
                                        </FieldDescription>
                                        {fieldState.invalid && (
                                            <FieldError errors={[fieldState.error]} />
                                        )}
                                    </Field>
                                )}
                            />
                        </FieldGroup>
                    </form>
                </CardContent>

                <div className="px-6 pb-6">
                    <Button
                        type="submit"
                        form="signup-form"
                        className="w-full"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting ? "Validating..." : "Sign In"}
                    </Button>
                </div>
            </Card>

            <FieldDescription className="px-6 text-center">
                By clicking continue, you agree to our{" "}
                <a href="#">Terms of Service</a> and{" "}
                <a href="#">Privacy Policy</a>.
            </FieldDescription>
        </div>
    )
}