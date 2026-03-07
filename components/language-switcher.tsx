"use client";

import { useLanguage, Language } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
    { code: "en", label: "English", nativeLabel: "English" },
    { code: "hi", label: "Hindi", nativeLabel: "हिंदी" },
    { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം" },
];

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1.5 px-2"
                    title="Change language"
                >
                    <Globe className="h-4 w-4" />
                    <span className="text-xs font-medium hidden sm:inline">
                        {current.nativeLabel}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={language === lang.code ? "font-semibold bg-accent" : ""}
                    >
                        <span className="mr-2">{lang.nativeLabel}</span>
                        <span className="text-muted-foreground text-xs">{lang.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
