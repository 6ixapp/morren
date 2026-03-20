"use client";
import React, { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/utils";

/* ─── Eye icons for password toggle ─── */
const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);
const EyeOffIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);

/* ─── Role config ─── */
const ROLE_CONFIG: Record<string, {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
    icon: React.ReactNode;
}> = {
    buyer: {
        label: "Buyer",
        description: "Access your procurement dashboard, post bid requests and compare quotes.",
        color: "#4FC3F7",
        bgColor: "rgba(79,195,247,0.08)",
        borderColor: "rgba(79,195,247,0.25)",
        glowColor: "rgba(79,195,247,0.15)",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
        ),
    },
    seller: {
        label: "Seller",
        description: "Manage your product listings, submit bids and grow your buyer network.",
        color: "#00C853",
        bgColor: "rgba(0,200,83,0.08)",
        borderColor: "rgba(0,200,83,0.25)",
        glowColor: "rgba(0,200,83,0.15)",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
    },
    shipping_provider: {
        label: "Shipping Provider",
        description: "Bid on shipments, track deliveries and manage your logistics operations.",
        color: "#FFB74D",
        bgColor: "rgba(255,183,77,0.08)",
        borderColor: "rgba(255,183,77,0.25)",
        glowColor: "rgba(255,183,77,0.15)",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
        ),
    },
    admin: {
        label: "Admin",
        description: "Full platform access — manage users, orders, analytics and system config.",
        color: "#CE93D8",
        bgColor: "rgba(206,147,216,0.08)",
        borderColor: "rgba(206,147,216,0.25)",
        glowColor: "rgba(206,147,216,0.15)",
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
};

/* ─── Password input with toggle ─── */
function PasswordInput({
    id,
    placeholder,
    value,
    onChange,
    accentColor,
}: {
    id: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    accentColor: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                id={id}
                type={show ? "text" : "password"}
                placeholder={placeholder}
                required
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl px-4 py-3 pr-12 text-[14px] text-white placeholder-[#555] outline-none transition-all duration-200"
                style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => {
                    e.currentTarget.style.border = `1px solid ${accentColor}60`;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${accentColor}15`;
                }}
                onBlur={(e) => {
                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                }}
            />
            <button
                type="button"
                onClick={() => setShow((s) => !s)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150"
                style={{ color: show ? accentColor : "#555" }}
                aria-label={show ? "Hide password" : "Show password"}
            >
                {show ? <EyeOffIcon /> : <EyeIcon />}
            </button>
        </div>
    );
}

/* ─── Text input ─── */
function TextInput({
    id,
    type = "text",
    placeholder,
    value,
    onChange,
    accentColor,
}: {
    id: string;
    type?: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    accentColor: string;
}) {
    return (
        <input
            id={id}
            type={type}
            placeholder={placeholder}
            required
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-[14px] text-white placeholder-[#555] outline-none transition-all duration-200"
            style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
            }}
            onFocus={(e) => {
                e.currentTarget.style.border = `1px solid ${accentColor}60`;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${accentColor}15`;
            }}
            onBlur={(e) => {
                e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                e.currentTarget.style.boxShadow = "none";
            }}
        />
    );
}

/* ─── Main auth form ─── */
function AuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectRole = searchParams.get("role") || "buyer";
    const { signUp, signIn, user, loading: authLoading } = useAuth();

    const role = ROLE_CONFIG[redirectRole] ?? ROLE_CONFIG.buyer;

    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    useEffect(() => {
        if (user && !authLoading) {
            router.replace(getDashboardRoute(user.role));
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                if (formData.password !== formData.confirmPassword) {
                    setError("Passwords do not match");
                    setIsLoading(false);
                    return;
                }
                if (formData.password.length < 6) {
                    setError("Password must be at least 6 characters");
                    setIsLoading(false);
                    return;
                }
                const { error } = await signUp(
                    formData.email,
                    formData.password,
                    `${formData.firstName} ${formData.lastName}`,
                    redirectRole as "buyer" | "seller" | "admin" | "shipping_provider"
                );
                if (error) {
                    setError(error.message || error.error_description || "Failed to sign up");
                } else {
                    router.push(getDashboardRoute(redirectRole));
                }
            } else {
                const { error } = await signIn(formData.email, formData.password);
                if (error) {
                    setError(error.message || "Failed to sign in");
                }
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const switchMode = () => {
        setIsSignUp((s) => !s);
        setError(null);
        setFormData({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#050505" }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-t-[#00C853] border-[#00C853]/20 animate-spin" />
                    <p className="text-[#888] text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden py-8 px-4"
            style={{ backgroundColor: "#050505" }}>

            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: `radial-gradient(ellipse at 50% 0%, ${role.glowColor} 0%, transparent 60%)`
            }} />
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: "radial-gradient(circle, #00C853 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

            {/* Back to home */}
            <div className="relative z-10 w-full max-w-[460px] mb-6">
                <Link href="/" className="inline-flex items-center gap-2 text-[#888] hover:text-white text-[13px] font-medium transition-colors group">
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to home
                </Link>
            </div>

            {/* Card */}
            <div className="relative z-10 w-full max-w-[460px] rounded-2xl overflow-hidden"
                style={{ backgroundColor: "#0A1A0A", border: `1px solid ${role.borderColor}` }}>

                {/* Role header strip */}
                <div className="px-6 sm:px-8 pt-7 pb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-4">
                        {/* Role icon */}
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: role.bgColor, border: `1px solid ${role.borderColor}`, color: role.color }}>
                            {role.icon}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: role.color }}>
                                    {role.label}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                                    style={{ backgroundColor: `${role.color}20`, color: role.color, border: `1px solid ${role.color}40` }}>
                                    Portal
                                </span>
                            </div>
                            <h1 className="text-white text-[20px] sm:text-[22px] font-bold tracking-tight">
                                {isSignUp ? "Create account" : "Welcome back"}
                            </h1>
                        </div>
                    </div>
                    <p className="text-[#888] text-[13px] leading-relaxed mt-3">{role.description}</p>
                </div>

                {/* Form body */}
                <div className="px-6 sm:px-8 py-6">

                    {/* Error */}
                    {error && (
                        <div className="mb-5 flex items-start gap-3 rounded-xl px-4 py-3"
                            style={{ backgroundColor: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.25)" }}>
                            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-400 text-[13px] leading-relaxed">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name row — sign up only */}
                        {isSignUp && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label htmlFor="firstname" className="block text-[12px] font-semibold text-[#aaa] uppercase tracking-wider">
                                        First name
                                    </label>
                                    <TextInput
                                        id="firstname"
                                        placeholder="John"
                                        value={formData.firstName}
                                        onChange={(v) => setFormData({ ...formData, firstName: v })}
                                        accentColor={role.color}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="lastname" className="block text-[12px] font-semibold text-[#aaa] uppercase tracking-wider">
                                        Last name
                                    </label>
                                    <TextInput
                                        id="lastname"
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={(v) => setFormData({ ...formData, lastName: v })}
                                        accentColor={role.color}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-[12px] font-semibold text-[#aaa] uppercase tracking-wider">
                                Email address
                            </label>
                            <TextInput
                                id="email"
                                type="email"
                                placeholder="you@company.com"
                                value={formData.email}
                                onChange={(v) => setFormData({ ...formData, email: v })}
                                accentColor={role.color}
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-[12px] font-semibold text-[#aaa] uppercase tracking-wider">
                                    Password
                                </label>
                                {!isSignUp && (
                                    <button type="button" className="text-[12px] transition-colors" style={{ color: role.color }}
                                        tabIndex={-1}>
                                        Forgot password?
                                    </button>
                                )}
                            </div>
                            <PasswordInput
                                id="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(v) => setFormData({ ...formData, password: v })}
                                accentColor={role.color}
                            />
                        </div>

                        {/* Confirm password — sign up only */}
                        {isSignUp && (
                            <div className="space-y-1.5">
                                <label htmlFor="confirmPassword" className="block text-[12px] font-semibold text-[#aaa] uppercase tracking-wider">
                                    Confirm password
                                </label>
                                <PasswordInput
                                    id="confirmPassword"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(v) => setFormData({ ...formData, confirmPassword: v })}
                                    accentColor={role.color}
                                />
                                {/* Password strength hint */}
                                {formData.password.length > 0 && (
                                    <div className="flex items-center gap-2 mt-1.5">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                                                style={{
                                                    backgroundColor: formData.password.length >= i * 3
                                                        ? (formData.password.length >= 10 ? role.color : formData.password.length >= 6 ? "#FFB74D" : "#FF5252")
                                                        : "rgba(255,255,255,0.08)"
                                                }} />
                                        ))}
                                        <span className="text-[10px] text-[#666] ml-1 whitespace-nowrap">
                                            {formData.password.length < 6 ? "Too short" : formData.password.length < 10 ? "Fair" : "Strong"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-[15px] font-bold text-white transition-all duration-200 mt-2"
                            style={{
                                backgroundColor: role.color,
                                boxShadow: `0 0 24px ${role.color}40`,
                                opacity: isLoading ? 0.7 : 1,
                            }}
                            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.boxShadow = `0 0 36px ${role.color}60`)}
                            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = `0 0 24px ${role.color}40`)}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                    <span>{isSignUp ? "Creating account..." : "Signing in..."}</span>
                                </>
                            ) : (
                                <>
                                    <span>{isSignUp ? "Create account" : "Sign in"}</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Switch mode */}
                    <div className="mt-6 text-center">
                        <p className="text-[#666] text-[13px]">
                            {isSignUp ? "Already have an account?" : "Don't have an account?"}
                            {" "}
                            <button
                                type="button"
                                onClick={switchMode}
                                className="font-semibold transition-colors"
                                style={{ color: role.color }}
                            >
                                {isSignUp ? "Sign in" : "Sign up"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {/* Role switcher */}
            <div className="relative z-10 w-full max-w-[460px] mt-6">
                <p className="text-[11px] font-semibold text-[#555] uppercase tracking-wider text-center mb-3">Switch portal</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                        <Link
                            key={key}
                            href={`/auth?role=${key}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200"
                            style={redirectRole === key
                                ? { backgroundColor: cfg.bgColor, color: cfg.color, border: `1px solid ${cfg.borderColor}` }
                                : { backgroundColor: "rgba(255,255,255,0.03)", color: "#555", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                            <span style={{ color: redirectRole === key ? cfg.color : "#444" }}>
                                {cfg.icon}
                            </span>
                            {cfg.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <p className="relative z-10 mt-8 text-[11px] text-[#444]">
                &copy; 2026 SPACESHIPZ · Morren Ventures
            </p>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#050505" }}>
                <div className="w-10 h-10 rounded-full border-2 border-t-[#00C853] border-[#00C853]/20 animate-spin" />
            </div>
        }>
            <AuthForm />
        </Suspense>
    );
}
