"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

/* ─────────────── Icons ─────────────── */
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
const SvgIcon = ({ d, className, style }: { d: string; className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
        <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled ? "py-3" : "py-5"}`}>
            <div className="container mx-auto px-4 sm:px-6">
                <nav
                    className="flex items-center justify-between rounded-full px-4 sm:px-6 h-[60px] sm:h-[70px]"
                    style={{ backgroundColor: "rgba(5,5,5,0.92)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,200,83,0.2)" }}
                >
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <a href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center"
                                style={{ boxShadow: "0 0 12px rgba(0,200,83,0.5)" }}>
                                <span className="text-white font-bold text-sm">S</span>
                            </div>
                            <span className="text-white text-base sm:text-lg font-semibold tracking-tight">SPACESHIPZ</span>
                        </a>
                    </div>

                    {/* Desktop nav */}
                    <ul className="hidden lg:flex items-center gap-6 xl:gap-8 h-full">
                        {navItems.map((item) => (
                            <li
                                key={item.label}
                                className="relative group h-full flex items-center"
                                onMouseEnter={() => item.type === "mega" && setActiveDropdown(item.id)}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                {item.type === "mega" ? (
                                    <button className="flex items-center gap-1.5 text-[14px] font-medium text-white/80 hover:text-[#00C853] transition-colors">
                                        {item.label}
                                        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === item.id ? "rotate-180" : ""}`} />
                                    </button>
                                ) : (
                                    <a href={item.href} className="text-[14px] font-medium text-white/80 hover:text-[#00C853] transition-colors">{item.label}</a>
                                )}

                                {item.type === "mega" && activeDropdown === item.id && (
                                    <div className="absolute top-[100%] left-1/2 -translate-x-1/2 pt-4"
                                        style={{ width: "min(800px, calc(100vw - 32px))", maxWidth: "800px" }}>
                                        <div
                                            className="rounded-3xl overflow-hidden p-6 xl:p-8 flex gap-8 shadow-2xl"
                                            style={{ background: "rgba(5,5,5,0.97)", backdropFilter: "blur(40px)", border: "1px solid rgba(0,200,83,0.2)" }}
                                        >
                                            {item.sections?.map((section, idx) => (
                                                <div key={idx} className={`flex-1 ${idx < (item.sections?.length || 0) - 1 ? "border-r border-white/10 pr-8" : ""}`}>
                                                    <h4 className="text-[12px] font-bold text-white/40 uppercase tracking-widest mb-5 px-1">{section.title}</h4>
                                                    <div className="grid gap-5">
                                                        {section.items?.map((subItem) => (
                                                            <a key={subItem.name} href={subItem.href} className="group/item block">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <p className="text-white font-bold text-[14px] group-hover/item:text-[#00C853] transition-colors">{subItem.name}</p>
                                                                    {subItem.tag && (
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00C853]/20 text-[#00C853] uppercase">{subItem.tag}</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-white/50 text-[12px] leading-snug">{subItem.desc}</p>
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

                    {/* Right actions */}
                    <div className="flex items-center gap-3">
                        <a href="mailto:rendu@morrenventures.com" className="hidden xl:flex items-center gap-2 text-white/70 hover:text-[#00C853] transition-colors">
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10">
                                <PhoneIcon className="w-4 h-4" />
                            </div>
                            <span className="text-[13px] font-medium">Contact Us</span>
                        </a>
                        <Link href="/dashboard" className="btn-primary text-[14px] !py-2.5 !px-6 h-[42px]">Get Started</Link>
                        <button className="lg:hidden p-2 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
                            {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </nav>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-x-0 top-[80px] bottom-0 z-50 overflow-y-auto"
                    style={{ backgroundColor: "rgba(5,5,5,0.97)", backdropFilter: "blur(20px)" }}>
                    <div className="px-6 py-8">
                        <ul className="space-y-6">
                            {navItems.map((item) => (
                                <li key={item.label}>
                                    {item.type === "mega" ? (
                                        <div className="space-y-3">
                                            <p className="text-[#00C853]/70 text-[11px] font-bold uppercase tracking-widest px-2">{item.label}</p>
                                            <div className="grid gap-3 pl-2">
                                                {item.sections?.flatMap((s) => s.items || []).slice(0, 5).map((sub) => (
                                                    <a key={sub.name} href={sub.href} className="block text-white text-[15px] font-medium hover:text-[#00C853] transition-colors" onClick={() => setMobileMenuOpen(false)}>{sub.name}</a>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <a href={item.href} className="block text-white text-[18px] font-semibold px-2 hover:text-[#00C853] transition-colors" onClick={() => setMobileMenuOpen(false)}>{item.label}</a>
                                    )}
                                </li>
                            ))}
                            <li className="pt-6 border-t border-white/10">
                                <a href="mailto:rendu@morrenventures.com" className="flex items-center gap-3 text-white px-2 hover:text-[#00C853] transition-colors">
                                    <PhoneIcon className="w-5 h-5 text-[#00C853]" />
                                    <span className="text-[16px] break-all">rendu@morrenventures.com</span>
                                </a>
                            </li>
                            <li>
                                <Link href="/dashboard" className="btn-primary w-full text-center block !py-3" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
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
    <section className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center pt-[80px] pb-16 sm:pb-24" style={{ backgroundColor: "#050505" }}>
        {/* Radial green glow */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(0,200,83,0.18) 0%, rgba(5,5,5,1) 65%)" }} />
        <div className="absolute top-[-80px] left-[-150px] w-[600px] h-[600px] opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,200,83,0.1) 0%, transparent 70%)" }} />
        <div className="absolute top-[5%] right-[-200px] w-[500px] h-[500px] opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,200,83,0.08) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 z-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #00C853 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="container relative z-10 px-4 sm:px-6 mx-auto text-center w-full">
            <div className="max-w-4xl mx-auto flex flex-col items-center">
                {/* Live badge */}
                <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full border"
                    style={{ backgroundColor: "rgba(0,200,83,0.08)", borderColor: "rgba(0,200,83,0.25)" }}>
                    <span className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse" />
                    <span className="text-[#00C853] text-[11px] sm:text-[12px] font-bold tracking-widest uppercase">Global Spice Market Live</span>
                </div>

                <h1 className="font-serif text-white text-balance tracking-tight leading-[1.1] mb-6 font-medium text-[36px] sm:text-[48px] md:text-[58px] lg:text-[66px]">
                    Digitizing Global B2B <br className="hidden sm:block" />
                    <span className="italic" style={{ color: "#00C853" }}>Spice</span> Procurement
                </h1>
                <p className="text-[#888] text-[15px] sm:text-[17px] md:text-[19px] max-w-2xl leading-[1.55] mb-10 px-2">
                    What if businesses in the spice industry could instantly access the best prices — not just from a handful of suppliers, but from hundreds of sources globally? Our real-time bidding platform connects buyers with FPOs, auctioneers, and farmers worldwide.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
                    <Link href="/dashboard" className="btn-primary group flex items-center gap-2 text-[15px] w-full sm:w-auto justify-center">
                        Start Sourcing
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                    <a href="#features" className="text-white/70 hover:text-white border border-white/10 hover:border-[#00C853]/40 px-8 py-3.5 rounded-full font-semibold text-[15px] transition-all w-full sm:w-auto text-center">
                        Explore Platform
                    </a>
                </div>
            </div>

            {/* Stats */}
            <div className="mt-4 w-full">
                <p className="text-[11px] sm:text-[12px] font-semibold tracking-[0.15em] text-[#888] uppercase mb-8">India contributes 45% of the global spice supply</p>
                <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-8 sm:gap-x-16">
                    <div className="text-center">
                        <p className="text-[28px] sm:text-[36px] md:text-[42px] font-bold text-white leading-none mb-1">$12B+</p>
                        <p className="text-[11px] sm:text-[12px] text-[#888] uppercase tracking-wider">Global Spice Market</p>
                    </div>
                    <div className="w-px h-10 bg-white/10 hidden sm:block" />
                    <div className="text-center">
                        <p className="text-[28px] sm:text-[36px] md:text-[42px] font-bold text-white leading-none mb-1">45%</p>
                        <p className="text-[11px] sm:text-[12px] text-[#888] uppercase tracking-wider">India&apos;s Export Share</p>
                    </div>
                    <div className="w-px h-10 bg-white/10 hidden sm:block" />
                    <div className="text-center">
                        <p className="text-[28px] sm:text-[36px] md:text-[42px] font-bold text-white leading-none mb-1">100+</p>
                        <p className="text-[11px] sm:text-[12px] text-[#888] uppercase tracking-wider">Countries Served</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

/* ═══════════════════════════════════════════════════════════
   3. TRUSTED BY
   ═══════════════════════════════════════════════════════════ */
const TrustedBy = () => {
    const highlights = [
        { label: "Seamless Cross-Border Shipping", icon: "M20 12H4m8-8l8 8-8 8" },
        { label: "Real-Time Competitive Bidding", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
        { label: "Verified Supplier Network", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
        { label: "HSN & Incoterms Compliant", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    ];
    return (
        <section className="py-14 sm:py-20 relative overflow-hidden border-t border-b" style={{ backgroundColor: "#071A10", borderColor: "rgba(0,200,83,0.1)" }}>
            <div className="container mx-auto px-4 sm:px-6 max-w-[1280px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {highlights.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border"
                            style={{ border: "1px solid rgba(0,200,83,0.15)", backgroundColor: "rgba(0,200,83,0.04)" }}>
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: "rgba(0,200,83,0.1)", border: "1px solid rgba(0,200,83,0.25)" }}>
                                <SvgIcon d={item.icon} className="w-4 h-4 sm:w-5 sm:h-5 text-[#00C853]" />
                            </div>
                            <span className="text-white/80 text-[13px] sm:text-[14px] font-medium leading-snug">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════
   4. PRICE HISTORY CHART  (same data as mobile app)
   ═══════════════════════════════════════════════════════════ */
const HISTORICAL_DATA = [
    { date: "Nov'14", price: 765.73 }, { date: "Jan'15", price: 861.93 }, { date: "May'15", price: 662.12 },
    { date: "Jul'15", price: 638.64 }, { date: "Oct'15", price: 614.37 }, { date: "Dec'15", price: 592.20 },
    { date: "Jan'16", price: 584.55 }, { date: "Mar'16", price: 535.67 }, { date: "Jun'16", price: 742.18 },
    { date: "Aug'16", price: 914.41 }, { date: "Oct'16", price: 1027.76 }, { date: "Dec'16", price: 1203.22 },
    { date: "Jan'17", price: 1351.21 }, { date: "Mar'17", price: 1195.88 }, { date: "Jun'17", price: 947.62 },
    { date: "Aug'17", price: 1076.91 }, { date: "Nov'17", price: 853.94 }, { date: "Jan'18", price: 965.71 },
    { date: "Apr'18", price: 891.94 }, { date: "Jul'18", price: 1017.13 }, { date: "Sep'18", price: 1265.74 },
    { date: "Dec'18", price: 1314.46 }, { date: "Jan'19", price: 1446.06 }, { date: "Apr'19", price: 1881.51 },
    { date: "Jun'19", price: 2847.08 }, { date: "Aug'19", price: 3358.20 }, { date: "Oct'19", price: 2597.00 },
    { date: "Dec'19", price: 3167.29 }, { date: "Jan'20", price: 3777.26 }, { date: "Mar'20", price: 2652.97 },
    { date: "Jun'20", price: 1537.18 }, { date: "Sep'20", price: 1628.42 }, { date: "Dec'20", price: 1732.33 },
    { date: "Jan'21", price: 1606.82 }, { date: "May'21", price: 987.07 }, { date: "Aug'21", price: 1058.69 },
    { date: "Dec'21", price: 936.99 }, { date: "Jan'22", price: 879.57 }, { date: "May'22", price: 809.46 },
    { date: "Sep'22", price: 990.53 }, { date: "Dec'22", price: 855.22 }, { date: "Jan'23", price: 1006.29 },
    { date: "Mar'23", price: 1393.07 }, { date: "Jul'23", price: 1385.59 }, { date: "Sep'23", price: 1830.33 },
    { date: "Dec'23", price: 1629.49 }, { date: "Jan'24", price: 1641.90 }, { date: "Apr'24", price: 1782.96 },
    { date: "Jun'24", price: 2357.63 }, { date: "Sep'24", price: 2279.50 }, { date: "Dec'24", price: 2912.86 },
    { date: "Jan'25", price: 3053.71 }, { date: "Mar'25", price: 2696.95 }, { date: "Jun'25", price: 2469.49 },
    { date: "Sep'25", price: 2496.36 }, { date: "Dec'25", price: 2417.03 }, { date: "Jan'26", price: 2485.83 },
    { date: "Mar'26", price: 2303.10 },
];

const RANGE_OPTIONS = [
    { label: "All", months: 0 },
    { label: "5Y", months: 60 },
    { label: "3Y", months: 36 },
    { label: "1Y", months: 12 },
];

function formatINR(val: number) {
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${Math.round(val)}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const price = payload[0]?.value ?? 0;
    return (
        <div className="rounded-xl px-4 py-3 text-sm shadow-xl"
            style={{ backgroundColor: "rgba(7,26,16,0.97)", border: "1.5px solid rgba(0,200,83,0.5)" }}>
            <p className="text-[#888] text-[11px] font-semibold mb-1">{label}</p>
            <p className="font-bold text-[16px]" style={{ color: "#00C853" }}>
                ₹{price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/kg
            </p>
        </div>
    );
};

const PriceHistory = () => {
    const [range, setRange] = useState(0);

    const filtered = useMemo(() => {
        if (range === 0) return HISTORICAL_DATA;
        return HISTORICAL_DATA.slice(-range);
    }, [range]);

    const currentPrice = HISTORICAL_DATA[HISTORICAL_DATA.length - 1].price;
    const firstPrice = filtered[0]?.price ?? currentPrice;
    const pctChange = ((currentPrice - firstPrice) / firstPrice) * 100;
    const isUp = pctChange >= 0;

    // Stats
    const maxPrice = useMemo(() => Math.max(...filtered.map(d => d.price)), [filtered]);
    const minPrice = useMemo(() => Math.min(...filtered.map(d => d.price)), [filtered]);

    return (
        <section className="py-16 sm:py-24 relative overflow-hidden" style={{ backgroundColor: "#050505" }}>
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: "radial-gradient(circle, #00C853 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

            <div className="container mx-auto px-4 sm:px-6 max-w-[1280px] relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#00C853" }} />
                            <span className="text-[11px] sm:text-[12px] font-bold tracking-widest uppercase" style={{ color: "#00C853" }}>Cardamom Price History</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                style={{ backgroundColor: "rgba(0,200,83,0.15)", color: "#00C853", border: "1px solid rgba(0,200,83,0.3)" }}>Live</span>
                        </div>
                        <h2 className="text-white text-[26px] sm:text-[32px] md:text-[40px] font-semibold leading-[1.2] tracking-tight">
                            Global Cardamom Price Index
                        </h2>
                        <p className="text-[#888] text-[14px] sm:text-[15px] mt-2 max-w-lg">
                            Monthly average prices (₹/kg) from 2014 to present. Same data as the mobile app.
                        </p>
                    </div>

                    {/* Range filters */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {RANGE_OPTIONS.map((opt) => (
                            <button
                                key={opt.label}
                                onClick={() => setRange(opt.months)}
                                className="px-3 sm:px-4 py-2 rounded-full text-[12px] sm:text-[13px] font-bold transition-all"
                                style={range === opt.months
                                    ? { backgroundColor: "#00C853", color: "#fff", boxShadow: "0 0 12px rgba(0,200,83,0.4)" }
                                    : { backgroundColor: "rgba(0,200,83,0.08)", color: "#888", border: "1px solid rgba(0,200,83,0.2)" }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
                    {[
                        { label: "Current Price", value: `₹${currentPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, sub: "per kg", color: "#00C853" },
                        { label: "Period High", value: `₹${maxPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, sub: "per kg", color: "#4FC3F7" },
                        { label: "Period Low", value: `₹${minPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, sub: "per kg", color: "#FF8A65" },
                        { label: "Change", value: `${isUp ? "+" : ""}${pctChange.toFixed(1)}%`, sub: "over period", color: isUp ? "#00C853" : "#FF4444" },
                    ].map((s, i) => (
                        <div key={i} className="rounded-2xl p-3 sm:p-4"
                            style={{ backgroundColor: "rgba(0,200,83,0.04)", border: "1px solid rgba(0,200,83,0.12)" }}>
                            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#888] mb-1">{s.label}</p>
                            <p className="text-[18px] sm:text-[22px] font-bold leading-none" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-[10px] text-[#666] mt-0.5">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Chart */}
                <div className="rounded-2xl overflow-hidden p-3 sm:p-5"
                    style={{ backgroundColor: "#071A10", border: "1px solid rgba(0,200,83,0.15)" }}>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={filtered} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#00C853" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#00C853" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,200,83,0.08)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: "#666", fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                interval={Math.max(0, Math.floor(filtered.length / 8) - 1)}
                            />
                            <YAxis
                                tick={{ fill: "#666", fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                width={52}
                                tickFormatter={formatINR}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="price"
                                stroke="#00C853"
                                strokeWidth={2.5}
                                fill="url(#greenGrad)"
                                dot={false}
                                activeDot={{ r: 5, fill: "#00C853", stroke: "#071A10", strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                    <p className="text-center text-[10px] sm:text-[11px] text-[#555] mt-3">
                        Hover/touch to explore prices · Data source: Cardamom auction markets across India
                    </p>
                </div>
            </div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════
   5. ROLE SELECTION
   ═══════════════════════════════════════════════════════════ */
const roleCards = [
    {
        role: "buyer",
        title: "Buyer",
        description: "Post bid requests, compare quotes from suppliers, and manage your procurement efficiently.",
        icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
        features: ["Post Bid Requests", "Compare Quotes", "Order Tracking", "Market Insights"],
        accentColor: "#4FC3F7",
    },
    {
        role: "seller",
        title: "Seller",
        description: "Access buyer requests, submit competitive bids, and grow your business with new opportunities.",
        icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
        features: ["Browse Requests", "Submit Bids", "Manage Inventory", "Performance Analytics"],
        accentColor: "#00C853",
    },
    {
        role: "shipping_provider",
        title: "Shipping Provider",
        description: "Bid on shipments, manage deliveries, and provide logistics solutions for global trade.",
        icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
        features: ["Shipping Bids", "Delivery Tracking", "Route Management", "Performance Stats"],
        accentColor: "#FFB74D",
    },
    {
        role: "admin",
        title: "Admin",
        description: "Complete platform oversight with user management, analytics, and system configuration.",
        icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
        features: ["User Management", "Platform Analytics", "System Config", "Order Oversight"],
        accentColor: "#CE93D8",
    },
];

const RoleSelection = () => (
    <section className="py-16 sm:py-[100px] relative overflow-hidden" style={{ backgroundColor: "#071A10" }}>
        <div className="absolute inset-0 z-0 opacity-[0.025] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, #00C853 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
        <div className="container relative z-10 px-4 sm:px-6 mx-auto max-w-[1280px]">
            <div className="text-center mb-10 sm:mb-16">
                <h2 className="text-[28px] sm:text-[38px] md:text-[48px] font-semibold text-white leading-[1.2] mb-4 tracking-tight">
                    Choose your role to <span style={{ color: "#00C853" }}>get started</span>
                </h2>
                <p className="text-[#888] text-[15px] sm:text-[17px] md:text-[19px] max-w-[600px] mx-auto leading-[1.6]">
                    Select the role that best describes you and start your journey with SPACESHIPZ
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {roleCards.map((card, index) => (
                    <Link
                        key={index}
                        href={`/auth?role=${card.role}`}
                        className="group relative flex flex-col rounded-[20px] overflow-hidden transition-all duration-500 hover:scale-[1.02]"
                        style={{ backgroundColor: "#0A1A0A", border: "1px solid rgba(0,200,83,0.15)" }}
                    >
                        <div className="p-5 sm:p-6 relative z-10">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform duration-300"
                                style={{ backgroundColor: `${card.accentColor}15`, border: `1px solid ${card.accentColor}30` }}>
                                <SvgIcon d={card.icon} className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: card.accentColor } as React.CSSProperties} />
                            </div>

                            <h3 className="text-white text-[19px] sm:text-[21px] font-semibold mb-2 sm:mb-3 tracking-tight group-hover:text-[#00C853] transition-colors">
                                {card.title}
                            </h3>

                            <p className="text-[#888] text-[13px] sm:text-[14px] leading-relaxed mb-4 sm:mb-6 min-h-[50px]">
                                {card.description}
                            </p>

                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                                {card.features.map((feature, fIdx) => (
                                    <span key={fIdx} className="px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-medium"
                                        style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                                        {feature}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 text-[13px] sm:text-[14px] font-semibold mt-3 sm:mt-4 group-hover:gap-3 transition-all" style={{ color: "#00C853" }}>
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
   6. FEATURES
   ═══════════════════════════════════════════════════════════ */
const features = [
    { title: "Real-Time Bidding", description: "Buyers post requirements and receive competitive bids from FPOs, auctioneers, and farmers ranked by price." },
    { title: "RFQ System", description: "Create detailed Requests for Quotes, invite specific suppliers, compare quotes, and award contracts." },
    { title: "Integrated Shipping", description: "Shipping lines and freight forwarders bid on your shipments alongside product procurement." },
    { title: "Market Prices", description: "View real-time market prices, compare trends, and make data-driven procurement decisions." },
    { title: "Quality Grades & HSN", description: "Products cataloged with quality tiers, HSN codes, and Incoterms for tax-compliant global trade." },
];

const Features = () => (
    <section id="features" className="py-16 sm:py-[100px] flex flex-col items-center justify-center px-4 sm:px-6" style={{ backgroundColor: "#050505" }}>
        <div className="max-w-[1280px] w-full text-center mb-10 sm:mb-14">
            <h2 className="text-[26px] sm:text-[36px] md:text-[48px] font-semibold leading-[1.2] text-white mb-4 tracking-tight">
                Everything you need for <br className="hidden sm:block" />
                <span style={{ color: "#00C853" }}>global spice procurement</span>
            </h2>
            <p className="text-[14px] sm:text-[16px] md:text-[18px] text-[#888] max-w-[700px] mx-auto leading-[1.6]">
                Our platform streamlines end-to-end B2B spice sourcing — from competitive bidding to cross-border shipping — all in one place.
            </p>
        </div>
        <div className="w-full max-w-[800px] mx-auto">
            <div className="flex flex-col border-t" style={{ borderColor: "rgba(0,200,83,0.15)" }}>
                {features.map((feature, index) => (
                    <div key={index} className="group flex items-center justify-between py-5 sm:py-7 border-b cursor-pointer transition-all duration-300"
                        style={{ borderColor: "rgba(0,200,83,0.15)" }}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-10 flex-1 pr-4">
                            <h3 className="text-[17px] sm:text-[22px] font-medium text-white min-w-0 sm:min-w-[200px] group-hover:text-[#00C853] transition-colors">{feature.title}</h3>
                            <p className="text-[13px] sm:text-[15px] text-[#888] sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 leading-relaxed">{feature.description}</p>
                        </div>
                        <ArrowRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#00C853] flex-shrink-0 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                ))}
            </div>
        </div>
        <div className="mt-12 sm:mt-16">
            <Link href="/dashboard" className="btn-primary flex items-center gap-2">Explore the Platform</Link>
        </div>
    </section>
);

/* ═══════════════════════════════════════════════════════════
   7. TESTIMONIALS
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
        <section className="py-16 sm:py-[100px] overflow-hidden" style={{ backgroundColor: "#071A10" }}>
            <div className="container mx-auto px-4 sm:px-6">
                <div className="text-center mb-10 sm:mb-16">
                    <h2 className="text-[26px] sm:text-[36px] md:text-[48px] font-semibold text-white leading-[1.2] mb-4 tracking-tight">
                        Why businesses choose <br /><span style={{ color: "#00C853" }}>SPACESHIPZ</span>
                    </h2>
                    <p className="text-[#888] text-[15px] sm:text-[17px] max-w-2xl mx-auto">From small importers to large food processors, our platform streamlines global spice procurement.</p>
                </div>

                <div className="relative max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row items-stretch gap-8 md:gap-12 rounded-2xl p-6 sm:p-10 md:p-12"
                        style={{ backgroundColor: "#0A1A0A", border: "1px solid rgba(0,200,83,0.15)" }}>
                        <div className="flex-1 text-left flex flex-col justify-between">
                            <div className="mb-6 sm:mb-8">
                                <p className="font-serif text-[18px] sm:text-[22px] md:text-[26px] leading-[1.5] text-white italic font-medium">
                                    &ldquo;{testimonials[activeTab].quote}&rdquo;
                                </p>
                            </div>
                            <div>
                                <div className="mb-6">
                                    <p className="text-[16px] sm:text-[17px] font-bold text-white">{testimonials[activeTab].author}</p>
                                    <p className="text-[13px] sm:text-[14px] text-[#888]">{testimonials[activeTab].role}</p>
                                </div>
                                <div className="border-t pt-6" style={{ borderColor: "rgba(0,200,83,0.15)" }}>
                                    <p className="text-[32px] sm:text-[40px] font-bold text-white leading-none mb-1">{testimonials[activeTab].stat}</p>
                                    <p className="text-[12px] sm:text-[13px] uppercase tracking-wider font-semibold text-[#888]">{testimonials[activeTab].statLabel}</p>
                                </div>
                            </div>
                        </div>
                        {/* Visual panel - responsive fix: controlled height instead of aspect-square */}
                        <div className="w-full md:w-[280px] lg:w-[320px] h-[180px] sm:h-[220px] md:h-auto md:min-h-[240px] rounded-xl relative overflow-hidden flex items-center justify-center flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, rgba(0,200,83,0.06) 0%, rgba(0,168,68,0.1) 100%)", border: "1px solid rgba(0,200,83,0.15)" }}>
                            <div className="text-center p-6">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: "rgba(0,200,83,0.1)", border: "1px solid rgba(0,200,83,0.25)" }}>
                                    <SvgIcon d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" className="w-8 h-8 text-[#00C853]" />
                                </div>
                                <p className="font-bold text-base text-[#00C853]">Real Results</p>
                                <p className="text-[#888] text-sm mt-1">Verified platform metrics</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 sm:mt-12 flex justify-center items-center flex-wrap gap-3 sm:gap-6 md:gap-8">
                    {testimonials.map((t, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveTab(index)}
                            className="relative pb-3 transition-all duration-300 flex flex-col items-center"
                            style={{ opacity: activeTab === index ? 1 : 0.4 }}
                        >
                            <div className="h-10 flex items-center px-3">
                                <span className="font-bold text-[14px] sm:text-[15px] text-white">{t.author.split(" ")[0]}</span>
                            </div>
                            {activeTab === index && <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ backgroundColor: "#00C853" }} />}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════
   8. USER ROLES
   ═══════════════════════════════════════════════════════════ */
const roles = [
    {
        title: "Buyer", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
        description: "Browse items, place orders, create bid requests & RFQs, compare quotes from multiple sellers, and track orders from placement to delivery.",
        features: ["Post Bid Requests", "RFQ System", "Compare Quotes", "Order Tracking", "Market Prices", "Dashboard & Analytics"], gridSpan: "sm:col-span-2",
    },
    {
        title: "Seller", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
        description: "Access active buyer requests, submit competitive bids, manage inventory, respond to RFQ invitations, and track earnings.",
        features: ["Browse Requests", "Submit Bids", "Manage Inventory", "RFQ Responses", "Performance Stats"], gridSpan: "sm:col-span-1",
    },
    {
        title: "Shipping Provider", icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
        description: "View accepted orders, submit shipping bids with delivery estimates, track shipment status, and manage delivery schedules.",
        features: ["Shipping Bids", "Delivery Tracking", "Schedule Management", "Performance Dashboard"], gridSpan: "sm:col-span-1",
    },
    {
        title: "Admin", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
        description: "Complete platform oversight with item management, order monitoring, user management, bid oversight, and analytics.",
        features: ["Platform Analytics", "User Management", "Item CRUD", "Order Oversight", "Bid Monitoring"], gridSpan: "sm:col-span-1",
    },
];

const UserRoles = () => (
    <section className="py-16 sm:py-[100px] relative overflow-hidden" style={{ backgroundColor: "#050505" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-10">
            <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full" style={{ background: "#00C853", filter: "blur(150px)" }} />
            <div className="absolute bottom-[-20%] right-[10%] w-[500px] h-[500px] rounded-full" style={{ background: "#009624", filter: "blur(150px)" }} />
        </div>
        <div className="container relative z-10 px-4 sm:px-6 mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 sm:mb-16 gap-6">
                <div className="max-w-[700px]">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="px-3 py-1 rounded flex items-center gap-2"
                            style={{ backgroundColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                            <span className="text-white text-[11px] sm:text-[12px] font-bold tracking-wider uppercase">4 User Roles</span>
                        </span>
                        <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tight" style={{ backgroundColor: "#00C853" }}>Live</span>
                    </div>
                    <h2 className="text-white text-[26px] sm:text-[36px] md:text-[48px] font-semibold leading-[1.2] mb-4 tracking-tight">One platform, <br className="hidden sm:block" /> four powerful roles</h2>
                    <p className="text-[#888] text-[14px] sm:text-[16px] md:text-[18px] font-medium max-w-[600px] leading-relaxed">Whether you are buying, selling, shipping, or managing — SPACESHIPZ gives every participant the tools they need.</p>
                </div>
                <Link href="/dashboard" className="text-white px-6 py-3 rounded-full font-semibold text-sm transition-all hover:text-[#00C853] whitespace-nowrap flex-shrink-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>Get Started</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {roles.map((item, index) => (
                    <div key={index} className={`${item.gridSpan} group relative flex flex-col rounded-[20px] overflow-hidden transition-all duration-500 hover:border-[#00C853]/40`}
                        style={{ backgroundColor: "#0A1A0A", border: "1px solid rgba(0,200,83,0.12)" }}>
                        <div className="p-6 sm:p-8 relative z-20">
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4"
                                style={{ backgroundColor: "rgba(0,200,83,0.1)", border: "1px solid rgba(0,200,83,0.2)" }}>
                                <SvgIcon d={item.icon} className="w-5 h-5 sm:w-6 sm:h-6 text-[#00C853]" />
                            </div>
                            <h3 className="text-white text-[19px] sm:text-[21px] font-semibold mb-2 tracking-tight group-hover:text-[#00C853] transition-colors">{item.title}</h3>
                            <p className="text-[#888] text-[13px] sm:text-[14px] leading-relaxed mb-5">{item.description}</p>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {item.features.map((feature, fIdx) => (
                                    <span key={fIdx} className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                                        style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>{feature}</span>
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
   9. STATS
   ═══════════════════════════════════════════════════════════ */
const stats = [
    { value: "500+", label: "Verified Suppliers", description: "FPOs, auctioneers, farmers, and exporters across India" },
    { value: "50+", label: "Countries Connected", description: "Cross-border procurement and shipping worldwide" },
    { value: "10K+", label: "Orders Processed", description: "From bid to delivery, fully managed on platform" },
];

const Stats = () => (
    <section className="text-white py-16 sm:py-[100px] overflow-hidden relative" style={{ backgroundColor: "#071A10" }}>
        <div className="container px-4 sm:px-6 mx-auto relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-12 sm:mb-16">
                <div className="max-w-2xl">
                    <h2 className="text-[24px] sm:text-[36px] md:text-[48px] font-semibold leading-[1.2] tracking-tight text-white mb-4">
                        Procurement made powerful <br className="hidden sm:block" />enough to scale, simple enough to start.
                    </h2>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 mb-12 sm:mb-16">
                {stats.map((stat, index) => (
                    <div key={index} className="flex flex-col space-y-2">
                        <div className="text-[36px] sm:text-[48px] md:text-[56px] font-bold leading-[1.1] tracking-tight text-white mb-2">{stat.value}</div>
                        <div className="text-[16px] sm:text-[18px] md:text-[20px] font-medium text-white mb-1">{stat.label}</div>
                        <p className="text-[13px] sm:text-[14px] md:text-[15px] text-[#888] leading-[1.6]">{stat.description}</p>
                    </div>
                ))}
            </div>
            <div className="mt-4">
                <Link href="/dashboard" className="btn-primary text-[14px] sm:text-[15px]">
                    Start Sourcing Today
                </Link>
            </div>
        </div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none opacity-15"
            style={{ background: "radial-gradient(circle, rgba(0,200,83,0.2) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
    </section>
);

/* ═══════════════════════════════════════════════════════════
   10. HOW IT WORKS
   ═══════════════════════════════════════════════════════════ */
const steps = [
    { number: "01", title: "Post Your Requirement", description: "Buyers create a bid request or RFQ with product details, quantity, quality grade, and delivery preferences.", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
    { number: "02", title: "Suppliers Bid Competitively", description: "Verified sellers — FPOs, auctioneers, farmers, exporters — submit competitive bids ranked by price.", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    { number: "03", title: "Compare & Award", description: "Buyers compare bids side-by-side, review supplier profiles, and award the contract to the best offer.", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { number: "04", title: "Shipping Providers Bid", description: "Freight forwarders and shipping lines bid on logistics, ensuring the best shipping rates alongside product pricing.", icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" },
    { number: "05", title: "Track & Deliver", description: "Monitor the entire order lifecycle from confirmation through shipment to final delivery — all on one platform.", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
];

const HowItWorks = () => (
    <section className="py-16 sm:py-[100px] overflow-hidden" style={{ backgroundColor: "#050505" }}>
        <div className="container mx-auto px-4 sm:px-6 max-w-[1280px]">
            <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-[26px] sm:text-[36px] md:text-[48px] font-semibold text-white leading-[1.2] tracking-tight mb-4">
                    How <span style={{ color: "#00C853" }}>SPACESHIPZ</span> works
                </h2>
                <p className="max-w-[700px] mx-auto text-[14px] sm:text-[16px] md:text-[17px] text-[#888] leading-[1.6]">From requirement to delivery, our platform streamlines every step of global B2B spice procurement.</p>
            </div>
            <div className="relative max-w-[900px] mx-auto">
                <div className="absolute left-[22px] sm:left-[28px] md:left-[32px] top-0 bottom-0 w-px hidden sm:block"
                    style={{ background: "linear-gradient(to bottom, rgba(0,200,83,0.4), rgba(0,200,83,0.1), transparent)" }} />
                <div className="flex flex-col gap-8 sm:gap-10">
                    {steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-4 sm:gap-6 md:gap-8 group">
                            <div className="flex-shrink-0 w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center relative z-10 transition-colors"
                                style={{ backgroundColor: "rgba(0,200,83,0.08)", border: "1px solid rgba(0,200,83,0.2)" }}>
                                <SvgIcon d={step.icon} className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#00C853]" />
                            </div>
                            <div className="pt-1.5 sm:pt-2">
                                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                    <span className="text-[11px] sm:text-[12px] font-bold tracking-wider" style={{ color: "#00C853" }}>{step.number}</span>
                                    <h3 className="text-[16px] sm:text-[20px] md:text-[22px] font-semibold text-white tracking-tight group-hover:text-[#00C853] transition-colors">{step.title}</h3>
                                </div>
                                <p className="text-[13px] sm:text-[15px] text-[#888] leading-[1.6] max-w-[600px]">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-12 sm:mt-16 text-center">
                <Link href="/dashboard" className="btn-primary flex items-center gap-2 mx-auto">Start Sourcing Today</Link>
            </div>
        </div>
    </section>
);

/* ═══════════════════════════════════════════════════════════
   11. FAQ
   ═══════════════════════════════════════════════════════════ */
interface FAQItem { question: string; answer: string | React.ReactNode; }

const faqData: FAQItem[] = [
    { question: "What is SPACESHIPZ?", answer: "SPACESHIPZ is a digital B2B marketplace that simplifies global spice procurement. We connect buyers with verified suppliers — FPOs, auctioneers, farmers, and exporters — through a real-time bidding system, while integrating cross-border shipping to streamline sourcing and delivery." },
    {
        question: "How does the bidding system work?",
        answer: (
            <div className="space-y-3">
                <p>Our bidding system ensures you get the best price from a wide range of suppliers:</p>
                <ol className="list-decimal pl-5 space-y-1.5">
                    <li><strong>Post a Bid Request</strong>: Enter your product details — spice type, quantity, quality grade, and delivery requirements.</li>
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
            <div className="space-y-3">
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
    <div className="border-b" style={{ borderColor: "rgba(0,200,83,0.12)" }}>
        <button onClick={onClick} className="w-full py-5 sm:py-6 flex items-center justify-between text-left group transition-all" aria-expanded={isOpen}>
            <span className="text-[14px] sm:text-[15px] font-semibold text-white leading-[1.4] transition-colors group-hover:text-[#00C853] pr-4">{item.question}</span>
            <PlusIcon className={cn("w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#888] transition-transform duration-300 flex-shrink-0", isOpen && "rotate-45 text-[#00C853]")} />
        </button>
        <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isOpen ? "max-h-[500px] pb-5 sm:pb-6" : "max-h-0")}>
            <div className="text-[13px] sm:text-[14px] text-[#888] leading-[1.7]">{item.answer}</div>
        </div>
    </div>
);

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);
    return (
        <section className="py-16 sm:py-[100px] border-t" style={{ backgroundColor: "#071A10", borderColor: "rgba(0,200,83,0.1)" }}>
            <div className="container px-4 sm:px-6 mx-auto">
                <div className="text-center mb-10 sm:mb-14">
                    <h2 className="text-[26px] sm:text-[36px] md:text-[48px] font-semibold text-white leading-[1.2] mb-4 tracking-tight">Frequently asked questions</h2>
                    <p className="text-[14px] sm:text-[16px] md:text-[17px] text-[#888] font-medium">Everything you need to know about sourcing with SPACESHIPZ</p>
                </div>
                <div className="max-w-5xl mx-auto">
                    {/* Mobile: single column, sequential order */}
                    <div className="md:hidden">
                        {faqData.map((item, idx) => (
                            <AccordionItem key={idx} item={item} isOpen={openIndex === idx} onClick={() => toggle(idx)} />
                        ))}
                    </div>
                    {/* Desktop: two columns, even/odd split */}
                    <div className="hidden md:grid md:grid-cols-2 gap-x-8 md:gap-x-12">
                        <div>
                            {faqData.filter((_, idx) => idx % 2 === 0).map((item, idx) => {
                                const actualIndex = idx * 2;
                                return <AccordionItem key={actualIndex} item={item} isOpen={openIndex === actualIndex} onClick={() => toggle(actualIndex)} />;
                            })}
                        </div>
                        <div>
                            {faqData.filter((_, idx) => idx % 2 !== 0).map((item, idx) => {
                                const actualIndex = idx * 2 + 1;
                                return <AccordionItem key={actualIndex} item={item} isOpen={openIndex === actualIndex} onClick={() => toggle(actualIndex)} />;
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

/* ═══════════════════════════════════════════════════════════
   12. CTA
   ═══════════════════════════════════════════════════════════ */
const CTA = () => (
    <section className="relative w-full overflow-hidden py-16 sm:py-[100px] text-white" style={{ backgroundColor: "#050505" }}>
        <div className="absolute inset-0 z-0 opacity-[0.025] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, #00C853 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] z-0 opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(0,200,83,0.3) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="container relative z-10 px-4 sm:px-6 mx-auto max-w-[1280px] text-center">
            <h2 className="text-[28px] sm:text-[40px] md:text-[50px] lg:text-[56px] leading-[1.2] font-semibold tracking-tight text-white text-balance max-w-[800px] mx-auto mb-5 sm:mb-6">
                Ready to transform your spice procurement?
            </h2>
            <p className="text-[#888] text-[15px] sm:text-[17px] md:text-[19px] max-w-[500px] mx-auto leading-[1.5] mb-8 sm:mb-10">
                Join businesses worldwide who source smarter, ship faster, and save more with SPACESHIPZ.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard" className="btn-primary text-[14px] sm:text-[15px] !py-4 !px-10 w-full sm:w-auto">Get Started Free</Link>
                <a href="mailto:rendu@morrenventures.com" className="text-white/80 hover:text-[#00C853] border border-white/10 hover:border-[#00C853]/40 px-8 py-4 rounded-full font-semibold text-[14px] sm:text-[15px] transition-all w-full sm:w-auto text-center">Contact Sales</a>
            </div>
            <div className="mt-12 sm:mt-16 flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-[#888] text-[13px]">
                <span>rendu@morrenventures.com</span>
                <span className="hidden sm:inline text-[#333]">|</span>
                <span>+91-8217785175</span>
            </div>
        </div>
    </section>
);

/* ═══════════════════════════════════════════════════════════
   13. FOOTER
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
    <footer className="text-white pt-16 sm:pt-[80px] relative overflow-hidden" style={{ backgroundColor: "#050505", borderTop: "1px solid rgba(0,200,83,0.12)" }}>
        <div className="container px-4 sm:px-8 mx-auto max-w-[1280px]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-8 pb-12 sm:pb-16">
                <div className="col-span-2 sm:col-span-3 lg:col-span-2 flex flex-col gap-5">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center"
                            style={{ boxShadow: "0 0 12px rgba(0,200,83,0.4)" }}>
                            <span className="text-white font-bold text-sm">S</span>
                        </div>
                        <span className="text-xl font-semibold tracking-tight">SPACESHIPZ</span>
                    </div>
                    <p className="text-[#888] text-[14px] leading-relaxed max-w-[280px]">Digitizing global B2B spice procurement with seamless cross-border shipping integration.</p>
                    <div className="space-y-1.5 text-[13px] text-[#888]">
                        <p>rendu@morrenventures.com</p>
                        <p>+91-8217785175</p>
                    </div>
                    <div className="flex gap-2.5">
                        {socials.map((social, idx) => (
                            <a key={idx} href={social.href} className="w-9 h-9 rounded-lg flex items-center justify-center text-[#888] hover:text-[#00C853] transition-all"
                                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>{social.icon}</a>
                        ))}
                    </div>
                </div>
                {Object.entries(footerLinks).map(([title, links]) => (
                    <div key={title} className="flex flex-col gap-4">
                        <h3 className="text-white font-bold text-[12px] sm:text-[13px] uppercase tracking-wider">{title}</h3>
                        <ul className="flex flex-col gap-2.5">
                            {links.map((link) => (
                                <li key={link.name}><a href={link.href} className="text-[#888] hover:text-[#00C853] text-[13px] sm:text-[14px] transition-colors duration-200">{link.name}</a></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="border-t py-6 sm:py-8 flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <div className="text-[#888] text-[12px] sm:text-[13px] text-center sm:text-left">&copy; 2026 SPACESHIPZ by Morren Ventures. All rights reserved.</div>
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-[#888] text-[12px] sm:text-[13px]">
                    <a href="#" className="hover:text-[#00C853] transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-[#00C853] transition-colors">Terms & Conditions</a>
                    <a href="#" className="hover:text-[#00C853] transition-colors">Cookie Policy</a>
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
            <PriceHistory />
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
