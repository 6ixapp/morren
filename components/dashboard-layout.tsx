"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Settings,
    LogOut,
    Menu,
    X,
    Users,
    TrendingUp,
    Shield,
    Store,
    ShoppingCart,
    ChevronDown,
    FileText,
    BarChart3,
    Truck,
    Sprout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/contexts/LanguageContext";

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: "buyer" | "seller" | "admin" | "shipping_provider";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { t } = useLanguage();

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    const navItems = {
        buyer: [
            { href: "/dashboard/buyer", label: t("layout.browseItems"), icon: ShoppingBag },
            { href: "/dashboard/buyer?tab=orders", label: t("layout.myBidRequests"), icon: Package },
            { href: "/dashboard/buyer?tab=bids", label: t("layout.sellerBids"), icon: TrendingUp },
            { href: "/dashboard/cardamom-prices", label: t("layout.cardamomPrices"), icon: Sprout },
        ],
        seller: [
            { href: "/dashboard/seller", label: t("layout.dashboard"), icon: LayoutDashboard },
            { href: "/dashboard/seller?tab=orders", label: t("layout.buyerOrders"), icon: ShoppingCart },
            { href: "/dashboard/seller?tab=mybids", label: t("layout.myBids"), icon: TrendingUp },
            { href: "/dashboard/cardamom-prices", label: t("layout.cardamomPrices"), icon: Sprout },
        ],
        shipping_provider: [
            { href: "/dashboard/shipping-provider", label: t("layout.dashboard"), icon: LayoutDashboard },
            { href: "/dashboard/shipping-provider?tab=orders", label: t("layout.availableOrders"), icon: ShoppingCart },
            { href: "/dashboard/shipping-provider?tab=mybids", label: t("layout.myShippingBids"), icon: TrendingUp },
        ],
        admin: [
            { href: "/dashboard/admin", label: t("layout.overview"), icon: Shield },
            { href: "/dashboard/admin?tab=items", label: t("layout.manageItems"), icon: Package },
            { href: "/dashboard/admin?tab=orders", label: t("layout.manageOrders"), icon: ShoppingCart },
            { href: "/dashboard/admin?tab=users", label: t("layout.users"), icon: Users },
        ],
    };

    const currentNavItems = navItems[role];

    const roleLabel = {
        buyer: t("layout.buyerDashboard"),
        seller: t("layout.sellerDashboard"),
        shipping_provider: t("layout.shippingDashboard"),
        admin: t("layout.adminDashboard"),
    }[role];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Navbar */}
            <header className="bg-card border-b border-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo and Desktop Nav */}
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center gap-2.5">
                                <Image
                                    src="https://5.imimg.com/data5/SELLER/Logo/2023/1/CD/NH/CF/46836456/12569-comp-image-90x90.png"
                                    alt="Logo"
                                    width={36}
                                    height={36}
                                    className="h-9 w-9 rounded-lg object-contain ring-1 ring-border"
                                />
                                <div className="hidden md:flex flex-col leading-tight">
                                    <span className="font-semibold text-[15px] tracking-tight text-foreground">
                                        {roleLabel}
                                    </span>
                                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                        Morren
                                    </span>
                                </div>
                            </div>

                            {/* Desktop Navigation */}
                            <div className="hidden md:ml-8 md:flex md:space-x-1 items-center">
                                {currentNavItems.map((item) => {
                                    const isActive = pathname === item.href || (pathname === item.href.split('?')[0] && !item.href.includes('?'));
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                                isActive
                                                    ? "bg-accent text-accent-foreground"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            <item.icon className="h-4 w-4 mr-2" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Side: Theme Toggle, Language Switcher, User Profile & Mobile Menu Button */}
                        <div className="flex items-center gap-2">
                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* Language Switcher */}
                            <LanguageSwitcher />

                            {/* User Dropdown */}
                            <div className="hidden md:flex items-center ml-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-muted">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user?.avatar} />
                                                <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || role[0].toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col items-start mr-2">
                                                <span className="text-sm font-medium leading-none">{user?.name || 'User'}</span>
                                                <span className="text-xs text-muted-foreground">{role}</span>
                                            </div>
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>{t("common.myAccount")}</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => router.push('/dashboard/rfq')}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            <span>{t("layout.rfqs")}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push('/dashboard/market-prices')}>
                                            <BarChart3 className="mr-2 h-4 w-4" />
                                            <span>{t("layout.marketPrices")}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push('/dashboard/cardamom-prices')}>
                                            <Sprout className="mr-2 h-4 w-4" />
                                            <span>{t("layout.cardamomPrices")}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/${role}/settings`)}>
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>{t("common.settings")}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>{t("common.signOut")}</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Mobile menu button */}
                            <div className="flex items-center md:hidden">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    <span className="sr-only">Open main menu</span>
                                    {isMobileMenuOpen ? (
                                        <X className="block h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <Menu className="block h-6 w-6" aria-hidden="true" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-border">
                        <div className="pt-2 pb-3 space-y-1 px-2">
                            {currentNavItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center px-3 py-2 rounded-md text-base font-medium",
                                            isActive
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <item.icon className="h-5 w-5 mr-3" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                        <div className="pt-4 pb-4 border-t border-border">
                            <div className="flex items-center px-4">
                                <div className="flex-shrink-0">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user?.avatar} />
                                        <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || role[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-foreground">{user?.name || 'User'}</div>
                                    <div className="text-sm font-medium text-muted-foreground">{user?.email}</div>
                                </div>
                            </div>
                            <div className="mt-3 px-2 space-y-1">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="mr-2 h-5 w-5" />
                                    {t("common.signOut")}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
