"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

/* ─────────────── Icons (inline SVG helpers) ─────────────── */
const ChevronDownIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);
const PhoneIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);
const MenuIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);
const XIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const ArrowRightIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);
const PlusIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);
const MailIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);
const LinkedinIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
);
const TwitterIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
    </svg>
);

const SvgIcon = ({ d, className }: { d: string; className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

/* ═══════════════════════════════════════════════════════════
   1. HEADER
   ═══════════════════════════════════════════════════════════ */
const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navItems = [
        {
            label: "Marketplace", type: "mega" as const, id: "marketplace",
            sections: [
                {
                    title: "For Buyers",
                    items: [
                        { name: "Post Bid Requests", desc: "Create RFQs for any spice or agricultural commodity.", href: "#", tag: "" },
                        { name: "Compare Quotes", desc: "Receive and compare bids from verified sellers.", href: "#", tag: "" },
                        { name: "Integrated Shipping", desc: "Get logistics quotes alongside product bids.", href: "#", tag: "New" },
                        { name: "Order Tracking", desc: "Track orders from placement to delivery.", href: "#", tag: "" },
                    ],
                },
                {
                    title: "For Sellers",
                    items: [
                        { name: "Browse Requests", desc: "Access active bid requests from buyers worldwide.", href: "#", tag: "" },
                        { name: "Submit Bids", desc: "Offer competitive pricing with custom terms.", href: "#", tag: "Active" },
                        { name: "Analytics Dashboard", desc: "Track performance, win rates, and revenue.", href: "#", tag: "" },
                    ],
                },
            ],
        },
        {
            label: "Products", type: "mega" as const, id: "products",
            sections: [
                {
                    title: "Categories",
                    items: [
                        { name: "Spices", desc: "Turmeric, Black Pepper, Cardamom, Cumin and more.", href: "#", tag: "" },
                        { name: "Pulses & Grains", desc: "Chickpeas, Lentils, Rice, Wheat, Millets.", href: "#", tag: "" },
                        { name: "Dry Fruits", desc: "Almonds, Cashews, Raisins, Walnuts, Pistachios.", href: "#", tag: "" },
                    ],
                },
                {
                    title: "Features",
                    items: [
                        { name: "HSN Code Integration", desc: "Tax-compliant cataloging for all products.", href: "#", tag: "" },
                        { name: "Quality Grades", desc: "Premium, Grade A, Standard, and Economy tiers.", href: "#", tag: "" },
                        { name: "Incoterms Support", desc: "FOB, CIF, EXW, DDP for global trade.", href: "#", tag: "" },
                    ],
                },
            ],
        },
        {
            label: "Shipping", type: "mega" as const, id: "shipping",
            sections: [
                {
                    title: "Services",
                    items: [
                        { name: "Cross-Border Shipping", desc: "Seamless international freight integration.", href: "#", tag: "" },
                        { name: "Shipping Bids", desc: "Freight forwarders compete for your shipment.", href: "#", tag: "New" },
                        { name: "Real-Time Tracking", desc: "Track shipments across borders in real time.", href: "#", tag: "" },
                    ],
                },
                {
                    title: "For Providers",
                    items: [
                        { name: "Submit Shipping Bids", desc: "Bid on active shipments with delivery estimates.", href: "#", tag: "" },
                        { name: "Manage Deliveries", desc: "Track and manage your delivery schedules.", href: "#", tag: "" },
                        { name: "Performance Stats", desc: "Monitor your win rate and delivery metrics.", href: "#", tag: "" },
                    ],
                },
            ],
        },
        { label: "About", type: "link" as const, id: "about", href: "#about", sections: [] },
        { label: "Contact", type: "link" as const, id: "contact", href: "#contact", sections: [] },
        { label: "Dashboard", type: "link" as const, id: "dashboard", href: "/dashboard", sections: [] },
    ];

    return (
        <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled ? "py-4" : "py-6"}`}>
            <div className="container mx-auto px-6">
                <nav
                    className={`flex items-center justify-between rounded-full px-8 h-[70px] ${isScrolled ? "bg-opacity-80" : "bg-opacity-40"}`}
                    style={{ backgroundColor: "rgba(10, 8, 6, 0.85)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.1)" }}
                >
                    <div className="flex-shrink-0">
                        <a href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">S</span>
                            </div>
                            <span className="text-white text-lg font-semibold tracking-tight">SPACESHIPZ</span>
                        </a>
                    </div>

                    <ul className="hidden lg:flex items-center gap-8 h-full">
                        {navItems.map((item) => (
                            <li
                                key={item.label}
                                className="relative group h-full flex items-center"
                                onMouseEnter={() => item.type === "mega" && setActiveDropdown(item.id)}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                {item.type === "mega" ? (
                                    <button className="flex items-center gap-1.5 text-[14px] font-medium text-white/90 hover:text-white transition-colors">
                                        {item.label}
                                        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === item.id ? "rotate-180" : ""}`} />
                                    </button>
                                ) : (
                                    <a href={item.href} className="text-[14px] font-medium text-white/90 hover:text-white transition-colors">{item.label}</a>
                                )}

                                {item.type === "mega" && activeDropdown === item.id && (
                                    <div className="absolute top-[100%] left-1/2 -translate-x-1/2 pt-4 w-[850px]">
                                        <div
                                            className="rounded-3xl overflow-hidden p-8 flex gap-10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300"
                                            style={{ background: "rgba(10, 8, 6, 0.95)", backdropFilter: "blur(40px)", border: "1px solid rgba(255, 255, 255, 0.1)" }}
                                        >
                                            {item.sections?.map((section, idx) => (
                                                <div key={idx} className={`flex-1 ${idx < (item.sections?.length || 0) - 1 ? "border-r border-white/10 pr-10" : ""}`}>
                                                    <h4 className="text-[12px] font-bold text-white/40 uppercase tracking-widest mb-6 px-1">{section.title}</h4>
                                                    <div className="grid gap-6">
                                                        {section.items?.map((subItem) => (
                                                            <a key={subItem.name} href={subItem.href} className="group/item block">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="text-white font-bold text-[15px] group-hover/item:text-[#D4710F] transition-colors">{subItem.name}</p>
                                                                    {subItem.tag && (
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4710F]/20 text-[#D4710F] uppercase">{subItem.tag}</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-white/50 text-[13px] leading-snug">{subItem.desc}</p>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center gap-4">
                        <a href="mailto:rendu@morrenventures.com" className="hidden xl:flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10">
                                <PhoneIcon className="w-4 h-4" />
                            </div>
                            <span className="text-[14px] font-medium">Contact Us</span>
                        </a>
                        <Link href="/dashboard" className="btn-primary text-[15px] !py-3 !px-8 h-[48px] flex items-center justify-center" style={{ borderRadius: "9999px" }}>Get Started</Link>
                        <button className="lg:hidden p-2 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </nav>
            </div>

            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 top-[100px] z-50 bg-[#0A0806]/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="p-6 h-[calc(100vh-100px)] overflow-y-auto">
                        <ul className="space-y-8">
                            {navItems.map((item) => (
                                <li key={item.label}>
                                    {item.type === "mega" ? (
                                        <div className="space-y-4">
                                            <p className="text-white/40 text-[12px] font-bold uppercase tracking-widest px-2">{item.label}</p>
                                            <div className="grid gap-4 pl-2">
                                                {item.sections?.flatMap((s) => s.items || []).slice(0, 5).map((sub) => (
                                                    <a key={sub.name} href={sub.href} className="block text-white text-[16px] font-medium">{sub.name}</a>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <a href={item.href} className="block text-white text-[20px] font-semibold px-2">{item.label}</a>
                                    )}
                                </li>
                            ))}
                            <li className="pt-8 border-t border-white/10">
                                <a href="mailto:rendu@morrenventures.com" className="flex items-center gap-3 text-white px-2">
                                    <PhoneIcon className="w-5 h-5 text-[#D4710F]" />
                                    <span className="text-[18px]">rendu@morrenventures.com</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </header>
    );
};

/* ═══════════════════════════════════════════════════════════
   2. HERO
   ═══════════════════════════════════════════════════════════ */
const Hero = () => (
    <section className="relative overflow-hidden bg-[#0A0806] min-h-screen flex flex-col items-center justify-center pt-[100px] pb-[100px]">
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(212, 113, 15, 0.15) 0%, rgba(10, 8, 6, 1) 70%)" }} />
        <div className="absolute top-[-100px] left-[-200px] w-[800px] h-[800px] opacity-40 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(212, 113, 15, 0.12) 0%, transparent 70%)" }} />
        <div className="absolute top-[10%] right-[-300px] w-[700px] h-[700px] opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(196, 93, 10, 0.1) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="container relative z-10 px-6 mx-auto text-center">
            <div className="max-w-4xl mx-auto flex flex-col items-center">
                <h1 className="font-serif text-white text-balance tracking-tight leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-medium text-[44px] md:text-[56px] lg:text-[64px]">
                    Digitizing Global B2B <br className="hidden md:block" />Spice Procurement
                </h1>
                <p className="text-[#887766] text-lg md:text-[20px] lg:text-[22px] max-w-2xl leading-[1.4] mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                    What if businesses in the spice industry could instantly access the best prices -- not just from a handful of suppliers, but from hundreds of sources globally? Our real-time bidding platform connects buyers with FPOs, auctioneers, and farmers worldwide.
                </p>
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    <Link href="/dashboard" className="btn-primary group relative flex items-center justify-center gap-2 text-[15px] cursor-pointer">
                        Start Sourcing
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                </div>
            </div>

            <div className="mt-24 w-full animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                <p className="text-[13px] font-medium tracking-[0.1em] text-[#887766] uppercase mb-12">India contributes 45% of the global spice supply</p>
                <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-10">
                    <div className="text-center">
                        <p className="text-[32px] md:text-[40px] font-bold text-white leading-none mb-1">$12B+</p>
                        <p className="text-[13px] text-[#887766] uppercase tracking-wider">Global Spice Market</p>
                    </div>
                    <div className="w-px h-12 bg-white/10 hidden md:block" />
                    <div className="text-center">
                        <p className="text-[32px] md:text-[40px] font-bold text-white leading-none mb-1">45%</p>
                        <p className="text-[13px] text-[#887766] uppercase tracking-wider">India&apos;s Export Share</p>
                    </div>
                    <div className="w-px h-12 bg-white/10 hidden md:block" />
                    <div className="text-center">
                        <p className="text-[32px] md:text-[40px] font-bold text-white leading-none mb-1">100+</p>
                        <p className="text-[13px] text-[#887766] uppercase tracking-wider">Countries Served</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            <div className="container h-full mx-auto relative flex justify-between">
                <div className="w-px h-full bg-gradient-to-b from-transparent via-[#ffffff10] to-transparent opacity-30" />
                <div className="w-px h-full bg-gradient-to-b from-transparent via-[#ffffff10] to-transparent opacity-30 hidden md:block" />
                <div className="w-px h-full bg-gradient-to-b from-transparent via-[#ffffff10] to-transparent opacity-30 hidden md:block" />
                <div className="w-px h-full bg-gradient-to-b from-transparent via-[#ffffff10] to-transparent opacity-30 hidden md:block" />
                <div className="w-px h-full bg-gradient-to-b from-transparent via-[#ffffff10] to-transparent opacity-30" />
            </div>
        </div>
    </section>
);

/* ═══════════════════════════════════════════════════════════
   3. TRUSTED BY (highlights bar)
   ═══════════════════════════════════════════════════════════ */
const TrustedBy = () => {
    const highlights = [
        { label: "Seamless Cross-Border Shipping", icon: "M20 12H4m8-8l8 8-8 8" },
        { label: "Real-Time Competitive Bidding", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
        { label: "Verified Supplier Network", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
        { label: "HSN & Incoterms Compliant", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    ];
    return (
        <section className="bg-[#0A0806] py-16 sm:py-20 relative overflow-hidden border-t border-white/5">
            <div className="container mx-auto px-6 max-w-[1280px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {highlights.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-xl bg-[#D4710F]/10 border border-[#D4710F]/20 flex items-center justify-center flex-shrink-0">
                                <SvgIcon d={item.icon} className="w-5 h-5 text-[#D4710F]" />
                            </div>
                            <span className="text-white/80 text-[14px] font-medium leading-snug">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════
   4. ROLE SELECTION
   ═══════════════════════════════════════════════════════════ */
const roleCards = [
    {
        role: "buyer",
        title: "Buyer",
        description: "Post bid requests, compare quotes from suppliers, and manage your procurement efficiently.",
        icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
        features: ["Post Bid Requests", "Compare Quotes", "Order Tracking", "Market Insights"],
        gradient: "from-blue-500/10 to-cyan-500/10",
        borderGradient: "from-blue-500/20 to-cyan-500/20",
        iconBg: "bg-blue-500/10",
        iconBorder: "border-blue-500/20",
        iconColor: "text-blue-500",
    },
    {
        role: "seller",
        title: "Seller",
        description: "Access buyer requests, submit competitive bids, and grow your business with new opportunities.",
        icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
        features: ["Browse Requests", "Submit Bids", "Manage Inventory", "Performance Analytics"],
        gradient: "from-green-500/10 to-emerald-500/10",
        borderGradient: "from-green-500/20 to-emerald-500/20",
        iconBg: "bg-green-500/10",
        iconBorder: "border-green-500/20",
        iconColor: "text-green-500",
    },
    {
        role: "shipping_provider",
        title: "Shipping Provider",
        description: "Bid on shipments, manage deliveries, and provide logistics solutions for global trade.",
        icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
        features: ["Shipping Bids", "Delivery Tracking", "Route Management", "Performance Stats"],
        gradient: "from-orange-500/10 to-amber-500/10",
        borderGradient: "from-orange-500/20 to-amber-500/20",
        iconBg: "bg-orange-500/10",
        iconBorder: "border-orange-500/20",
        iconColor: "text-orange-500",
    },
    {
        role: "admin",
        title: "Admin",
        description: "Complete platform oversight with user management, analytics, and system configuration.",
        icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
        features: ["User Management", "Platform Analytics", "System Config", "Order Oversight"],
        gradient: "from-purple-500/10 to-pink-500/10",
        borderGradient: "from-purple-500/20 to-pink-500/20",
        iconBg: "bg-purple-500/10",
        iconBorder: "border-purple-500/20",
        iconColor: "text-purple-500",
    },
];

const RoleSelection = () => (
    <section className="bg-[#0A0806] py-[100px] relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="container relative z-10 px-6 mx-auto max-w-[1280px]">
            <div className="text-center mb-16">
                <h2 className="text-[36px] md:text-[48px] font-semibold text-white leading-[1.2] mb-4 tracking-tight">
                    Choose your role to <span className="text-[#D4710F]">get started</span>
                </h2>
                <p className="text-[#887766] text-[18px] md:text-[20px] max-w-[700px] mx-auto leading-[1.6]">
                    Select the role that best describes you and start your journey with SPACESHIPZ
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {roleCards.map((card, index) => (
                    <Link
                        key={index}
                        href={`/auth?role=${card.role}`}
                        className="group relative flex flex-col bg-[#110E0A] border border-white/10 rounded-[20px] overflow-hidden hover:border-[#D4710F]/50 transition-all duration-500 hover:scale-[1.02] cursor-pointer"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                        <div className="p-6 relative z-10">
                            <div className={`w-14 h-14 rounded-xl ${card.iconBg} border ${card.iconBorder} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                <SvgIcon d={card.icon} className={`w-7 h-7 ${card.iconColor}`} />
                            </div>

                            <h3 className="text-white text-[22px] font-semibold mb-3 tracking-tight group-hover:text-[#D4710F] transition-colors">
                                {card.title}
                            </h3>

                            <p className="text-[#887766] text-[14px] leading-relaxed mb-6 min-h-[60px]">
                                {card.description}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {card.features.map((feature, fIdx) => (
                                    <span key={fIdx} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-white/70">
                                        {feature}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 text-[#D4710F] text-[14px] font-semibold mt-4 group-hover:gap-3 transition-all">
                                <span>Get Started</span>
                                <ArrowRightIcon className="w-4 h-4" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    </section>
);

/* ═══════════════════════════════════════════════════════════
   5. FEATURES (Investment Strategies)
   ═══════════════════════════════════════════════════════════ */
const features = [
    { title: "Real-Time Bidding", description: "Buyers post requirements and receive competitive bids from FPOs, auctioneers, and farmers ranked by price." },
    { title: "RFQ System", description: "Create detailed Requests for Quotes, invite specific suppliers, compare quotes, and award contracts." },
    { title: "Integrated Shipping", description: "Shipping lines and freight forwarders bid on your shipments alongside product procurement." },
    { title: "Market Prices", description: "View real-time market prices, compare trends, and make data-driven procurement decisions." },
    { title: "Quality Grades & HSN", description: "Products cataloged with quality tiers, HSN codes, and Incoterms for tax-compliant global trade." },
];

const Features = () => (
    <section id="features" className="py-[100px] flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#FFFAF5" }}>
        <div className="max-w-[1280px] w-full text-center mb-12">
            <h2 className="text-[32px] md:text-[48px] font-semibold leading-[1.2] text-[#1A1207] mb-4 tracking-tight">
                Everything you need for <br className="hidden md:block" /><span className="text-[#D4710F]">global spice procurement</span>
            </h2>
            <p className="text-[16px] md:text-[18px] text-[#6B5A45] max-w-[700px] mx-auto leading-[1.6]">
                Our platform streamlines end-to-end B2B spice sourcing -- from competitive bidding to cross-border shipping -- all in one place.
            </p>
        </div>
        <div className="w-full max-w-[800px] mx-auto">
            <div className="flex flex-col border-t border-[#E8DDD0]">
                {features.map((feature, index) => (
                    <div key={index} className="group flex items-center justify-between py-6 md:py-8 border-b border-[#E8DDD0] cursor-pointer transition-all duration-300 hover:bg-white/50">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-12">
                            <h3 className="text-[20px] md:text-[24px] font-medium text-[#1A1207] min-w-[200px]">{feature.title}</h3>
                            <p className="hidden md:block text-[16px] text-[#6B5A45] opacity-0 group-hover:opacity-100 transition-opacity duration-300">{feature.description}</p>
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10">
                            <ArrowRightIcon className="w-6 h-6 text-[#D4710F] transform group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="mt-16">
            <Link href="/dashboard" className="btn-primary flex items-center gap-2">Explore the Platform</Link>
        </div>
    </section>
);

/* ═══════════════════════════════════════════════════════════
   5. TESTIMONIALS
   ═══════════════════════════════════════════════════════════ */
const testimonials = [
    {
        quote: "SPACESHIPZ transformed how we source spices. Instead of calling dozens of suppliers, we post one bid request and get competitive offers from verified sellers across India. Our procurement costs dropped significantly in the first quarter.",
        author: "Rajesh Mehta", role: "Head of Procurement, Food Processing Company", stat: "30%", statLabel: "Reduction in procurement costs",
    },
    {
        quote: "As a seller on the platform, we now have direct access to international buyers we never could have reached before. The bidding system is transparent, and the integrated shipping makes cross-border trade seamless.",
        author: "Priya Shankar", role: "Director, Spice Export FPO", stat: "5x", statLabel: "Increase in buyer reach",
    },
    {
        quote: "The RFQ system is a game-changer. We can specify exact quality grades, HSN codes, and Incoterms, then invite specific suppliers to bid. The entire process from sourcing to shipping is handled in one platform.",
        author: "Michael Torres", role: "Supply Chain Manager, European Distributor", stat: "60%", statLabel: "Faster procurement cycle",
    },
];

const Testimonials = () => {
    const [activeTab, setActiveTab] = useState(0);
    return (
        <section className="bg-[#FFFAF5] py-[100px] overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-[36px] md:text-[48px] font-semibold text-[#1A1207] leading-[1.2] mb-4 tracking-tight">
                        Why businesses choose <br /><span className="text-[#D4710F]">SPACESHIPZ</span>
                    </h2>
                    <p className="text-[#6B5A45] text-[18px] max-w-2xl mx-auto">From small importers to large food processors, our platform streamlines global spice procurement.</p>
                </div>

                <div className="relative max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row items-stretch gap-12 bg-white rounded-2xl p-8 md:p-16 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#E8DDD0]">
                        <div className="flex-1 text-left flex flex-col justify-between">
                            <div className="mb-8">
                                <p className="font-serif text-[24px] md:text-[28px] leading-[1.4] text-[#1A1207] italic font-medium">&ldquo;{testimonials[activeTab].quote}&rdquo;</p>
                            </div>
                            <div>
                                <div className="mb-8">
                                    <p className="text-[18px] font-bold text-[#1A1207]">{testimonials[activeTab].author}</p>
                                    <p className="text-[16px] text-[#6B5A45]">{testimonials[activeTab].role}</p>
                                </div>
                                <div className="border-t border-[#E8DDD0] pt-8">
                                    <p className="text-[40px] font-bold text-[#1A1207] leading-none mb-2">{testimonials[activeTab].stat}</p>
                                    <p className="text-[14px] uppercase tracking-wider font-semibold text-[#6B5A45]">{testimonials[activeTab].statLabel}</p>
                                </div>
                            </div>
                        </div>
                        <div className="w-full md:w-[350px] aspect-square bg-gradient-to-br from-[#D4710F]/5 to-[#C45D0A]/10 rounded-xl relative overflow-hidden flex items-center justify-center">
                            <div className="text-center p-8">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#D4710F]/10 border border-[#D4710F]/20 flex items-center justify-center">
                                    <SvgIcon d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" className="w-10 h-10 text-[#D4710F]" />
                                </div>
                                <p className="text-[#D4710F] font-bold text-lg">Real Results</p>
                                <p className="text-[#6B5A45] text-sm mt-1">Verified platform metrics</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-center items-center flex-wrap gap-4 md:gap-8">
                    {testimonials.map((t, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveTab(index)}
                            className={`relative pb-4 transition-all duration-300 flex flex-col items-center group ${activeTab === index ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
                        >
                            <div className="h-12 flex items-center px-4">
                                <span className="font-bold text-[16px] text-[#1A1207]">{t.author.split(" ")[0]}</span>
                            </div>
                            {activeTab === index && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D4710F] animate-in slide-in-from-left-0 duration-500" />}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════
   6. USER ROLES (Venture Capabilities)
   ═══════════════════════════════════════════════════════════ */
const roles = [
    {
        title: "Buyer", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
        description: "Browse items, place orders, create bid requests & RFQs, compare quotes from multiple sellers, and track orders from placement to delivery.",
        features: ["Post Bid Requests", "RFQ System", "Compare Quotes", "Order Tracking", "Market Prices", "Dashboard & Analytics"], gridSpan: "md:col-span-2",
    },
    {
        title: "Seller", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
        description: "Access active buyer requests, submit competitive bids, manage inventory, respond to RFQ invitations, and track earnings.",
        features: ["Browse Requests", "Submit Bids", "Manage Inventory", "RFQ Responses", "Performance Stats"], gridSpan: "md:col-span-1",
    },
    {
        title: "Shipping Provider", icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
        description: "View accepted orders, submit shipping bids with delivery estimates, track shipment status, and manage delivery schedules.",
        features: ["Shipping Bids", "Delivery Tracking", "Schedule Management", "Performance Dashboard"], gridSpan: "md:col-span-1",
    },
    {
        title: "Admin", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
        description: "Complete platform oversight with item management, order monitoring, user management, bid oversight, and analytics.",
        features: ["Platform Analytics", "User Management", "Item CRUD", "Order Oversight", "Bid Monitoring"], gridSpan: "md:col-span-1",
    },
];

const UserRoles = () => (
    <section className="bg-[#0A0806] py-[100px] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
            <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-[#D4710F] blur-[150px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] bg-[#C45D0A] blur-[150px] rounded-full" />
        </div>
        <div className="container relative z-10 px-6 mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
                <div className="max-w-[700px]">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-sm flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                            <span className="text-white text-[12px] font-bold tracking-wider uppercase">4 User Roles</span>
                        </span>
                        <span className="bg-[#D4710F] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-tight">Live</span>
                    </div>
                    <h2 className="text-white text-4xl md:text-[48px] font-semibold leading-[1.2] mb-6 tracking-tight">One platform, <br className="hidden md:block" /> four powerful roles</h2>
                    <p className="text-[#887766] text-lg md:text-xl font-medium max-w-[600px] leading-relaxed">Whether you are buying, selling, shipping, or managing -- SPACESHIPZ gives every participant the tools they need to operate efficiently.</p>
                </div>
                <Link href="/dashboard" className="bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all text-white px-8 py-3 rounded-full font-semibold text-sm">Get Started</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roles.map((item, index) => (
                    <div key={index} className={`${item.gridSpan} group relative flex flex-col bg-[#110E0A] border border-white/10 rounded-[20px] overflow-hidden hover:border-[#D4710F]/50 transition-all duration-500`}>
                        <div className="p-8 relative z-20">
                            <div className="w-12 h-12 rounded-xl bg-[#D4710F]/10 border border-[#D4710F]/20 flex items-center justify-center mb-5">
                                <SvgIcon d={item.icon} className="w-6 h-6 text-[#D4710F]" />
                            </div>
                            <h3 className="text-white text-[22px] font-semibold mb-3 tracking-tight group-hover:text-[#D4710F] transition-colors">{item.title}</h3>
                            <p className="text-[#887766] text-[15px] leading-relaxed mb-6">{item.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {item.features.map((feature, fIdx) => (
                                    <span key={fIdx} className="px-3 py-1 rounded-full text-[12px] font-medium bg-white/5 border border-white/10 text-white/70">{feature}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

/* ═══════════════════════════════════════════════════════════
   7. STATS (Investment Impact)
   ═══════════════════════════════════════════════════════════ */
const stats = [
    { value: "500+", label: "Verified Suppliers", description: "FPOs, auctioneers, farmers, and exporters across India" },
    { value: "50+", label: "Countries Connected", description: "Cross-border procurement and shipping worldwide" },
    { value: "10K+", label: "Orders Processed", description: "From bid to delivery, fully managed on platform" },
];

const Stats = () => (
    <section className="bg-[#0A0806] text-white py-[100px] overflow-hidden relative">
        <div className="container px-6 mx-auto relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-16">
                <div className="max-w-2xl">
                    <h2 className="text-[32px] md:text-[48px] font-semibold leading-[1.2] tracking-[-0.02em] text-white mb-4">
                        Procurement made powerful <br />enough to scale, simple enough to start.
                    </h2>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-16">
                {stats.map((stat, index) => (
                    <div key={index} className="flex flex-col space-y-2">
                        <div className="text-[40px] md:text-[56px] font-bold leading-[1.1] tracking-tight text-white mb-2">{stat.value}</div>
                        <div className="text-[18px] md:text-[20px] font-medium text-white mb-1">{stat.label}</div>
                        <p className="text-[14px] md:text-[16px] text-[#887766] leading-[1.6]">{stat.description}</p>
                    </div>
                ))}
            </div>
            <div className="mt-8">
                <Link href="/dashboard" className="bg-[#D4710F] text-white px-8 py-3 rounded-full font-semibold text-[15px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(212,113,15,0.2)] hover:shadow-[0_0_30px_rgba(212,113,15,0.3)]">
                    Start Sourcing Today
                </Link>
            </div>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-20" style={{ background: "radial-gradient(circle, rgba(212, 113, 15, 0.15) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#FFFFFF 1px, transparent 1px), linear-gradient(90deg, #FFFFFF 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
    </section>
);

/* ═══════════════════════════════════════════════════════════
   8. HOW IT WORKS (Ecosystem Integration)
   ═══════════════════════════════════════════════════════════ */
const steps = [
    { number: "01", title: "Post Your Requirement", description: "Buyers create a bid request or RFQ with product details, quantity, quality grade, and delivery preferences.", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
    { number: "02", title: "Suppliers Bid Competitively", description: "Verified sellers -- FPOs, auctioneers, farmers, exporters -- submit competitive bids ranked by price.", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    { number: "03", title: "Compare & Award", description: "Buyers compare bids side-by-side, review supplier profiles, and award the contract to the best offer.", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { number: "04", title: "Shipping Providers Bid", description: "Freight forwarders and shipping lines bid on logistics, ensuring the best shipping rates alongside product pricing.", icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" },
    { number: "05", title: "Track & Deliver", description: "Monitor the entire order lifecycle from confirmation through shipment to final delivery -- all on one platform.", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
];

const HowItWorks = () => (
    <section className="bg-[#FFFAF5] py-[100px] overflow-hidden">
        <div className="container mx-auto px-6 max-w-[1280px]">
            <div className="text-center mb-[60px]">
                <h2 className="text-[36px] md:text-[48px] font-semibold text-[#1A1207] leading-[1.2] tracking-tight mb-4">
                    How <span className="text-[#D4710F]">SPACESHIPZ</span> works
                </h2>
                <p className="max-w-[700px] mx-auto text-[16px] md:text-[18px] text-[#6B5A45] leading-[1.6]">From requirement to delivery, our platform streamlines every step of global B2B spice procurement.</p>
            </div>
            <div className="relative max-w-[900px] mx-auto">
                <div className="absolute left-[28px] md:left-[32px] top-0 bottom-0 w-px bg-gradient-to-b from-[#D4710F]/30 via-[#D4710F]/20 to-transparent hidden sm:block" />
                <div className="flex flex-col gap-10">
                    {steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-6 md:gap-8 group">
                            <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#D4710F]/10 border border-[#D4710F]/20 flex items-center justify-center relative z-10 group-hover:bg-[#D4710F]/20 transition-colors">
                                <SvgIcon d={step.icon} className="w-6 h-6 md:w-7 md:h-7 text-[#D4710F]" />
                            </div>
                            <div className="pt-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[12px] font-bold text-[#D4710F] tracking-wider">{step.number}</span>
                                    <h3 className="text-[20px] md:text-[24px] font-semibold text-[#1A1207] tracking-tight">{step.title}</h3>
                                </div>
                                <p className="text-[15px] md:text-[16px] text-[#6B5A45] leading-[1.6] max-w-[600px]">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-16 text-center">
                <Link href="/dashboard" className="btn-primary flex items-center gap-2 mx-auto">Start Sourcing Today</Link>
            </div>
        </div>
    </section>
);

/* ═══════════════════════════════════════════════════════════
   9. FAQ
   ═══════════════════════════════════════════════════════════ */
interface FAQItem { question: string; answer: string | React.ReactNode; }

const faqData: FAQItem[] = [
    { question: "What is SPACESHIPZ?", answer: "SPACESHIPZ is a digital B2B marketplace that simplifies global spice procurement. We connect buyers with verified suppliers -- FPOs, auctioneers, farmers, and exporters -- through a real-time bidding system, while integrating cross-border shipping to streamline sourcing and delivery." },
    {
        question: "How does the bidding system work?",
        answer: (
            <div className="space-y-4">
                <p>Our bidding system ensures you get the best price from a wide range of suppliers:</p>
                <ol className="list-decimal pl-5 space-y-2">
                    <li><strong>Post a Bid Request</strong>: Enter your product details -- spice type, quantity, quality grade, and delivery requirements.</li>
                    <li><strong>Receive Bids</strong>: Verified suppliers submit competitive bids ranked by price.</li>
                    <li><strong>Compare & Award</strong>: Review bids side-by-side, check supplier profiles, and award the contract.</li>
                    <li><strong>Shipping Bids</strong>: Freight forwarders bid on logistics for your order simultaneously.</li>
                    <li><strong>Track Delivery</strong>: Monitor from confirmation to final delivery on one platform.</li>
                </ol>
            </div>
        ),
    },
    { question: "What products are available on the platform?", answer: "Our platform covers a wide range of agricultural commodities with a focus on spices (turmeric, black pepper, cardamom, cumin, etc.), pulses and grains, and dry fruits. All products are cataloged with HSN codes, quality grades, and Incoterms for tax-compliant global trade." },
    { question: "How does integrated shipping work?", answer: "When an order is confirmed, shipping lines and freight forwarders can bid on your shipment. You receive competitive logistics quotes alongside product pricing, so you secure the best rates for both the product and delivery. We support cross-border shipping with real-time tracking." },
    {
        question: "What is the RFQ (Request for Quote) system?",
        answer: (
            <div className="space-y-4">
                <p>The RFQ system allows buyers to create detailed requirements and invite specific suppliers:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Create RFQs with custom specifications and quantity requirements</li>
                    <li>Invite specific suppliers via unique invite links (no login required for suppliers)</li>
                    <li>Collect and compare multiple quotes in one dashboard</li>
                    <li>Award contracts to the winning supplier</li>
                    <li>Track RFQ status from open through to awarded</li>
                </ul>
            </div>
        ),
    },
    { question: "Who can sell on SPACESHIPZ?", answer: "Seller accounts are created by our admin team to ensure quality and trust. We onboard verified FPOs (Farmer Producer Organizations), auctioneers, farmers, exporters, and established spice traders. Sellers can manage inventory, submit bids, respond to RFQs, and track performance analytics." },
    { question: "What Incoterms are supported?", answer: "We support all major Incoterms for international trade including FOB (Free on Board), CIF (Cost, Insurance, and Freight), EXW (Ex Works), and DDP (Delivered Duty Paid). This ensures clarity on costs, risks, and responsibilities between buyers and sellers across borders." },
    { question: "How do I get started?", answer: "Getting started is simple. Sign up as a buyer to browse products, post bid requests, or create RFQs. If you are a seller or shipping provider, contact us at rendu@morrenventures.com or call +91-8217785175 to set up your account. Our admin team will verify and onboard you." },
];

const AccordionItem = ({ item, isOpen, onClick }: { item: FAQItem; isOpen: boolean; onClick: () => void }) => (
    <div className="border-b border-[#E8DDD0]">
        <button onClick={onClick} className="w-full py-[24px] flex items-center justify-between text-left group transition-all" aria-expanded={isOpen}>
            <span className="text-[16px] font-semibold text-[#1A1207] leading-[1.4] transition-colors group-hover:text-[#D4710F]">{item.question}</span>
            <PlusIcon className={cn("w-[18px] h-[18px] text-[#6B5A45] transition-transform duration-300 flex-shrink-0 ml-4", isOpen && "rotate-45")} />
        </button>
        <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isOpen ? "max-h-[500px] pb-[24px]" : "max-h-0")}>
            <div className="text-[15px] text-[#6B5A45] leading-[1.6]">{item.answer}</div>
        </div>
    </div>
);

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);
    return (
        <section className="bg-[#FFFAF5] py-[100px] border-t border-[#E8DDD0]">
            <div className="container px-6 mx-auto">
                <div className="text-center mb-[60px]">
                    <h2 className="text-[36px] md:text-[48px] font-semibold text-[#1A1207] leading-[1.2] mb-4 tracking-tight">Frequently asked questions</h2>
                    <p className="text-[16px] md:text-[18px] text-[#6B5A45] font-medium">Everything you need to know about sourcing with SPACESHIPZ</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[32px]">
                    <div className="space-y-0">
                        {faqData.filter((_, idx) => idx % 2 === 0).map((item, idx) => {
                            const actualIndex = idx * 2;
                            return <AccordionItem key={actualIndex} item={item} isOpen={openIndex === actualIndex} onClick={() => toggle(actualIndex)} />;
                        })}
                    </div>
                    <div className="space-y-0">
                        {faqData.filter((_, idx) => idx % 2 !== 0).map((item, idx) => {
                            const actualIndex = idx * 2 + 1;
                            return <AccordionItem key={actualIndex} item={item} isOpen={openIndex === actualIndex} onClick={() => toggle(actualIndex)} />;
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════
   10. CTA
   ═══════════════════════════════════════════════════════════ */
const CTA = () => (
    <section className="relative w-full overflow-hidden bg-[#0A0806] py-[100px] text-white">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] z-0 opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(212, 113, 15, 0.2) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="container relative z-10 px-6 mx-auto max-w-[1280px] text-center">
            <h2 className="text-[36px] md:text-[48px] lg:text-[56px] leading-[1.2] font-semibold tracking-tight text-white text-balance max-w-[800px] mx-auto mb-6">Ready to transform your spice procurement?</h2>
            <p className="text-[#887766] text-[18px] md:text-[20px] max-w-[600px] mx-auto leading-[1.5] mb-10">Join businesses worldwide who source smarter, ship faster, and save more with SPACESHIPZ.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard" className="btn-primary text-[15px] !py-4 !px-10">Get Started Free</Link>
                <a href="mailto:rendu@morrenventures.com" className="text-white/80 hover:text-white border border-white/10 hover:border-white/20 px-8 py-4 rounded-full font-semibold text-[15px] transition-all">Contact Sales</a>
            </div>
            <div className="mt-16 flex flex-wrap justify-center items-center gap-x-12 gap-y-4 text-[#887766] text-[14px]">
                <span>rendu@morrenventures.com</span>
                <span className="hidden sm:inline">|</span>
                <span>+91-8217785175</span>
            </div>
        </div>
    </section>
);

/* ═══════════════════════════════════════════════════════════
   11. FOOTER
   ═══════════════════════════════════════════════════════════ */
const footerLinks: Record<string, { name: string; href: string }[]> = {
    Marketplace: [
        { name: "For Buyers", href: "#" }, { name: "For Sellers", href: "#" }, { name: "Shipping Providers", href: "#" }, { name: "RFQ System", href: "#" }, { name: "Market Prices", href: "#" },
    ],
    Products: [
        { name: "Spices", href: "#" }, { name: "Pulses & Grains", href: "#" }, { name: "Dry Fruits", href: "#" }, { name: "Quality Grades", href: "#" },
    ],
    Company: [
        { name: "About Us", href: "#about" }, { name: "Contact", href: "#contact" }, { name: "Careers", href: "#" },
    ],
    Resources: [
        { name: "How It Works", href: "#" }, { name: "FAQ", href: "#" }, { name: "Incoterms Guide", href: "#" }, { name: "HSN Codes", href: "#" },
    ],
};

const socials = [
    { icon: <MailIcon className="w-[18px] h-[18px]" />, href: "mailto:rendu@morrenventures.com" },
    { icon: <PhoneIcon className="w-[18px] h-[18px]" />, href: "tel:+918217785175" },
    { icon: <LinkedinIcon className="w-[18px] h-[18px]" />, href: "#" },
    { icon: <TwitterIcon className="w-[18px] h-[18px]" />, href: "#" },
];

const Footer = () => (
    <footer className="bg-[#0A0806] text-white pt-[100px] border-t border-white/10 relative overflow-hidden">
        <div className="container px-6 md:px-12 mx-auto max-w-[1280px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 pb-16">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">S</span>
                        </div>
                        <span className="text-2xl font-semibold tracking-tight">SPACESHIPZ</span>
                    </div>
                    <p className="text-[#887766] text-[15px] leading-relaxed max-w-[300px]">Digitizing global B2B spice procurement with seamless cross-border shipping integration. Connecting suppliers and buyers across borders with ease.</p>
                    <div className="space-y-2 text-[14px] text-[#887766]">
                        <p>rendu@morrenventures.com</p>
                        <p>+91-8217785175</p>
                    </div>
                    <div className="flex gap-3">
                        {socials.map((social, idx) => (
                            <a key={idx} href={social.href} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#887766] hover:text-white hover:bg-white/10 transition-all">{social.icon}</a>
                        ))}
                    </div>
                </div>
                {Object.entries(footerLinks).map(([title, links]) => (
                    <div key={title} className="flex flex-col gap-5">
                        <h3 className="text-white font-bold text-[14px] uppercase tracking-wider">{title}</h3>
                        <ul className="flex flex-col gap-3">
                            {links.map((link) => (
                                <li key={link.name}><a href={link.href} className="text-[#887766] hover:text-white text-[15px] transition-colors duration-200">{link.name}</a></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="border-t border-white/5 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-[#887766] text-[13px]">&copy; 2026 SPACESHIPZ by Morren Ventures. All rights reserved.</div>
                <div className="flex flex-wrap justify-center gap-6 text-[#887766] text-[13px]">
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
                    <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
                </div>
            </div>
        </div>
    </footer>
);

/* ═══════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════ */
export default function Home() {
    return (
        <>
            <Header />
            <Hero />
            <TrustedBy />
            <RoleSelection />
            <Features />
            <Testimonials />
            <UserRoles />
            <Stats />
            <HowItWorks />
            <FAQ />
            <CTA />
            <Footer />
        </>
    );
}