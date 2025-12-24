import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowRight, Mail, Lock, User, Key, CheckCircle, Loader2 } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

type AuthState = "signin" | "signup" | "otp";

export function Auth() {
    const navigate = useNavigate();
    const [authState, setAuthState] = useState<AuthState>("signin");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [userType, setUserType] = useState<"user" | "organization">("user");

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
        otp: ""
    });

    // Redirect logged-in users to appropriate profile
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        const user = localStorage.getItem("user");
        if (token && user) {
            const userData = JSON.parse(user);
            if (userData.user_type === "organization") {
                navigate("/organization-profile");
            } else {
                navigate("/user-profile");
            }
        }
    }, [navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const parseError = (data: any) => {
        if (typeof data.detail === "string") return data.detail;
        if (Array.isArray(data.detail)) {
            // Pydantic validation error
            return data.detail.map((err: any) => err.msg).join(", ");
        }
        return "Something went wrong";
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            console.log("Signing up as:", userType);
            const res = await fetch(API_ENDPOINTS.AUTH.SIGNUP, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    user_type: userType
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(parseError(data));
            }

            setAuthState("otp");
            setSuccessMsg(`OTP sent to ${formData.email}. Please verify.`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Backend expects fields from both UserSignup and OTPVerify models
            const res = await fetch(API_ENDPOINTS.AUTH.VERIFY_OTP, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    // UserSignup fields
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    user_type: userType,
                    // OTPVerify fields
                    otp: formData.otp
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(parseError(data));

            // Store tokens
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Redirect based on user type
            if (data.user.user_type === "organization") {
                navigate("/organization-profile");
            } else {
                navigate("/user-profile");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    user_type: userType
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(parseError(data));

            // Store tokens
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Redirect based on user type
            if (data.user.user_type === "organization") {
                navigate("/organization-profile");
            } else {
                navigate("/user-profile");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center gap-2 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#0052FF] to-[#00A3FF] rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">A</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">PRISM</h2>
                        <p className="text-xs text-[#0052FF] font-semibold">Authentication</p>
                    </div>
                </div>

                <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                    {authState === "signin" && "Sign in to your account"}
                    {authState === "signup" && "Create your account"}
                    {authState === "otp" && "Verify your email"}
                </h2>

                {authState !== "otp" && (
                    <div className="mt-4 flex justify-center">
                        <div className="bg-gray-200 p-1 rounded-lg inline-flex">
                            <button
                                onClick={() => setUserType("user")}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${userType === "user"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                User
                            </button>
                            <button
                                onClick={() => setUserType("organization")}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${userType === "organization"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Organization
                            </button>
                        </div>
                    </div>
                )}

                <p className="mt-2 text-center text-sm text-gray-600">
                    {authState === "signin" && (
                        <>
                            Or{' '}
                            <button onClick={() => setAuthState("signup")} className="font-medium text-[#0052FF] hover:text-[#0046DD]">
                                start your 14-day free trial
                            </button>
                        </>
                    )}
                    {authState === "signup" && (
                        <>
                            Already have an account?{' '}
                            <button onClick={() => setAuthState("signin")} className="font-medium text-[#0052FF] hover:text-[#0046DD]">
                                Sign in
                            </button>
                        </>
                    )}
                    {authState === "otp" && (
                        <span className="text-gray-500">We sent a code to {formData.email}</span>
                    )}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">

                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-green-700">{successMsg}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={
                        authState === "signin" ? handleSignin :
                            authState === "signup" ? handleSignup :
                                handleVerifyOTP
                    }>

                        {authState === "signup" && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Full Name
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        className="focus:ring-[#0052FF] focus:border-[#0052FF] block w-full pl-10 sm:text-sm border-gray-300 rounded-md h-10"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        )}

                        {(authState === "signin" || authState === "signup") && (
                            <>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email address
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            className="focus:ring-[#0052FF] focus:border-[#0052FF] block w-full pl-10 sm:text-sm border-gray-300 rounded-md h-10"
                                            placeholder="you@example.com"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            className="focus:ring-[#0052FF] focus:border-[#0052FF] block w-full pl-10 sm:text-sm border-gray-300 rounded-md h-10"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {authState === "otp" && (
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                                    Enter 6-digit OTP
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        required
                                        maxLength={6}
                                        className="focus:ring-[#0052FF] focus:border-[#0052FF] block w-full pl-10 sm:text-sm border-gray-300 rounded-md h-10 tracking-widest text-lg"
                                        placeholder="123456"
                                        value={formData.otp}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                    Please check your email {formData.email} for the code.
                                </p>
                            </div>
                        )}

                        <div>
                            <Button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0052FF] hover:bg-[#0046DD] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0052FF]"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        {authState === "signin" && "Sign in"}
                                        {authState === "signup" && "Create account"}
                                        {authState === "otp" && "Verify & Continue"}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>

                    {authState === "otp" && (
                        <div className="mt-6">
                            <button
                                onClick={() => setAuthState("signup")}
                                className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
                            >
                                Change email or try again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
