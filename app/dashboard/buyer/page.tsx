
'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, Package, DollarSign, TrendingUp, TrendingDown, Eye, Plus, Check, X, Clock, Search, Leaf, Wheat, Apple, Nut, List, Trash2, Send, MoreHorizontal, Copy, Edit, Filter, SortAsc, SortDesc, ChevronDown, ChevronUp, Calendar, Users, Trophy, BarChart3, PieChart, Activity } from 'lucide-react';
import { Item, Order, Bid, ShippingBid } from '@/lib/types';
import { DashboardLayout } from '@/components/dashboard-layout';
import { CardContainer, CardBody, CardItem } from '@/components/ui/aceternity/3d-card';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { ClockTimer } from '@/components/ui/clock-timer';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getActiveItems, getOrdersByBuyer, getBidsByOrders, createOrder, getBuyerStats, updateBid, updateOrder, createItem, deleteBid, getShippingBidsByOrders, updateShippingBid, getCardamomPrices, getCardamomStats } from '@/lib/api-client';
import type { CardamomPrice, CardamomPriceStats } from '@/lib/api-client';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LocalCache, CacheKeys, CacheDuration } from '@/lib/cache';
import { processAutoAccepts } from '@/lib/auto-accept';
import { getErrorMessage } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
const HistoricalPriceChart = dynamic(
    () => import('@/components/cardamom/historical-charts').then((mod) => mod.HistoricalPriceChart),
    { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);
const YearComparisonChart = dynamic(
    () => import('@/components/cardamom/historical-charts').then((mod) => mod.YearComparisonChart),
    { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> }
);
import { useTheme } from '@/components/theme-provider';
import { Language } from '@/contexts/LanguageContext';

type LocalizedTerm = readonly [source: string, target: string];

const PRODUCT_TEXT_LOCALIZATION: Record<Exclude<Language, 'en'>, LocalizedTerm[]> = {
    hi: [
        ['Green Cardamom', 'हरी इलायची'],
        ['Black Cardamom', 'काली इलायची'],
        ['Cardamom', 'इलायची'],
        ['Coriander Seeds', 'धनिया बीज'],
        ['Mustard Seeds', 'सरसों के बीज'],
        ['Fennel Seeds', 'सौंफ'],
        ['Fenugreek Seeds', 'मेथी दाना'],
        ['Carom Seeds', 'अजवाइन'],
        ['Nigella Seeds', 'कलौंजी'],
        ['Black Pepper', 'काली मिर्च'],
        ['Bay Leaf', 'तेज पत्ता'],
        ['Star Anise', 'चक्र फूल'],
        ['Turmeric', 'हल्दी'],
        ['Red Chilli', 'लाल मिर्च'],
        ['Dry Ginger', 'सूखी अदरक'],
        ['Powder', 'पाउडर'],
        ['Whole', 'साबुत'],
        ['Broken', 'टूटा हुआ'],
        ['Quality', 'गुणवत्ता'],
        ['Regular', 'सामान्य'],
        ['Premium', 'प्रीमियम'],
        ['Standard', 'मानक'],
        ['Spices', 'मसाले'],
        ['Vegetables', 'सब्जियां'],
        ['Pulses', 'दालें'],
        ['Dry Fruits & Nuts', 'सूखे मेवे और मेवे'],
    ],
    ml: [
        ['Green Cardamom', 'പച്ച ഏലക്ക'],
        ['Black Cardamom', 'കറുത്ത ഏലക്ക'],
        ['Cardamom', 'ഏലക്ക'],
        ['Coriander Seeds', 'മല്ലിവിത്ത്'],
        ['Mustard Seeds', 'കടുക് വിത്ത്'],
        ['Fennel Seeds', 'പെരുഞ്ചീരകം'],
        ['Fenugreek Seeds', 'ഉലുവ വിത്ത്'],
        ['Carom Seeds', 'അജ്വൈൻ'],
        ['Nigella Seeds', 'കരിഞ്ചീരകം'],
        ['Black Pepper', 'കുരുമുളക്'],
        ['Bay Leaf', 'തേജപത്രം'],
        ['Star Anise', 'തക്കോലം'],
        ['Turmeric', 'മഞ്ഞൾ'],
        ['Red Chilli', 'ചുവപ്പ് മുളക്'],
        ['Dry Ginger', 'ഉണങ്ങിയ ഇഞ്ചി'],
        ['Powder', 'പൊടി'],
        ['Whole', 'മുഴുവൻ'],
        ['Broken', 'തകർന്നത്'],
        ['Quality', 'ഗുണമേന്മ'],
        ['Regular', 'സാധാരണ'],
        ['Premium', 'പ്രീമിയം'],
        ['Standard', 'സ്റ്റാൻഡേർഡ്'],
        ['Spices', 'മസാലകൾ'],
        ['Vegetables', 'പച്ചക്കറികൾ'],
        ['Pulses', 'പയർവർഗങ്ങൾ'],
        ['Dry Fruits & Nuts', 'ഉണങ്ങിയ പഴങ്ങളും നട്ടുകളും'],
    ],
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const localizeProductText = (text: string, language: Language): string => {
    if (!text || language === 'en') return text;

    const terms = PRODUCT_TEXT_LOCALIZATION[language];
    return terms.reduce((localized, [source, target]) => {
        const pattern = new RegExp(escapeRegExp(source), 'gi');
        return localized.replace(pattern, target);
    }, text);
};

// Predefined Product Catalog with Varieties
const PRODUCT_CATALOG = {
    spices: [
        // Cumin varieties
        { name: "Cumin (Jeera) - Singapore Quality", hsn: "0909", variety: "Singapore Quality" },
        { name: "Cumin (Jeera) - Europe Quality", hsn: "0909", variety: "Europe Quality" },
        { name: "Cumin (Jeera) - Regular", hsn: "0909", variety: "Regular" },
        { name: "Cumin (Jeera) - Bold", hsn: "0909", variety: "Bold" },

        // Coriander varieties
        { name: "Coriander Seeds - Eagle Quality", hsn: "0909", variety: "Eagle Quality" },
        { name: "Coriander Seeds - Scooter Quality", hsn: "0909", variety: "Scooter Quality" },
        { name: "Coriander Seeds - Regular", hsn: "0909", variety: "Regular" },

        // Mustard varieties
        { name: "Mustard Seeds - Yellow", hsn: "1207", variety: "Yellow" },
        { name: "Mustard Seeds - Black", hsn: "1207", variety: "Black" },
        { name: "Mustard Seeds - Brown", hsn: "1207", variety: "Brown" },

        // Fennel varieties
        { name: "Fennel Seeds (Saunf) - Lucknowi", hsn: "0909", variety: "Lucknowi" },
        { name: "Fennel Seeds (Saunf) - Bold", hsn: "0909", variety: "Bold" },
        { name: "Fennel Seeds (Saunf) - Regular", hsn: "0909", variety: "Regular" },

        { name: "Fenugreek Seeds (Methi)", hsn: "0910", variety: "Standard" },
        { name: "Carom Seeds (Ajwain) - Bold", hsn: "0910", variety: "Bold" },
        { name: "Carom Seeds (Ajwain) - Regular", hsn: "0910", variety: "Regular" },
        { name: "Nigella Seeds (Kalonji)", hsn: "0910", variety: "Standard" },

        // Black Pepper varieties
        { name: "Black Pepper - 500 GL", hsn: "0904", variety: "500 GL" },
        { name: "Black Pepper - 550 GL", hsn: "0904", variety: "550 GL" },
        { name: "Black Pepper - 580 GL", hsn: "0904", variety: "580 GL" },
        { name: "Black Pepper - MG1", hsn: "0904", variety: "MG1 (Malabar Garbled)" },
        { name: "Black Pepper - TGSEB", hsn: "0904", variety: "TGSEB" },

        // Cloves varieties
        { name: "Cloves - Hand Picked", hsn: "0907", variety: "Hand Picked" },
        { name: "Cloves - Machine Cleaned", hsn: "0907", variety: "Machine Cleaned" },
        { name: "Cloves - FAQ", hsn: "0907", variety: "FAQ" },

        // Cinnamon varieties
        { name: "Cinnamon - Split", hsn: "0906", variety: "Split" },
        { name: "Cinnamon - Quillings", hsn: "0906", variety: "Quillings" },
        { name: "Cinnamon - Stick", hsn: "0906", variety: "Stick" },
        { name: "Cinnamon - Powder", hsn: "0906", variety: "Powder" },

        // Cardamom Green varieties (ACTIVE: specific sizes for launch)
        { name: "Green Cardamom - 9 MM", hsn: "0908", variety: "9 MM" },
        { name: "Green Cardamom - 8.5-9 MM", hsn: "0908", variety: "8.5-9 MM" },
        { name: "Green Cardamom - 8-9 MM", hsn: "0908", variety: "8-9 MM" },
        { name: "Green Cardamom - 8 MM", hsn: "0908", variety: "8 MM" },
        { name: "Green Cardamom - 7.5-8 MM Bold", hsn: "0908", variety: "7.5-8 MM Bold" },
        { name: "Green Cardamom - 7.5-8 MM", hsn: "0908", variety: "7.5-8 MM" },
        { name: "Green Cardamom - 7-8 MM", hsn: "0908", variety: "7-8 MM" },
        { name: "Green Cardamom - 7-7.5 MM", hsn: "0908", variety: "7-7.5 MM" },
        { name: "Green Cardamom - 6-7 MM", hsn: "0908", variety: "6-7 MM" },
        { name: "Green Cardamom - 5-6 MM", hsn: "0908", variety: "5-6 MM" },

        // Cardamom Green varieties (HIDDEN: will be enabled later)
        // { name: "Cardamom Green - AGB", hsn: "0908", variety: "AGB (Alleppey Green Bold)" },
        // { name: "Cardamom Green - AGS", hsn: "0908", variety: "AGS (Alleppey Green Superior)" },

        // Cardamom Black varieties (HIDDEN: will be enabled later)
        // { name: "Cardamom Black - Large", hsn: "0908", variety: "Large" },
        // { name: "Cardamom Black - Medium", hsn: "0908", variety: "Medium" },
        // { name: "Cardamom Black - Small", hsn: "0908", variety: "Small" },

        { name: "Bay Leaf (Tej Patta) - Whole", hsn: "0910", variety: "Whole" },
        { name: "Bay Leaf (Tej Patta) - Broken", hsn: "0910", variety: "Broken" },

        { name: "Star Anise - Whole", hsn: "0910", variety: "Whole" },
        { name: "Star Anise - Broken", hsn: "0910", variety: "Broken" },

        { name: "Mace (Javitri) - Whole", hsn: "0908", variety: "Whole" },
        { name: "Mace (Javitri) - Broken", hsn: "0908", variety: "Broken" },

        // Nutmeg varieties
        { name: "Nutmeg (Jaiphal) - With Shell", hsn: "0908", variety: "With Shell" },
        { name: "Nutmeg (Jaiphal) - Without Shell", hsn: "0908", variety: "Without Shell" },
        { name: "Nutmeg (Jaiphal) - Powder", hsn: "0908", variety: "Powder" },

        // Turmeric varieties
        { name: "Turmeric Whole - Finger", hsn: "0910", variety: "Finger" },
        { name: "Turmeric Whole - Bulb", hsn: "0910", variety: "Bulb" },
        { name: "Turmeric Whole - Polished", hsn: "0910", variety: "Polished" },
        { name: "Turmeric Whole - Unpolished", hsn: "0910", variety: "Unpolished" },

        // Red Chilli varieties
        { name: "Red Chilli Whole - Guntur Sannam S4", hsn: "0904", variety: "Guntur Sannam S4" },
        { name: "Red Chilli Whole - Guntur Teja S17", hsn: "0904", variety: "Guntur Teja S17" },
        { name: "Red Chilli Whole - Byadgi", hsn: "0904", variety: "Byadgi" },
        { name: "Red Chilli Whole - Kashmiri", hsn: "0904", variety: "Kashmiri" },
        { name: "Red Chilli Whole - Wrinkled", hsn: "0904", variety: "Wrinkled" },
        { name: "Red Chilli Whole - Stemless", hsn: "0904", variety: "Stemless" },

        { name: "Dry Ginger - Cochin", hsn: "0910", variety: "Cochin" },
        { name: "Dry Ginger - Calicut", hsn: "0910", variety: "Calicut" },
        { name: "Dry Ginger - Bleached", hsn: "0910", variety: "Bleached" },
        { name: "Dry Ginger - Unbleached", hsn: "0910", variety: "Unbleached" },

        // Powder varieties
        { name: "Turmeric Powder - 2% Curcumin", hsn: "0910", variety: "2% Curcumin" },
        { name: "Turmeric Powder - 3% Curcumin", hsn: "0910", variety: "3% Curcumin" },
        { name: "Turmeric Powder - 5% Curcumin", hsn: "0910", variety: "5% Curcumin" },

        { name: "Red Chilli Powder - Hot", hsn: "0904", variety: "Hot" },
        { name: "Red Chilli Powder - Medium", hsn: "0904", variety: "Medium" },
        { name: "Red Chilli Powder - Mild", hsn: "0904", variety: "Mild" },
        { name: "Red Chilli Powder - Kashmiri", hsn: "0904", variety: "Kashmiri (Color)" },

        { name: "Coriander Powder - Regular", hsn: "0909", variety: "Regular" },
        { name: "Cumin Powder - Regular", hsn: "0909", variety: "Regular" },
        { name: "Black Pepper Powder - Regular", hsn: "0904", variety: "Regular" },
        { name: "Garam Masala - Standard", hsn: "0910", variety: "Standard" },
        { name: "Garam Masala - Premium", hsn: "0910", variety: "Premium" },
        { name: "Chicken Masala", hsn: "0910", variety: "Standard" },
        { name: "Meat Masala", hsn: "0910", variety: "Standard" }
    ],
    vegetables: [
        // Potato varieties
        { name: "Potato - 3797", hsn: "0701", variety: "3797" },
        { name: "Potato - Jyoti", hsn: "0701", variety: "Jyoti" },
        { name: "Potato - Pukhraj", hsn: "0701", variety: "Pukhraj" },
        { name: "Potato - Chipsona", hsn: "0701", variety: "Chipsona" },
        { name: "Potato - Kufri", hsn: "0701", variety: "Kufri" },
        { name: "Potato - Red", hsn: "0701", variety: "Red" },

        // Onion varieties
        { name: "Onion - Red (Nashik)", hsn: "0703", variety: "Red Nashik" },
        { name: "Onion - Red (Bangalore)", hsn: "0703", variety: "Red Bangalore" },
        { name: "Onion - White", hsn: "0703", variety: "White" },
        { name: "Onion - Pink", hsn: "0703", variety: "Pink" },
        { name: "Onion - Shallot (Sambar)", hsn: "0703", variety: "Shallot/Sambar" },
        { name: "Onion - 45-55mm", hsn: "0703", variety: "45-55mm" },
        { name: "Onion - 55-65mm", hsn: "0703", variety: "55-65mm" },
        { name: "Onion - 65-75mm", hsn: "0703", variety: "65-75mm" },

        // Tomato varieties
        { name: "Tomato - Hybrid", hsn: "0702", variety: "Hybrid" },
        { name: "Tomato - Desi", hsn: "0702", variety: "Desi" },
        { name: "Tomato - Cherry", hsn: "0702", variety: "Cherry" },
        { name: "Tomato - Roma", hsn: "0702", variety: "Roma" },

        // Green Chilli varieties
        { name: "Green Chilli - Finger Hot", hsn: "0709", variety: "Finger Hot" },
        { name: "Green Chilli - Jwala", hsn: "0709", variety: "Jwala" },
        { name: "Green Chilli - Bhavnagri", hsn: "0709", variety: "Bhavnagri" },
        { name: "Green Chilli - Bird Eye", hsn: "0709", variety: "Bird Eye" },

        // Ginger varieties
        { name: "Ginger - Maran", hsn: "0910", variety: "Maran" },
        { name: "Ginger - Nadia", hsn: "0910", variety: "Nadia" },
        { name: "Ginger - Dry (Saunth)", hsn: "0910", variety: "Dry/Saunth" },

        // Garlic varieties
        { name: "Garlic - Single Clove", hsn: "0703", variety: "Single Clove" },
        { name: "Garlic - Multi Clove", hsn: "0703", variety: "Multi Clove" },
        { name: "Garlic - 25-30mm", hsn: "0703", variety: "25-30mm" },
        { name: "Garlic - 30-35mm", hsn: "0703", variety: "30-35mm" },
        { name: "Garlic - 35-40mm", hsn: "0703", variety: "35-40mm" },
        { name: "Garlic - 40mm+", hsn: "0703", variety: "40mm+" },

        { name: "Carrot - Orange", hsn: "0706", variety: "Orange" },
        { name: "Carrot - Red", hsn: "0706", variety: "Red" },
        { name: "Beans - French", hsn: "0708", variety: "French" },
        { name: "Beans - Flat", hsn: "0708", variety: "Flat" },
        { name: "Cauliflower - White", hsn: "0704", variety: "White" },
        { name: "Cabbage - Green", hsn: "0704", variety: "Green" },
        { name: "Cabbage - Red", hsn: "0704", variety: "Red" },
        { name: "Spinach - Palak", hsn: "0709", variety: "Palak" },
        { name: "Broccoli - Green", hsn: "0704", variety: "Green" },
        { name: "Capsicum - Green", hsn: "0709", variety: "Green" },
        { name: "Capsicum - Red", hsn: "0709", variety: "Red" },
        { name: "Capsicum - Yellow", hsn: "0709", variety: "Yellow" },
        { name: "Green Peas - Fresh", hsn: "0710", variety: "Fresh" },
        { name: "Green Peas - Frozen", hsn: "0710", variety: "Frozen" },
        { name: "Sweet Corn - Fresh", hsn: "0710", variety: "Fresh" },
        { name: "Sweet Corn - Frozen", hsn: "0710", variety: "Frozen" },
        { name: "Brinjal (Eggplant) - Long", hsn: "0709", variety: "Long" },
        { name: "Brinjal (Eggplant) - Round", hsn: "0709", variety: "Round" },
        { name: "Lady Finger (Okra)", hsn: "0709", variety: "Standard" },
        { name: "Bottle Gourd", hsn: "0709", variety: "Standard" },
        { name: "Pumpkin - Orange", hsn: "0709", variety: "Orange" },
        { name: "Pumpkin - Green", hsn: "0709", variety: "Green" },
        { name: "Beetroot", hsn: "0706", variety: "Standard" },
        { name: "Radish - White", hsn: "0706", variety: "White" },
        { name: "Radish - Red", hsn: "0706", variety: "Red" },
        { name: "Cucumber - English", hsn: "0707", variety: "English" },
        { name: "Cucumber - Desi", hsn: "0707", variety: "Desi" },
        { name: "Lettuce - Iceberg", hsn: "0705", variety: "Iceberg" },
        { name: "Lettuce - Romaine", hsn: "0705", variety: "Romaine" },
        { name: "Lemon - Kagzi", hsn: "0805", variety: "Kagzi" },
        { name: "Lemon - Seedless", hsn: "0805", variety: "Seedless" }
    ],
    pulses: [
        // Toor Dal varieties
        { name: "Toor Dal - Polished", hsn: "0713", variety: "Polished" },
        { name: "Toor Dal - Unpolished", hsn: "0713", variety: "Unpolished" },
        { name: "Toor Dal - Oily", hsn: "0713", variety: "Oily" },
        { name: "Toor Dal - Tatapuri", hsn: "0713", variety: "Tatapuri" },

        // Chana Dal varieties
        { name: "Chana Dal - Bold", hsn: "0713", variety: "Bold" },
        { name: "Chana Dal - Medium", hsn: "0713", variety: "Medium" },
        { name: "Chana Dal - Small", hsn: "0713", variety: "Small" },

        // Moong Dal varieties
        { name: "Moong Dal - Yellow Split", hsn: "0713", variety: "Yellow Split" },
        { name: "Moong Dal - Green Whole", hsn: "0713", variety: "Green Whole" },
        { name: "Moong Dal - Washed", hsn: "0713", variety: "Washed" },
        { name: "Moong Dal - Chilka", hsn: "0713", variety: "Chilka (Split with Skin)" },

        // Urad Dal varieties
        { name: "Urad Dal - Black Whole", hsn: "0713", variety: "Black Whole" },
        { name: "Urad Dal - White Split", hsn: "0713", variety: "White Split" },
        { name: "Urad Dal - Chilka", hsn: "0713", variety: "Chilka (Split with Skin)" },

        // Masoor Dal varieties
        { name: "Masoor Dal - Red Whole", hsn: "0713", variety: "Red Whole" },
        { name: "Masoor Dal - Red Split", hsn: "0713", variety: "Red Split" },
        { name: "Masoor Dal - Brown", hsn: "0713", variety: "Brown" },

        // Rajma varieties
        { name: "Rajma - Chitra", hsn: "0713", variety: "Chitra" },
        { name: "Rajma - Kashmiri", hsn: "0713", variety: "Kashmiri (Red)" },
        { name: "Rajma - Jammu", hsn: "0713", variety: "Jammu" },
        { name: "Rajma - Red", hsn: "0713", variety: "Red" },
        { name: "Rajma - White", hsn: "0713", variety: "White" },

        // Kabuli Chana varieties
        { name: "Kabuli Chana - 8mm", hsn: "0713", variety: "8mm" },
        { name: "Kabuli Chana - 9mm", hsn: "0713", variety: "9mm" },
        { name: "Kabuli Chana - 10mm", hsn: "0713", variety: "10mm" },
        { name: "Kabuli Chana - 11mm", hsn: "0713", variety: "11mm" },
        { name: "Kabuli Chana - 12mm+", hsn: "0713", variety: "12mm+ (Jumbo)" },

        { name: "Black Chana - Desi", hsn: "0713", variety: "Desi" },
        { name: "Black Chana - Kala Chana", hsn: "0713", variety: "Kala Chana" },

        { name: "Green Moong - Whole", hsn: "0713", variety: "Whole" },
        { name: "Green Moong - Split", hsn: "0713", variety: "Split" },

        { name: "Lobia (Black Eyed Beans)", hsn: "0713", variety: "Standard" },
        { name: "Horse Gram", hsn: "0713", variety: "Standard" },

        // Yellow Peas varieties
        { name: "Yellow Peas - Whole", hsn: "0713", variety: "Whole" },
        { name: "Yellow Peas - Split", hsn: "0713", variety: "Split" }
    ],
    dry_fruits_and_nuts: [
        // Almonds varieties
        { name: "Almonds - California", hsn: "0802", variety: "California" },
        { name: "Almonds - Mamra (Gurbandi)", hsn: "0802", variety: "Mamra/Gurbandi" },
        { name: "Almonds - Sanora", hsn: "0802", variety: "Sanora" },
        { name: "Almonds - NP (Non Pareil)", hsn: "0802", variety: "NP (Non Pareil)" },
        { name: "Almonds - 20/22", hsn: "0802", variety: "20/22 Count" },
        { name: "Almonds - 23/25", hsn: "0802", variety: "23/25 Count" },
        { name: "Almonds - 27/30", hsn: "0802", variety: "27/30 Count" },
        { name: "Almonds - Sliced", hsn: "0802", variety: "Sliced" },
        { name: "Almonds - Blanched", hsn: "0802", variety: "Blanched" },

        // Cashews varieties
        { name: "Cashews - W180", hsn: "0801", variety: "W180 (King Size)" },
        { name: "Cashews - W210", hsn: "0801", variety: "W210" },
        { name: "Cashews - W240", hsn: "0801", variety: "W240" },
        { name: "Cashews - W320", hsn: "0801", variety: "W320" },
        { name: "Cashews - W450", hsn: "0801", variety: "W450" },
        { name: "Cashews - WS (Scorched Wholes)", hsn: "0801", variety: "WS (Scorched)" },
        { name: "Cashews - SW (Split Wholes)", hsn: "0801", variety: "SW (Split)" },
        { name: "Cashews - LWP (Large White Pieces)", hsn: "0801", variety: "LWP" },
        { name: "Cashews - SWP (Small White Pieces)", hsn: "0801", variety: "SWP" },
        { name: "Cashews - BB (Butts)", hsn: "0801", variety: "BB (Butts)" },

        // Pistachios varieties
        { name: "Pistachios - Iranian", hsn: "0802", variety: "Iranian" },
        { name: "Pistachios - American", hsn: "0802", variety: "American" },
        { name: "Pistachios - Roasted Salted", hsn: "0802", variety: "Roasted Salted" },
        { name: "Pistachios - Raw", hsn: "0802", variety: "Raw" },
        { name: "Pistachios - 21/25", hsn: "0802", variety: "21/25 Count" },
        { name: "Pistachios - 26/30", hsn: "0802", variety: "26/30 Count" },

        // Walnuts varieties
        { name: "Walnuts - Chile", hsn: "0802", variety: "Chile" },
        { name: "Walnuts - Kashmir", hsn: "0802", variety: "Kashmir" },
        { name: "Walnuts - California", hsn: "0802", variety: "California" },
        { name: "Walnuts - In Shell", hsn: "0802", variety: "In Shell" },
        { name: "Walnuts - Kernels Light Halves", hsn: "0802", variety: "Kernels LH" },
        { name: "Walnuts - Kernels Light Pieces", hsn: "0802", variety: "Kernels LP" },

        // Raisins varieties
        { name: "Raisins - Green (Kishmish)", hsn: "0806", variety: "Green Kishmish" },
        { name: "Raisins - Golden", hsn: "0806", variety: "Golden" },
        { name: "Raisins - Black (Kali Draksh)", hsn: "0806", variety: "Black" },
        { name: "Raisins - Sultana", hsn: "0806", variety: "Sultana" },
        { name: "Raisins - Munakka", hsn: "0806", variety: "Munakka" },
        { name: "Raisins - Afghan", hsn: "0806", variety: "Afghan" },
        { name: "Raisins - Indian", hsn: "0806", variety: "Indian" },

        // Fig varieties
        { name: "Fig (Anjeer) - Dried", hsn: "0804", variety: "Dried" },
        { name: "Fig (Anjeer) - Turkish", hsn: "0804", variety: "Turkish" },
        { name: "Fig (Anjeer) - Afghan", hsn: "0804", variety: "Afghan" },

        // Dates varieties
        { name: "Dates - Medjool", hsn: "0804", variety: "Medjool" },
        { name: "Dates - Ajwa", hsn: "0804", variety: "Ajwa" },
        { name: "Dates - Kimia", hsn: "0804", variety: "Kimia" },
        { name: "Dates - Safawi", hsn: "0804", variety: "Safawi" },
        { name: "Dates - Mabroom", hsn: "0804", variety: "Mabroom" },
        { name: "Dates - Deglet Noor", hsn: "0804", variety: "Deglet Noor" },
        { name: "Dates - Khudri", hsn: "0804", variety: "Khudri" },

        // Apricot varieties
        { name: "Apricot - Turkish", hsn: "0813", variety: "Turkish" },
        { name: "Apricot - Ladakhi", hsn: "0813", variety: "Ladakhi" },
        { name: "Apricot - Hunza", hsn: "0813", variety: "Hunza" },

        // Makhana varieties
        { name: "Fox Nuts (Makhana) - 4 Sut", hsn: "0812", variety: "4 Sut (Large)" },
        { name: "Fox Nuts (Makhana) - 3 Sut", hsn: "0812", variety: "3 Sut (Medium)" },
        { name: "Fox Nuts (Makhana) - 2 Sut", hsn: "0812", variety: "2 Sut (Small)" },
        { name: "Fox Nuts (Makhana) - Roasted", hsn: "0812", variety: "Roasted" },

        { name: "Brazil Nuts - In Shell", hsn: "0801", variety: "In Shell" },
        { name: "Brazil Nuts - Kernels", hsn: "0801", variety: "Kernels" },
        { name: "Hazelnuts - In Shell", hsn: "0802", variety: "In Shell" },
        { name: "Hazelnuts - Blanched", hsn: "0802", variety: "Blanched" },
        { name: "Pecans - Halves", hsn: "0802", variety: "Halves" },
        { name: "Pecans - Pieces", hsn: "0802", variety: "Pieces" },
        { name: "Pine Nuts (Chilgoza)", hsn: "0802", variety: "Standard" },
        { name: "Prunes - Pitted", hsn: "0813", variety: "Pitted" },
        { name: "Prunes - Unpitted", hsn: "0813", variety: "Unpitted" },
        { name: "Dry Coconut - Whole", hsn: "0801", variety: "Whole" },
        { name: "Dry Coconut - Copra", hsn: "0801", variety: "Copra" },
        { name: "Dry Coconut - Desiccated", hsn: "0801", variety: "Desiccated" }
    ]
};

// Flatten catalog for search
// FULL catalog (all products - for future use)
const ALL_PRODUCTS_FULL = [
    ...PRODUCT_CATALOG.spices.map(p => ({ ...p, category: 'Spices' })),
    ...PRODUCT_CATALOG.vegetables.map(p => ({ ...p, category: 'Vegetables' })),
    ...PRODUCT_CATALOG.pulses.map(p => ({ ...p, category: 'Pulses' })),
    ...PRODUCT_CATALOG.dry_fruits_and_nuts.map(p => ({ ...p, category: 'Dry Fruits & Nuts' })),
];

// ACTIVE catalog (Green Cardamom + Cumin)
const ALL_PRODUCTS = ALL_PRODUCTS_FULL.filter(p =>
    p.name.includes('Green Cardamom') || p.name.toLowerCase().includes('cumin')
);

type CatalogProduct = { name: string; hsn: string; category: string; variety: string };

// Quality Grades for products
const QUALITY_GRADES = [
    { value: 'export_premium', label: 'Export Premium Quality', description: 'Highest grade for international export' },
    { value: 'export', label: 'Export Quality', description: 'Standard export grade' },
    { value: 'premium', label: 'Premium Quality', description: 'Top domestic grade' },
    { value: 'premium_split', label: 'Premium Split', description: 'Premium grade split/broken' },
    { value: 'export_split', label: 'Export Split', description: 'Export grade split/broken' },
    { value: 'standard', label: 'Standard Quality', description: 'Regular domestic grade' },
    { value: 'commercial', label: 'Commercial Grade', description: 'Bulk commercial use' },
    { value: 'reject', label: 'Reject Quality', description: 'Lower grade/rejected' },
    { value: 'faq', label: 'FAQ (Fair Average Quality)', description: 'Average market quality' },
    { value: 'aq', label: 'AQ (Average Quality)', description: 'Average quality' },
    { value: 'machine_cleaned', label: 'Machine Cleaned', description: 'Machine processed' },
    { value: 'hand_picked', label: 'Hand Picked/Sorted', description: 'Manually sorted premium' },
    { value: 'bold', label: 'Bold Grade', description: 'Larger size grade' },
    { value: 'medium', label: 'Medium Grade', description: 'Medium size grade' },
    { value: 'small', label: 'Small Grade', description: 'Smaller size grade' },
];

// Indian States and Union Territories
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const COUNTRIES = [
    'India',
    'United States',
    'United Kingdom',
    'China',
    'Germany',
    'Japan',
    'France',
    'Italy',
    'Canada',
    'Australia',
    'Brazil',
    'South Korea',
    'Netherlands',
    'Spain',
    'Russia',
    'Mexico',
    'Indonesia',
    'Turkey',
    'Saudi Arabia',
    'Switzerland',
    'Belgium',
    'Argentina',
    'Sweden',
    'Ireland',
    'Israel',
    'Norway',
    'United Arab Emirates',
    'South Africa',
    'Egypt',
    'Bangladesh',
    'Vietnam',
    'Philippines',
    'Chile',
    'Finland',
    'Romania',
    'Czech Republic',
    'New Zealand',
    'Peru',
    'Iraq',
    'Portugal',
    'Greece',
    'Qatar',
    'Algeria',
    'Kazakhstan',
    'Hungary',
    'Kuwait',
    'Morocco',
    'Ecuador',
    'Ukraine',
    'Slovakia',
    'Dominican Republic',
    'Kenya',
    'Ethiopia',
    'Guatemala',
    'Oman',
    'Bulgaria',
    'Ghana',
    'Venezuela',
    'Croatia',
    'Luxembourg',
    'Uruguay',
    'Costa Rica',
    'Panama',
    'Lithuania',
    'Slovenia',
    'Tunisia',
    'Tanzania',
    'Belarus',
    'Serbia',
    'Azerbaijan',
    'Jordan',
    'Paraguay',
    'Latvia',
    'Estonia',
    'Uganda',
    'Lebanon',
    'Cameroon',
    'Bolivia',
    'Libya',
    'Nepal',
    'Nicaragua',
    'El Salvador',
    'Honduras',
    'Senegal',
    'Zimbabwe',
    'Zambia',
    'Mali',
    'Rwanda',
    'Guinea',
    'Benin',
    'Burundi',
    'Tunisia',
    'Cuba',
    'Haiti',
    'Chad',
    'Sierra Leone',
    'Togo',
    'Libya',
    'Liberia',
    'Central African Republic',
    'Mauritania',
    'Eritrea',
    'Gambia',
    'Botswana',
    'Gabon',
    'Lesotho',
    'Guinea-Bissau',
    'Equatorial Guinea',
    'Mauritius',
    'Eswatini',
    'Djibouti',
    'Comoros',
    'Cape Verde',
    'Sao Tome and Principe',
    'Seychelles'
];

const INCOTERMS = [
    { code: 'EXW', name: 'Ex Works' },
    { code: 'FCA', name: 'Free Carrier' },
    { code: 'CPT', name: 'Carriage Paid To' },
    { code: 'CIP', name: 'Carriage and Insurance Paid To' },
    { code: 'DAP', name: 'Delivered At Place' },
    { code: 'DPU', name: 'Delivered at Place Unloaded' },
    { code: 'DDP', name: 'Delivered Duty Paid' },
    { code: 'FAS', name: 'Free Alongside Ship' },
    { code: 'FOB', name: 'Free On Board' },
    { code: 'CFR', name: 'Cost and Freight' },
    { code: 'CIF', name: 'Cost, Insurance and Freight' }
];

function BuyerDashboardContent() {
    const { user, loading: authLoading } = useAuth();
    const { t, language } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'items'; // Default to items (Browse Items)
    const { toast } = useToast();
    const { resolvedTheme } = useTheme();
    const [items, setItems] = useState<Item[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [bids, setBids] = useState<Bid[]>([]);
    const [shippingBids, setShippingBids] = useState<ShippingBid[]>([]);
    const [loading, setLoading] = useState(true);
    const hasLoadedOnce = useRef(false);
    const [cardamomPrices, setCardamomPrices] = useState<CardamomPrice[]>([]);
    const [cardamomStats, setCardamomStats] = useState<CardamomPriceStats | null>(null);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
    const [isItemDetailsDialogOpen, setIsItemDetailsDialogOpen] = useState(false);
    const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
    const [orderForm, setOrderForm] = useState({
        quantity: '',
        shippingAddress: '',
        notes: '',
    });
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: '',
        size: '',
        category: '',
        condition: 'new' as 'new' | 'used' | 'refurbished',
        quality: '' as string,
        quantity: '',
        specifications: {} as Record<string, string>,
    });
    const [specKey, setSpecKey] = useState('');
    const [specValue, setSpecValue] = useState('');

    const localizedProductName = useCallback((name?: string) => {
        if (!name) return '';
        return localizeProductText(name, language);
    }, [language]);

    const localizedProductMeta = useCallback((value?: string) => {
        if (!value) return '';
        return localizeProductText(value, language);
    }, [language]);

    // Catalog search states
    const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isSelectProductDialogOpen, setIsSelectProductDialogOpen] = useState(false);

    // Item browsing filters
    const [itemSearchQuery, setItemSearchQuery] = useState('');
    const [itemCategoryFilter, setItemCategoryFilter] = useState<string>('all');

    // Place Bid form (enhanced)
    const [isPlaceBidDialogOpen, setIsPlaceBidDialogOpen] = useState(false);
    const [bidForm, setBidForm] = useState({
        productName: '',
        hsnCode: '',
        size: '',
        specification: '',
        quality: '',
        quantity: '',
        expectedDeliveryDate: '',
        pincode: '',
        city: '',
        state: '',
        country: 'India',
        incoterms: '',
        shippingAddress: '',
        notes: '',
        sellerBidRunningTime: '24', // Phase 1: Seller bid running time in hours (default 24 hours)
        shippingBidRunningTime: '24', // Phase 2: Shipping bid running time in hours (default 24 hours)
    });
    const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<CatalogProduct | null>(null);

    // Add to List Dialog
    const [isAddToListDialogOpen, setIsAddToListDialogOpen] = useState(false);
    const [addToListForm, setAddToListForm] = useState({
        productName: '',
        hsnCode: '',
        size: '',
        specification: '',
        quality: '',
        quantity: '',
        expectedDeliveryDate: '',
        pincode: '',
        city: '',
        state: '',
        country: 'India',
        incoterms: '',
        shippingAddress: '',
        notes: '',
    });
    const [selectedProductForList, setSelectedProductForList] = useState<CatalogProduct | null>(null);

    // "My Bids" pagination
    const [myBidsVisibleCount, setMyBidsVisibleCount] = useState(10);
    const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});

    // Enhanced search and filtering states for My Bids
    const [myBidsSearchQuery, setMyBidsSearchQuery] = useState('');
    const [myBidsSortBy, setMyBidsSortBy] = useState<'date' | 'quantity' | 'ending' | 'name'>('date');
    const [myBidsSortDirection, setMyBidsSortDirection] = useState<'asc' | 'desc'>('desc');
    const [myBidsShowAll, setMyBidsShowAll] = useState(false);

    // Enhanced search and filtering states for Live Bids
    const [liveBidsSearchQuery, setLiveBidsSearchQuery] = useState('');
    const [liveBidsSortBy, setLiveBidsSortBy] = useState<'date' | 'amount' | 'ending' | 'delivery'>('ending');
    const [liveBidsSortDirection, setLiveBidsSortDirection] = useState<'asc' | 'desc'>('asc');
    const [liveBidsShowAll, setLiveBidsShowAll] = useState(false);

    // Filter and sort Live Bids
    const filteredAndSortedLiveBids = useMemo(() => {
        console.log('=== Live Bids Filtering Debug ===');
        console.log('Total bids:', bids.length);
        console.log('All bids:', bids);

        const liveBidsData = Object.values(
            bids.filter(b => b.status === 'pending').reduce((acc, bid) => {
                if (!acc[bid.orderId] || bid.bidAmount < acc[bid.orderId].bidAmount) {
                    acc[bid.orderId] = bid;
                }
                return acc;
            }, {} as Record<string, Bid>)
        );

        console.log('Pending bids:', bids.filter(b => b.status === 'pending'));
        console.log('Live bids data (lowest per order):', liveBidsData);

        let filtered = liveBidsData.filter(bid => {
            if (!liveBidsSearchQuery) return true;

            // Split search query into individual words
            const searchWords = liveBidsSearchQuery.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
            const order = orders.find(o => o.id === bid.orderId);

            // Combine all searchable text
            const searchableText = [
                order?.item?.name || '',
                bid.orderId,
                bid.sellerId || '',
                order?.shippingAddress || '',
                JSON.stringify(order?.item?.specifications || {})
            ].join(' ').toLowerCase();

            // Check if ALL search words are found in the searchable text
            return searchWords.every(word => searchableText.includes(word));
        });

        console.log('Filtered bids:', filtered);

        // Sort Live Bids by total cost (seller bid + shipping bid)
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;
            const aOrder = orders.find(o => o.id === a.orderId);
            const bOrder = orders.find(o => o.id === b.orderId);

            // Get shipping bids for each order
            const aShippingBids = shippingBids.filter(sb => sb.orderId === a.orderId && sb.status === 'pending');
            const bShippingBids = shippingBids.filter(sb => sb.orderId === b.orderId && sb.status === 'pending');
            const aLowestShipping = aShippingBids.length > 0 ? Math.min(...aShippingBids.map(sb => sb.bidAmount)) : 0;
            const bLowestShipping = bShippingBids.length > 0 ? Math.min(...bShippingBids.map(sb => sb.bidAmount)) : 0;
            const aTotalCost = a.bidAmount + aLowestShipping;
            const bTotalCost = b.bidAmount + bLowestShipping;

            switch (liveBidsSortBy) {
                case 'date':
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
                case 'amount':
                    // Sort by total cost (seller bid + shipping bid)
                    aValue = aTotalCost;
                    bValue = bTotalCost;
                    break;
                case 'delivery':
                    aValue = new Date(a.estimatedDelivery);
                    bValue = new Date(b.estimatedDelivery);
                    break;
                case 'ending':
                    const aSpecs = aOrder?.item?.specifications as any;
                    const bSpecs = bOrder?.item?.specifications as any;
                    const aBidHours = aSpecs?.['Seller Bid Running Time (hours)'] || (aSpecs?.['Bid Running Time (days)'] ? parseInt(aSpecs['Bid Running Time (days)']) * 24 : 0);
                    const bBidHours = bSpecs?.['Seller Bid Running Time (hours)'] || (bSpecs?.['Bid Running Time (days)'] ? parseInt(bSpecs['Bid Running Time (days)']) * 24 : 0);
                    aValue = new Date(new Date(aOrder?.createdAt || a.createdAt).getTime() + (parseInt(String(aBidHours)) * 60 * 60 * 1000));
                    bValue = new Date(new Date(bOrder?.createdAt || b.createdAt).getTime() + (parseInt(String(bBidHours)) * 60 * 60 * 1000));
                    break;
                default:
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
            }

            if (liveBidsSortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        console.log('Final sorted bids:', filtered);
        console.log('=== End Live Bids Filtering Debug ===');

        return filtered;
    }, [bids, shippingBids, orders, liveBidsSearchQuery, liveBidsSortBy, liveBidsSortDirection]);

    // Reset filter functions
    const resetMyBidsFilters = () => {
        setMyBidsSearchQuery('');
        setMyBidsSortBy('date');
        setMyBidsSortDirection('desc');
    };

    const resetLiveBidsFilters = () => {
        setLiveBidsSearchQuery('');
        setLiveBidsSortBy('ending');
        setLiveBidsSortDirection('asc');
    };

    // Calculate bid end time based on order creation and bid running time
    const calculateBidEndTime = (order: Order | undefined) => {
        if (!order) return new Date();

        const createdAt = new Date(order.createdAt);
        const defaultHours = 7 * 24; // Default 7 days in hours

        // Try to get bid running time from specifications (hours takes priority, fall back to days)
        const specs = order.item?.specifications as any;
        const specifiedHours = specs?.['Seller Bid Running Time (hours)'];
        const specifiedDays = specs?.['Seller Bid Running Time (days)'] || specs?.['Bid Running Time (days)'] || specs?.['bidRunningTime'];
        const hoursToAdd = specifiedHours
            ? parseInt(specifiedHours.toString())
            : (specifiedDays ? parseInt(specifiedDays.toString()) * 24 : defaultHours);

        const endTime = new Date(createdAt.getTime() + (hoursToAdd * 60 * 60 * 1000));
        return endTime;
    };

    // Function to calculate remaining time for bids (bidRunningTimeHours is in hours)
    const calculateRemainingTime = (createdAt: string, bidRunningTimeHours: string | number) => {
        if (!createdAt || !bidRunningTimeHours) return 'N/A';

        try {
            const createdDate = new Date(createdAt);
            const bidHours = typeof bidRunningTimeHours === 'string' ? parseInt(bidRunningTimeHours) : bidRunningTimeHours;

            if (isNaN(bidHours)) return 'N/A';

            const endDate = new Date(createdDate.getTime() + (bidHours * 60 * 60 * 1000));
            const now = new Date();
            const remainingMs = endDate.getTime() - now.getTime();

            if (remainingMs <= 0) return 'Expired';

            const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
            const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

            if (remainingDays > 0) {
                return `${remainingDays}d ${remainingHours}h`;
            } else if (remainingHours > 0) {
                return `${remainingHours}h ${remainingMinutes}m`;
            } else {
                return `${remainingMinutes}m`;
            }
        } catch (error) {
            return 'N/A';
        }
    };

    const myBidOrders = useMemo(() => {
        // Treat orders with totalPrice === 0 or notes mentioning "bid request" as bid requests created by the buyer
        return orders.filter((order) => {
            const isBidRequestPrice = !order.totalPrice || order.totalPrice === 0;
            const notesLower = order.notes?.toLowerCase() || '';
            const isBidRequestNotes = notesLower.includes('bid request');
            return isBidRequestPrice || isBidRequestNotes;
        });
    }, [orders]);

    // Filter and sort My Bids (must come after myBidOrders)
    const filteredAndSortedMyBids = useMemo(() => {
        let filtered = myBidOrders.filter(order => {
            if (!myBidsSearchQuery) return true;

            // Split search query into individual words
            const searchWords = myBidsSearchQuery.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);

            // Combine all searchable text
            const searchableText = [
                order.item?.name || '',
                localizedProductName(order.item?.name),
                order.id,
                (order.item?.specifications as any)?.['HSN Code'] || '',
                order.shippingAddress || '',
                JSON.stringify(order.item?.specifications || {})
            ].join(' ').toLowerCase();

            // Check if ALL search words are found in the searchable text
            return searchWords.every(word => searchableText.includes(word));
        });

        // Sort My Bids
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (myBidsSortBy) {
                case 'date':
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
                case 'quantity':
                    aValue = a.quantity || 0;
                    bValue = b.quantity || 0;
                    break;
                case 'name':
                    aValue = (a.item?.name || '').toLowerCase();
                    bValue = (b.item?.name || '').toLowerCase();
                    break;
                case 'ending':
                    const aSpecs = a.item?.specifications as any;
                    const bSpecs = b.item?.specifications as any;
                    const aBidHours2 = aSpecs?.['Seller Bid Running Time (hours)'] || (aSpecs?.['Bid Running Time (days)'] ? parseInt(aSpecs['Bid Running Time (days)']) * 24 : 0);
                    const bBidHours2 = bSpecs?.['Seller Bid Running Time (hours)'] || (bSpecs?.['Bid Running Time (days)'] ? parseInt(bSpecs['Bid Running Time (days)']) * 24 : 0);
                    aValue = new Date(new Date(a.createdAt).getTime() + (parseInt(String(aBidHours2)) * 60 * 60 * 1000));
                    bValue = new Date(new Date(b.createdAt).getTime() + (parseInt(String(bBidHours2)) * 60 * 60 * 1000));
                    break;
                default:
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
            }

            if (myBidsSortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [myBidOrders, myBidsSearchQuery, myBidsSortBy, myBidsSortDirection, localizedProductName]);

    const getBidTimeLeftLabel = (order: Order | undefined) => {
        if (!order) return 'N/A';
        const specs = order.item?.specifications || {};
        const runningHoursRaw = (specs as any)['Seller Bid Running Time (hours)'];
        const runningDaysRaw = (specs as any)['Seller Bid Running Time (days)'] || (specs as any)['Bid Running Time (days)'];
        const runningHours = runningHoursRaw
            ? parseInt(String(runningHoursRaw))
            : (runningDaysRaw ? parseInt(String(runningDaysRaw)) * 24 : NaN);
        if (!runningHours || isNaN(runningHours) || runningHours <= 0) return 'N/A';

        const created = new Date(order.createdAt).getTime();
        const deadline = created + runningHours * 60 * 60 * 1000;
        const now = Date.now();
        const diffMs = deadline - now;
        if (diffMs <= 0) return 'Expired';

        const diffHoursTotal = Math.floor(diffMs / (1000 * 60 * 60));
        const daysLeft = Math.floor(diffHoursTotal / 24);
        const hoursLeft = diffHoursTotal % 24;

        if (daysLeft > 0) {
            return `${daysLeft}d ${hoursLeft}h left`;
        }
        // Less than 24 hours left
        const diffMinutesTotal = Math.floor(diffMs / (1000 * 60));
        const hoursOnly = Math.floor(diffMinutesTotal / 60);
        const minutesLeft = diffMinutesTotal % 60;
        if (hoursOnly > 0) {
            return `${hoursOnly}h ${minutesLeft}m left`;
        }
        return `${minutesLeft}m left`;
    };

    // Filter catalog products based on search query and category
    const filteredCatalogProducts = useMemo(() => {
        return ALL_PRODUCTS.filter(product => {
            // Split search query into individual words
            const searchWords = catalogSearchQuery.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);

            // If no search query, match all
            if (searchWords.length === 0) {
                const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
                return matchesCategory;
            }

            // Combine all searchable text
            const searchableText = [
                product.name,
                localizedProductName(product.name),
                product.variety,
                localizedProductMeta(product.variety),
                product.category,
                localizedProductMeta(product.category),
                product.hsn,
                (product as any).description || ''
            ].join(' ').toLowerCase();

            // Check if ALL search words are found in the searchable text
            const matchesSearch = searchWords.every(word => searchableText.includes(word));

            const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [catalogSearchQuery, selectedCategory, localizedProductName, localizedProductMeta]);

    // Filter items for browsing based on search and category
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            // Split search query into individual words
            const searchWords = itemSearchQuery.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);

            // If no search query, match all
            if (searchWords.length === 0) {
                const matchesCategory = itemCategoryFilter === 'all' ||
                    item.category?.toLowerCase().includes(itemCategoryFilter.toLowerCase());
                return matchesCategory;
            }

            // Combine all searchable text
            const searchableText = [
                item.name,
                localizedProductName(item.name),
                item.description || '',
                item.category || '',
                localizedProductMeta(item.category || ''),
                JSON.stringify(item.specifications || {})
            ].join(' ').toLowerCase();

            // Check if ALL search words are found in the searchable text
            const matchesSearch = searchWords.every(word => searchableText.includes(word));

            const matchesCategory = itemCategoryFilter === 'all' ||
                item.category?.toLowerCase().includes(itemCategoryFilter.toLowerCase());
            return matchesSearch && matchesCategory;
        });
    }, [items, itemSearchQuery, itemCategoryFilter, localizedProductName, localizedProductMeta]);

    // Get unique categories from items
    const itemCategories = useMemo(() => {
        const categories = new Set(items.map(item => item.category).filter(Boolean));
        return Array.from(categories);
    }, [items]);

    // Size options for bid form
    // Size options for bid form - simplified to just kg
    const SIZE_OPTIONS = [
        { value: 'kg', label: 'kg' },
    ];

    // Select a product from catalog
    const selectCatalogProduct = (product: CatalogProduct) => {
        setProductForm({
            ...productForm,
            name: product.name,
            category: product.category,
            specifications: {
                ...productForm.specifications,
                'HSN Code': product.hsn,
                'Variety/Grade': product.variety
            }
        });
        setIsSelectProductDialogOpen(false);
        setIsAddProductDialogOpen(true);
        setCatalogSearchQuery('');
        setSelectedCategory('all');
    };

    // Select a product from catalog for bid request
    const selectCatalogProductForBid = (product: CatalogProduct) => {
        setSelectedCatalogProduct(product);
        setBidForm({
            ...bidForm,
            productName: product.name,
            hsnCode: product.hsn,
            specification: product.variety,
        });
        setIsSelectProductDialogOpen(false);
        setCatalogSearchQuery('');
        setSelectedCategory('all');
    };

    // Select a product from catalog for adding to list
    const selectCatalogProductForList = (product: CatalogProduct) => {
        setSelectedProductForList(product);
        setAddToListForm({
            ...addToListForm,
            productName: product.name,
            hsnCode: product.hsn,
            specification: product.variety,
        });
        setIsSelectProductDialogOpen(false);
        setIsAddToListDialogOpen(true);
        setCatalogSearchQuery('');
        setSelectedCategory('all');
    };

    // Add item to saved list AND create in database
    const [addingToList, setAddingToList] = useState(false);

    const handleAddToList = async () => {
        if (!user) {
            toast({
                title: t("common.error"),
                description: "You must be logged in to add items.",
                variant: "destructive",
            });
            return;
        }

        if (!addToListForm.productName || !addToListForm.quantity) {
            toast({
                title: t("common.error"),
                description: "Please fill in at least Product Name and Quantity.",
                variant: "destructive",
            });
            return;
        }

        const quantity = parseInt(addToListForm.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            toast({
                title: t("common.error"),
                description: "Please enter a valid quantity.",
                variant: "destructive",
            });
            return;
        }

        setAddingToList(true);
        try {
            // Create the item in the database so it appears in the items grid
            await createItem({
                name: addToListForm.productName,
                description: `${addToListForm.specification || addToListForm.productName}${addToListForm.notes ? ` - ${addToListForm.notes}` : ''}`,
                image: '/api/placeholder/400/300',
                price: 0, // Price will be determined by bids
                size: addToListForm.size || 'As specified',
                category: selectedProductForList?.category || 'General',
                condition: 'new',
                quantity: quantity,
                specifications: {
                    ...(addToListForm.hsnCode && { 'HSN Code': addToListForm.hsnCode }),
                    ...(addToListForm.specification && { 'Specification': addToListForm.specification }),
                    ...(addToListForm.quality && { 'Quality Grade': QUALITY_GRADES.find(g => g.value === addToListForm.quality)?.label || addToListForm.quality }),
                    ...(addToListForm.expectedDeliveryDate && { 'Expected Delivery': addToListForm.expectedDeliveryDate }),
                    'Destination Country': addToListForm.country,
                    ...(addToListForm.country !== 'India' && addToListForm.incoterms && { 'Incoterms': `${addToListForm.incoterms} - ${INCOTERMS.find(i => i.code === addToListForm.incoterms)?.name || addToListForm.incoterms}` }),
                    ...(addToListForm.country === 'India' && addToListForm.city && addToListForm.state && { 'Location': `${addToListForm.city}, ${addToListForm.state} - ${addToListForm.pincode}` }),
                    ...(addToListForm.country !== 'India' && addToListForm.city && { 'Location': `${addToListForm.city}${addToListForm.state ? ', ' + addToListForm.state : ''}, ${addToListForm.country}` }),
                },
                sellerId: user.id, // Buyer creates the item
                status: 'active',
            });

            toast({
                title: "Item Added! 🎉",
                description: `${addToListForm.productName} has been added and is now visible in the items list.`,
            });

            setIsAddToListDialogOpen(false);
            setAddToListForm({
                productName: '',
                hsnCode: '',
                size: '',
                specification: '',
                quality: '',
                quantity: '',
                expectedDeliveryDate: '',
                pincode: '',
                city: '',
                state: '',
                country: 'India',
                incoterms: '',
                shippingAddress: '',
                notes: '',
            });
            setSelectedProductForList(null);

            // Refresh to show the new item in the grid
            await fetchData();
        } catch (error: any) {
            console.error('Error adding item:', error);
            toast({
                title: t("common.error"),
                description: error?.message || "Failed to add item. Please try again.",
                variant: "destructive",
            });
        } finally {
            setAddingToList(false);
        }
    };

    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) {
            return;
        }

        // If no user after auth is done loading, redirect to login
        if (!user) {
            console.log('No user found, redirecting to auth');
            router.replace('/auth?role=buyer');
            return;
        }

        // If user is not a buyer, redirect to their dashboard
        if (user.role !== 'buyer') {
            console.log('User is not a buyer, redirecting to:', user.role);
            router.replace(`/dashboard/${user.role}`);
            return;
        }
    }, [user, authLoading, router]);

    const fetchData = useCallback(async (forceRefresh = false, retryCount = 0) => {
        if (!user) {
            console.log('fetchData: No user, skipping and ensuring loading is false');
            setLoading(false); // Ensure loading is stopped
            return;
        }

        console.log('fetchData: Starting...', { forceRefresh, userId: user.id, retryCount });

        try {
            // Only show the full-screen loading spinner on the very first load or a forced refresh
            if (!hasLoadedOnce.current || forceRefresh) {
                setLoading(true);
            }

            // Clear cache on force refresh (hard refresh)
            if (forceRefresh) {
                console.log('fetchData: Clearing cache...');
                LocalCache.remove(CacheKeys.orders(user.id));
                LocalCache.remove(CacheKeys.bids(user.id));
                LocalCache.remove(CacheKeys.shippingBids(user.id));
                LocalCache.remove(CacheKeys.items());
            }

            // Always fetch fresh data for buyer dashboard (real-time is critical)
            console.log('Fetching fresh data from Supabase');

            let freshItems: any[] = [];
            let freshOrders: any[] = [];

            try {
                const results = await Promise.all([
                    getActiveItems().catch(err => {
                        console.error('Error fetching items:', err);
                        return [];
                    }),
                    getOrdersByBuyer(user.id).catch(err => {
                        console.error('Error fetching orders:', err);
                        return [];
                    }),
                ]);

                freshItems = results[0];
                freshOrders = results[1];

                console.log('fetchData: Fetched items:', freshItems.length, 'orders:', freshOrders.length);
            } catch (err) {
                console.error('Error in Promise.all for items/orders:', err);

                // Retry logic for critical failures
                if (retryCount < 2) {
                    console.log(`Retrying data fetch (attempt ${retryCount + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
                    return fetchData(forceRefresh, retryCount + 1);
                }

                // If retries fail, show error but continue with empty arrays
                toast({
                    title: t("common.error"),
                    description: "Having trouble loading some data. Please check your connection.",
                    variant: "destructive",
                });
            }

            setItems(freshItems);
            setOrders(freshOrders);

            // **OPTIMIZED**: Batch fetch all bids in a single query instead of per-order
            let allBids: any[] = [];
            let allShippingBids: any[] = [];

            if (freshOrders.length > 0) {
                try {
                    // Extract all order IDs for batch querying
                    const orderIds = freshOrders.map(order => order.id);

                    console.log(`Batch fetching bids for ${orderIds.length} orders...`);

                    // **PERFORMANCE IMPROVEMENT**: Fetch bids for all orders
                    // Using API client instead of direct database queries
                    const [allBidsResult, allShippingBidsResult] = await Promise.all([
                        getBidsByOrders(orderIds, false).catch(err => {
                            console.error('Error fetching seller bids:', err);
                            return [];
                        }),
                        getShippingBidsByOrders(orderIds, false).catch(err => {
                            console.error('Error fetching shipping bids:', err);
                            return [];
                        }),
                    ]);

                    allBids = allBidsResult;
                    allShippingBids = allShippingBidsResult;

                    console.log(`fetchData: Batch fetched ${allBids.length} seller bids and ${allShippingBids.length} shipping bids`);
                } catch (err) {
                    console.error('Error batch fetching bids:', err);
                    // Continue with empty arrays rather than failing completely
                }
            }

            setBids(allBids);
            setShippingBids(allShippingBids);

            // Process auto-accepts for expired bids (don't await, run in background)
            processAutoAccepts(freshOrders, allBids, allShippingBids).then((result) => {
                if (result.sellerAccepted > 0 || result.shippingAccepted > 0) {
                    console.log(`Auto-accepted: ${result.sellerAccepted} seller bids, ${result.shippingAccepted} shipping bids`);
                    toast({
                        title: "Bids Auto-Accepted",
                        description: `${result.sellerAccepted} seller bid(s) and ${result.shippingAccepted} shipping bid(s) were automatically accepted due to time expiration.`,
                    });
                    // Refresh data after auto-accept (after a short delay)
                    setTimeout(() => fetchData(true), 1500);
                }
            }).catch(err => {
                console.error('Error in auto-accept:', err);
            });

            hasLoadedOnce.current = true;
            console.log('fetchData: Success!');

        } catch (error: any) {
            console.error('Error fetching data:', error);
            toast({
                title: t("common.error"),
                description: error?.message || "Failed to load dashboard data. Please try refreshing the page.",
                variant: "destructive",
            });
        } finally {
            console.log('fetchData: Setting loading to false');
            setLoading(false);
        }
    }, [user, toast]);

    // Separate effect for fetching data on mount
    useEffect(() => {
        if (user && user.role === 'buyer') {
            // User is authenticated and is a buyer, fetch data
            console.log('Buyer authenticated, fetching data');
            fetchData(true); // Force refresh on mount to clear any stale cache
        }
    }, [user, fetchData]);

    // Fetch cardamom price data for dashboard
    useEffect(() => {
        if (!user) return;
        getCardamomPrices().then(setCardamomPrices).catch(() => {});
        getCardamomStats().then(setCardamomStats).catch(() => {});
    }, [user]);

    // Auto-refresh every 30 seconds to see new bids in real-time
    useEffect(() => {
        if (!user || user.role !== 'buyer') return;

        const intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') {
                console.log('Auto-refreshing data for new bids...');
                fetchData(false); // Soft refresh (uses cache for some data)
            }
        }, 30000); // 30 seconds

        return () => clearInterval(intervalId);
    }, [user, fetchData]);

    // Auto-fill city/state from pincode using India Post API
    useEffect(() => {
        if (bidForm.pincode.length !== 6 || bidForm.country !== 'India') return;
        fetch(`https://api.postalpincode.in/pincode/${bidForm.pincode}`)
            .then(res => res.json())
            .then(data => {
                if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
                    const po = data[0].PostOffice[0];
                    setBidForm(prev => ({
                        ...prev,
                        city: prev.city || po.District || po.Division || '',
                        state: prev.state || po.State || '',
                    }));
                }
            })
            .catch(() => {});
    }, [bidForm.pincode, bidForm.country]);

    // Safety timeout: Force stop loading after 8 seconds to prevent stuck state
    useEffect(() => {
        if (!loading) return;

        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn('Loading timeout - stopping loading state');
                setLoading(false);
                // Don't show toast - this is a safety mechanism and data might have loaded anyway
            }
        }, 8000); // 8 seconds timeout

        return () => clearTimeout(timeoutId);
    }, [loading]);

    const handlePlaceOrder = async () => {
        if (!selectedItem || !user) {
            toast({
                title: t("common.error"),
                description: "Please select an item to order.",
                variant: "destructive",
            });
            return;
        }

        if (!orderForm.quantity || !orderForm.shippingAddress) {
            toast({
                title: t("common.error"),
                description: "Please fill in quantity and shipping address.",
                variant: "destructive",
            });
            return;
        }

        const quantity = parseInt(orderForm.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            toast({
                title: t("common.error"),
                description: "Please enter a valid quantity.",
                variant: "destructive",
            });
            return;
        }

        if (quantity > selectedItem.quantity) {
            toast({
                title: t("common.error"),
                description: `Only ${selectedItem.quantity} units available.`,
                variant: "destructive",
            });
            return;
        }

        setPlacingOrder(true);
        try {
            const newOrder = await createOrder({
                itemId: selectedItem.id,
                buyerId: user.id,
                quantity: quantity,
                totalPrice: selectedItem.price * quantity,
                status: 'pending',
                shippingAddress: orderForm.shippingAddress,
                notes: orderForm.notes || undefined,
            });

            toast({
                title: "Order Placed Successfully! 🎉",
                description: `Your order for ${localizedProductName(selectedItem.name)} has been placed. Sellers can now bid on it.`,
            });

            setIsOrderDialogOpen(false);
            setOrderForm({ quantity: '', shippingAddress: '', notes: '' });
            setSelectedItem(null);

            // Refresh data immediately
            await fetchData();
        } catch (error: unknown) {
            const err = error as { message?: string; details?: string; hint?: string; code?: string };
            console.error('Error creating order:', err?.message ?? err?.details ?? err?.hint ?? err?.code ?? error);
            toast({
                title: t("common.error"),
                description: getErrorMessage(error, "Failed to create order. Please try again."),
                variant: "destructive",
            });
        } finally {
            setPlacingOrder(false);
        }
    };

    const [placingBidRequest, setPlacingBidRequest] = useState(false);

    const handlePlaceBidRequest = async () => {
        if (!user) {
            toast({
                title: t("common.error"),
                description: t("buyer.mustLoginBidRequest"),
                variant: "destructive",
            });
            return;
        }

        // Validation
        const isIndia = bidForm.country === 'India';

        // Basic required fields
        if (!bidForm.productName || !bidForm.quantity || !bidForm.sellerBidRunningTime || !bidForm.country) {
            toast({
                title: t("common.error"),
                description: t("buyer.fillRequiredBidFields"),
                variant: "destructive",
            });
            return;
        }

        // India-specific validation
        if (isIndia) {
            if (!bidForm.pincode) {
                toast({
                    title: t("common.error"),
                    description: t("buyer.fillPincodeState"),
                    variant: "destructive",
                });
                return;
            }

            // Validate pincode (6 digits for India)
            if (bidForm.pincode.length !== 6) {
                toast({
                    title: t("common.error"),
                    description: t("buyer.invalidPincode"),
                    variant: "destructive",
                });
                return;
            }
        } else {
            // International order validation
            if (!bidForm.incoterms) {
                toast({
                    title: t("common.error"),
                    description: t("buyer.selectIncotermsValidation"),
                    variant: "destructive",
                });
                return;
            }
        }

        const quantity = parseInt(bidForm.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            toast({
                title: t("common.error"),
                description: "Please enter a valid quantity.",
                variant: "destructive",
            });
            return;
        }

        // Validate seller bid running time (in hours)
        const sellerBidHours = parseInt(bidForm.sellerBidRunningTime);
        if (isNaN(sellerBidHours) || sellerBidHours <= 0) {
            toast({
                title: t("common.error"),
                description: t("buyer.invalidSellerBidTime"),
                variant: "destructive",
            });
            return;
        }

        // Shipping bid running time auto-set to 24 hours
        const shippingBidHours = bidForm.shippingBidRunningTime ? parseInt(bidForm.shippingBidRunningTime) : 24;
        if (isNaN(shippingBidHours) || shippingBidHours <= 0) {
            toast({
                title: t("common.error"),
                description: t("buyer.invalidShippingBidTime"),
                variant: "destructive",
            });
            return;
        }

        setPlacingBidRequest(true);
        try {
            // First create the item if it doesn't exist
            // Note: For bid requests, we don't set sellerId since buyer is creating it
            const newItem = await createItem({
                name: bidForm.productName,
                description: `Bid Request: ${bidForm.productName}${bidForm.specification ? ` - ${bidForm.specification}` : ''}`,
                image: '/api/placeholder/400/300',
                price: 0, // Price will be determined by bids
                size: bidForm.size || 'As specified',
                category: selectedCatalogProduct?.category || 'General',
                condition: 'new',
                quantity: quantity,
                specifications: {
                    ...(bidForm.hsnCode && { 'HSN Code': bidForm.hsnCode }),
                    ...(bidForm.specification && { 'Specification': bidForm.specification }),
                    ...(bidForm.quality && { 'Quality Grade': QUALITY_GRADES.find(g => g.value === bidForm.quality)?.label || bidForm.quality }),
                    'Expected Delivery': bidForm.expectedDeliveryDate,
                    'Destination Country': bidForm.country,
                    ...(bidForm.country !== 'India' && bidForm.incoterms && { 'Incoterms': `${bidForm.incoterms} - ${INCOTERMS.find(i => i.code === bidForm.incoterms)?.name || bidForm.incoterms}` }),
                    'Seller Bid Running Time (hours)': String(sellerBidHours),
                    'Shipping Bid Running Time (hours)': String(shippingBidHours),
                },
                sellerId: null as any, // Bid request items don't have a seller initially
                status: 'active',
            });

            // Then create the order/bid request
            const isIndia = bidForm.country === 'India';
            const locationInfo = isIndia
                ? [bidForm.city, bidForm.state, bidForm.pincode].filter(Boolean).join(', ')
                : [bidForm.city, bidForm.state, bidForm.country].filter(Boolean).join(', ');
            const fullAddress = bidForm.shippingAddress
                ? `${bidForm.shippingAddress}, ${locationInfo}`
                : locationInfo;

            const orderNotes = [
                `${t("buyer.placeBidRequestTitle")}: ${localizedProductName(bidForm.productName)}.`,
                `${t("seller.quality")}: ${bidForm.quality || '-'}.`,
                `${t("seller.size")}: ${bidForm.size || '-'}.`,
                `${t("buyer.destination")}: ${bidForm.country}`,
                !isIndia ? `${t("buyer.incotermsRequired").replace(' *','')}: ${bidForm.incoterms}` : '',
                bidForm.notes ? `${t("common.notes")}: ${bidForm.notes}` : ''
            ].filter(Boolean).join(' ');

            await createOrder({
                itemId: newItem.id,
                buyerId: user.id,
                quantity: quantity,
                totalPrice: 0, // Will be determined by accepted bid
                status: 'pending',
                shippingAddress: fullAddress,
                notes: orderNotes,
            });

            toast({
                title: t("buyer.bidRequestPlacedTitle"),
                description: t("buyer.bidRequestPlacedDescription"),
            });

            setIsPlaceBidDialogOpen(false);
            setBidForm({
                productName: '',
                hsnCode: '',
                size: '',
                specification: '',
                quality: '',
                quantity: '',
                expectedDeliveryDate: '',
                pincode: '',
                city: '',
                state: '',
                country: 'India',
                incoterms: '',
                shippingAddress: '',
                notes: '',
                sellerBidRunningTime: '1',
                shippingBidRunningTime: '1',
            });
            setSelectedCatalogProduct(null);

            await fetchData();
        } catch (error: unknown) {
            const err = error as { message?: string; details?: string; hint?: string; code?: string };
            console.error('Error creating bid request:', err?.message ?? err?.details ?? err?.hint ?? err?.code ?? error);
            toast({
                title: t("common.error"),
                description: getErrorMessage(error, t("buyer.bidRequestFailed")),
                variant: "destructive",
            });
        } finally {
            setPlacingBidRequest(false);
        }
    };

    const handleAcceptBid = async (bidId: string) => {
        try {
            const bid = bids.find(b => b.id === bidId);
            if (!bid) {
                toast({
                    title: t("common.error"),
                    description: "Bid not found.",
                    variant: "destructive",
                });
                return;
            }

            // Find the lowest shipping bid for this order
            const orderShippingBids = shippingBids.filter(sb => sb.orderId === bid.orderId && sb.status === 'pending');
            const lowestShippingBid = orderShippingBids.length > 0
                ? orderShippingBids.reduce((lowest, sb) => sb.bidAmount < lowest.bidAmount ? sb : lowest)
                : null;

            // Accept the seller bid
            await updateBid(bidId, { status: 'accepted' });

            // Accept the lowest shipping bid if available
            if (lowestShippingBid) {
                await updateShippingBid(lowestShippingBid.id, { status: 'accepted' });
            }

            // Reject all other bids for this order
            const otherSellerBids = bids.filter(b => b.orderId === bid.orderId && b.id !== bidId && b.status === 'pending');
            const otherShippingBids = shippingBids.filter(sb => sb.orderId === bid.orderId && sb.id !== lowestShippingBid?.id && sb.status === 'pending');

            await Promise.all([
                ...otherSellerBids.map(b => updateBid(b.id, { status: 'rejected' })),
                ...otherShippingBids.map(sb => updateShippingBid(sb.id, { status: 'rejected' }))
            ]);

            // Also update the order status to accepted
            await updateOrder(bid.orderId, { status: 'accepted' });

            // Invalidate cache
            if (user) {
                LocalCache.remove(CacheKeys.orders(user.id));
                LocalCache.remove(CacheKeys.bids(user.id));
                LocalCache.remove(CacheKeys.shippingBids(user.id));
            }

            const totalCost = Number(bid.bidAmount) + (lowestShippingBid?.bidAmount ? Number(lowestShippingBid.bidAmount) : 0);
            toast({
                title: "Bid Accepted! ✅",
                description: `You've accepted the seller bid ($${Number(bid.bidAmount).toFixed(2)})${lowestShippingBid ? ` and shipping bid ($${Number(lowestShippingBid.bidAmount).toFixed(2)})` : ''}. Total: $${totalCost.toFixed(2)}`,
            });

            await fetchData(true);
        } catch (error: any) {
            console.error('Error accepting bid:', error);
            toast({
                title: t("common.error"),
                description: error?.message || "Failed to accept bid. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleRejectBid = async (bidId: string) => {
        try {
            const bid = bids.find(b => b.id === bidId);

            await updateBid(bidId, { status: 'rejected' });

            toast({
                title: "Bid Rejected",
                description: `The bid has been rejected.`,
            });

            await fetchData();
        } catch (error: any) {
            console.error('Error rejecting bid:', error);
            toast({
                title: t("common.error"),
                description: error?.message || "Failed to reject bid. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteBid = async (bidId: string) => {
        try {
            await deleteBid(bidId);

            toast({
                title: "Bid Deleted",
                description: "The bid has been permanently deleted.",
            });

            await fetchData();
        } catch (error: any) {
            console.error('Error deleting bid:', error);
            toast({
                title: t("common.error"),
                description: error?.message || "Failed to delete bid. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, newStatus: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled') => {
        try {
            await updateOrder(orderId, { status: newStatus });

            const statusMessages: Record<string, string> = {
                'completed': 'Order marked as completed',
                'cancelled': 'Order cancelled',
                'pending': 'Order status updated',
                'accepted': 'Order accepted',
                'rejected': 'Order rejected',
            };

            toast({
                title: "Status Updated",
                description: statusMessages[newStatus] || "Order status updated successfully.",
            });

            await fetchData();
        } catch (error: any) {
            console.error('Error updating order status:', error);
            toast({
                title: t("common.error"),
                description: error?.message || "Failed to update order status. Please try again.",
                variant: "destructive",
            });
        }
    };

    const [addingProduct, setAddingProduct] = useState(false);

    const handleAddProduct = async () => {
        if (!user) {
            toast({
                title: t("common.error"),
                description: "You must be logged in to add products.",
                variant: "destructive",
            });
            return;
        }

        // Validation
        if (!productForm.name || !productForm.description || !productForm.price ||
            !productForm.size || !productForm.category || !productForm.quantity) {
            toast({
                title: t("common.error"),
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }

        const price = parseFloat(productForm.price);
        const quantity = parseInt(productForm.quantity);

        if (isNaN(price) || price <= 0) {
            toast({
                title: t("common.error"),
                description: "Please enter a valid price.",
                variant: "destructive",
            });
            return;
        }

        if (isNaN(quantity) || quantity <= 0) {
            toast({
                title: t("common.error"),
                description: "Please enter a valid quantity.",
                variant: "destructive",
            });
            return;
        }

        setAddingProduct(true);
        try {
            // Add quality to specifications if selected
            const finalSpecifications = { ...productForm.specifications };
            if (productForm.quality) {
                const qualityLabel = QUALITY_GRADES.find(g => g.value === productForm.quality)?.label || productForm.quality;
                finalSpecifications['Quality Grade'] = qualityLabel;
            }

            await createItem({
                name: productForm.name,
                description: productForm.description,
                image: '/api/placeholder/400/300',
                price: price,
                size: productForm.size,
                category: productForm.category,
                condition: productForm.condition,
                quantity: quantity,
                specifications: finalSpecifications,
                sellerId: user.id,
                status: 'active',
            });

            toast({
                title: "Product Added Successfully! 🎉",
                description: `${productForm.name} has been added to the marketplace.`,
            });

            setIsAddProductDialogOpen(false);
            setProductForm({
                name: '',
                description: '',
                price: '',
                size: '',
                category: '',
                condition: 'new',
                quality: '',
                quantity: '',
                specifications: {},
            });
            setSpecKey('');
            setSpecValue('');

            await fetchData();
        } catch (error: any) {
            console.error('Error creating product:', error);
            toast({
                title: t("common.error"),
                description: error?.message || "Failed to create product. Please try again.",
                variant: "destructive",
            });
        } finally {
            setAddingProduct(false);
        }
    };

    const addSpecification = () => {
        if (specKey && specValue) {
            setProductForm({
                ...productForm,
                specifications: { ...productForm.specifications, [specKey]: specValue }
            });
            setSpecKey('');
            setSpecValue('');
        }
    };

    const removeSpecification = (key: string) => {
        const newSpecs = { ...productForm.specifications };
        delete newSpecs[key];
        setProductForm({ ...productForm, specifications: newSpecs });
    };

    const stats = {
        totalOrders: orders.length,
        confirmedOrders: orders.filter(o => o.status === 'accepted').length,
        deliveryPending: orders.filter(o => o.status === 'accepted' || o.status === 'pending').length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        totalSpent: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.totalPrice || 0), 0),
        activeBids: bids.filter(b => b.status === 'pending').length,
        totalItems: items.length,
    };

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
            pending: 'warning',
            accepted: 'success',
            rejected: 'destructive',
            completed: 'success',
            cancelled: 'destructive',
        };
        return variants[status] || 'secondary';
    };

    // ============================================================================
    // ANALYTICS DATA CALCULATIONS
    // ============================================================================

    // Calculate buyer stats
    const buyerStats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
        totalSpent: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.totalPrice || 0), 0),
        activeBidRequests: myBidOrders.length,
        totalBidsReceived: bids.length,
    };

    // Order Status Distribution for Pie Chart
    const orderStatusData = [
        { name: 'Pending', value: buyerStats.pendingOrders, fill: '#eab308' },
        { name: 'Completed', value: buyerStats.completedOrders, fill: '#22c55e' },
        { name: 'Cancelled', value: buyerStats.cancelledOrders, fill: '#ef4444' },
    ].filter(item => item.value > 0);

    // Calculate cost savings from bids
    const calculateSavings = () => {
        let totalSavings = 0;
        let totalOriginalCost = 0;

        myBidOrders.forEach(order => {
            const orderBids = bids.filter(b => b.orderId === order.id && b.status === 'pending');
            if (orderBids.length > 0) {
                const bidAmounts = orderBids.map(b => b.bidAmount);
                const lowest = Math.min(...bidAmounts);
                const highest = Math.max(...bidAmounts);
                totalSavings += (highest - lowest);
                totalOriginalCost += highest;
            }
        });

        return { totalSavings, totalOriginalCost, savingsPercent: totalOriginalCost > 0 ? ((totalSavings / totalOriginalCost) * 100) : 0 };
    };

    const savings = calculateSavings();

    // Monthly spending trend (last 6 months)
    // Cardamom price chart data
    const todayCardamomPrices = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayPrices = cardamomPrices.filter(p => {
            const d = new Date(p.arrivalDate);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
        });
        if (todayPrices.length > 0) return todayPrices;
        // fallback: latest available date
        if (cardamomPrices.length === 0) return [];
        const latestDate = new Date(Math.max(...cardamomPrices.map(p => new Date(p.arrivalDate).getTime())));
        latestDate.setHours(0, 0, 0, 0);
        return cardamomPrices.filter(p => {
            const d = new Date(p.arrivalDate);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === latestDate.getTime();
        });
    }, [cardamomPrices]);

    const cardamomPriceChartData = useMemo(() => {
        if (cardamomPrices.length === 0) return [];
        // Group by date, take avg modal price per date
        const byDate: Record<string, number[]> = {};
        cardamomPrices.forEach(p => {
            const d = new Date(p.arrivalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            if (!byDate[d]) byDate[d] = [];
            byDate[d].push(p.modalPrice);
        });
        return Object.entries(byDate)
            .map(([date, prices]) => ({ date, price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) }))
            .slice(-10);
    }, [cardamomPrices]);

    const monthlySpendingData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const now = new Date();
        const data = months.map((month, index) => {
            const monthIndex = (now.getMonth() - (5 - index) + 12) % 12;
            const year = now.getFullYear() - (now.getMonth() < (5 - index) ? 1 : 0);

            const monthOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate.getMonth() === monthIndex && orderDate.getFullYear() === year;
            });

            const spending = monthOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
            const orderCount = monthOrders.length;

            return { month, spending, orders: orderCount };
        });
        return data;
    }, [orders]);

    // Bid activity timeline (last 6 months)
    const bidActivityData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const now = new Date();
        const data = months.map((month, index) => {
            const monthIndex = (now.getMonth() - (5 - index) + 12) % 12;
            const year = now.getFullYear() - (now.getMonth() < (5 - index) ? 1 : 0);

            const monthBids = bids.filter(bid => {
                const bidDate = new Date(bid.createdAt);
                return bidDate.getMonth() === monthIndex && bidDate.getFullYear() === year;
            });

            return { month, bids: monthBids.length };
        });
        return data;
    }, [bids]);

    // Chart configurations
    const orderStatusChartConfig = {
        pending: { label: 'Pending', color: '#eab308' },
        completed: { label: 'Completed', color: '#22c55e' },
        cancelled: { label: 'Cancelled', color: '#ef4444' },
    };

    const spendingChartConfig = {
        spending: { label: 'Spending', color: '#8b5cf6' },
        orders: { label: 'Orders', color: '#3b82f6' },
    };

    if (authLoading || loading) {
        return (
            <DashboardLayout role="buyer">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <DashboardLayout role="buyer">
            <Toaster />
            <div className="relative min-h-[calc(100vh-4rem)]">
                {/* Background Effect - Only visible in dark mode */}
                <div className="fixed inset-0 z-0 pointer-events-none opacity-0 dark:opacity-50">
                    <BackgroundBeams />
                </div>

                <div className="relative z-10 space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {t("common.welcome")}, {user.name}
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">{t("buyer.pageTitle")}</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <ShoppingCart className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-foreground tabular-nums">{stats.totalOrders}</div>
                                        <div className="text-sm text-muted-foreground">{t("buyer.stats.totalOrders")}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                                        <Check className="h-5 w-5 text-success" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-foreground tabular-nums">{stats.confirmedOrders}</div>
                                        <div className="text-sm text-muted-foreground">{t("buyer.stats.acceptedBids")}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-info" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-foreground tabular-nums">{stats.deliveryPending}</div>
                                        <div className="text-sm text-muted-foreground">{t("buyer.stats.activeOrders")}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-warning" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-foreground tabular-nums">{stats.activeBids}</div>
                                        <div className="text-sm text-muted-foreground">{t("buyer.stats.pendingBids")}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Place Bid helper text (replaces previous button) */}
                    <div className="flex justify-start mb-6">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">
                            {t("buyer.createOrder")}
                        </h2>
                    </div>

                    {/* Main Content - Based on URL tab parameter */}
                    <div className="space-y-6">
                        {/* Browse Items Tab */}
                        {(currentTab === 'items' || !currentTab) && (
                            <div className="space-y-6">
                                {/* Category Filter and Search */}
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {/* Product Name */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="quick-product-name" className="text-sm font-medium">{t("buyer.selectProduct")}</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            id="quick-product-name"
                                                            placeholder={t("buyer.enterProductOrCatalog")}
                                                            value={bidForm.productName}
                                                            onChange={(e) => setBidForm({ ...bidForm, productName: e.target.value })}
                                                            className="flex-1"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => setIsSelectProductDialogOpen(true)}
                                                            title={t("buyer.catalog")}
                                                        >
                                                            <Search className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Quantity */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="quick-quantity" className="text-sm font-medium">{t("buyer.quantity")}</Label>
                                                    <Input
                                                        id="quick-quantity"
                                                        type="number"
                                                            placeholder={t("buyer.quantityPlaceholder")}
                                                        value={bidForm.quantity}
                                                        onChange={(e) => setBidForm({ ...bidForm, quantity: e.target.value })}
                                                    />
                                                </div>

                                                {/* Quality */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="quick-quality" className="text-sm font-medium">{t("seller.quality")}</Label>
                                                    <Select
                                                        value={bidForm.quality}
                                                        onValueChange={(value) => setBidForm({ ...bidForm, quality: value })}
                                                    >
                                                        <SelectTrigger id="quick-quality">
                                                            <SelectValue placeholder={t("buyer.qualityPlaceholder")} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {QUALITY_GRADES.map((grade) => (
                                                                <SelectItem key={grade.value} value={grade.value}>{grade.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Expected Delivery Date */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="quick-expected-date" className="text-sm font-medium">{t("buyer.expectedBy")}</Label>
                                                    <Input
                                                        id="quick-expected-date"
                                                        type="date"
                                                        value={bidForm.expectedDeliveryDate}
                                                        onChange={(e) => setBidForm({ ...bidForm, expectedDeliveryDate: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Continue Button */}
                                            <div className="flex justify-end pt-2">
                                                <Button
                                                    className="px-8"
                                                    onClick={() => setIsPlaceBidDialogOpen(true)}
                                                    disabled={!bidForm.productName || !bidForm.quantity}
                                                >
                                                    {t("common.confirm")}
                                                    <Send className="ml-2 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* My Bids (below the search/filter card, above Live Bids) */}
                                {myBidOrders.length > 0 && (
                                    <Card className="border-dashed bg-primary/5">
                                        <CardContent className="p-4 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-primary">{t("layout.myBids")}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {t("common.viewAll")}: {Math.min(myBidsShowAll ? filteredAndSortedMyBids.length : 10, filteredAndSortedMyBids.length)} / {filteredAndSortedMyBids.length}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={resetMyBidsFilters}
                                                        className="text-xs text-muted-foreground hover:text-foreground"
                                                    >
                                                        <X className="h-3 w-3 mr-1" />
                                                        {t("seller.clearFilters")}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Enhanced Search and Filter Controls for My Bids */}
                                            <div className="space-y-3">
                                                {/* Search Bar */}
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Search className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <Input
                                                        type="text"
                                                        placeholder={t("seller.searchOrdersPlaceholder")}
                                                        className="pl-10 h-8 text-sm"
                                                        value={myBidsSearchQuery}
                                                        onChange={(e) => setMyBidsSearchQuery(e.target.value)}
                                                    />
                                                    {myBidsSearchQuery && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute inset-y-0 right-0 pr-2 h-full"
                                                            onClick={() => setMyBidsSearchQuery('')}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>

                                                {/* Sort Controls */}
                                                <div className="flex flex-wrap gap-2 items-center text-xs">
                                                    <Filter className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-muted-foreground">{t("buyer.sortBy")}:</span>
                                                    <Select value={myBidsSortBy} onValueChange={(value: any) => setMyBidsSortBy(value)}>
                                                        <SelectTrigger className="w-[110px] h-6 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="date">{t("seller.sortDateCreated")}</SelectItem>
                                                            <SelectItem value="quantity">Quantity</SelectItem>
                                                            <SelectItem value="ending">{t("buyer.timeRemaining")}</SelectItem>
                                                            <SelectItem value="name">{t("common.name")}</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setMyBidsSortDirection(myBidsSortDirection === 'asc' ? 'desc' : 'asc')}
                                                        className="p-1 h-6"
                                                    >
                                                        {myBidsSortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                {filteredAndSortedMyBids.length === 0 ? (
                                                    <div className="text-center py-4 text-muted-foreground text-sm">
                                                        {myBidOrders.length === 0 ? t("buyer.noBids") : t("buyer.noBids")}
                                                    </div>
                                                ) : (
                                                    (myBidsShowAll ? filteredAndSortedMyBids : filteredAndSortedMyBids.slice(0, 10)).map((order, index) => {
                                                        const serial = index + 1;
                                                        const specifications = order.item?.specifications || {};
                                                        const hsnCode = (specifications as any)['HSN Code'] || '-';
                                                        const quality = (specifications as any)['Quality Grade'] || '-';
                                                        const size = order.item?.size || '-';
                                                        const expectedDelivery = (specifications as any)['Expected Delivery'] || '-';
                                                        const sellerBidHoursVal = (specifications as any)['Seller Bid Running Time (hours)'];
                                                        const sellerBidDaysVal = (specifications as any)['Seller Bid Running Time (days)'] || (specifications as any)['Bid Running Time (days)'];
                                                        const sellerBidTimeHours = sellerBidHoursVal || (sellerBidDaysVal ? String(parseInt(sellerBidDaysVal) * 24) : '-');
                                                        const remainingTime = calculateRemainingTime(order.createdAt.toString(), sellerBidTimeHours);
                                                        const pincodeMatch = order.shippingAddress?.match(/(\d{6})(?!.*\d{6})/);
                                                        const pincode = pincodeMatch ? pincodeMatch[1] : '-';

                                                        // Calculate bid statistics for this order
                                                        const orderBids = bids.filter(b => b.orderId === order.id && b.status === 'pending');
                                                        const bidAmounts = orderBids.map(b => b.bidAmount);
                                                        const lowestBid = bidAmounts.length > 0 ? Math.min(...bidAmounts) : null;
                                                        const highestBid = bidAmounts.length > 0 ? Math.max(...bidAmounts) : null;
                                                        const totalBids = orderBids.length;
                                                        const uniqueSellers = new Set(orderBids.map(b => b.sellerId || b.anonymizedSellerId)).size;

                                                        return (
                                                            <div
                                                                key={order.id}
                                                                className="flex flex-col gap-2 rounded-md bg-background px-4 py-4 border border-dashed border-primary/30"
                                                            >
                                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                                                    <div className="flex items-start gap-2 text-sm md:text-base">
                                                                        <span className="font-semibold w-5">{serial}.</span>
                                                                        <div className="space-y-0.5">
                                                                            <p className="font-medium line-clamp-1">
                                                                                {localizedProductName(order.item?.name) || t("buyer.newOrder")}
                                                                            </p>
                                                                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs md:text-sm text-muted-foreground">
                                                                                <span>{t("seller.hsnCode")}: <span className="font-medium text-foreground">{hsnCode}</span></span>
                                                                                <span>{t("seller.quality")}: <span className="font-medium text-foreground">{localizedProductMeta(quality)}</span></span>
                                                                                <span>{t("common.quantity")}: <span className="font-medium text-foreground tabular-nums">{order.quantity}</span></span>
                                                                                <span>{t("seller.size")}: <span className="font-medium text-foreground">{localizedProductMeta(size)}</span></span>
                                                                                <span>{t("seller.expectedDelivery")}: <span className="font-medium text-foreground">{expectedDelivery}</span></span>
                                                                                <span>{t("seller.pincode")}: <span className="font-medium text-foreground">{pincode}</span></span>
                                                                                <span className="flex items-center gap-1">
                                                                                    {t("buyer.timeRemaining")}:
                                                                                    <ClockTimer
                                                                                        endTime={calculateBidEndTime(order)}
                                                                                        size={16}
                                                                                    />
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex justify-end">
                                                                        <DropdownMenu
                                                                        open={openDropdowns[order.id] || false}
                                                                        onOpenChange={(isOpen) =>
                                                                            setOpenDropdowns(prev => ({ ...prev, [order.id]: isOpen }))
                                                                        }
                                                                    >
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="h-8 w-8 p-0"
                                                                            >
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="w-48">
                                                                            <DropdownMenuItem
                                                                                onClick={() => {
                                                                                    const specs = order.item?.specifications || {};
                                                                                    setBidForm({
                                                                                        productName: order.item?.name || '',
                                                                                        hsnCode: (specs as any)['HSN Code'] || '',
                                                                                        size: order.item?.size || '',
                                                                                        specification: (specs as any)['Specification'] || '',
                                                                                        quality: '',
                                                                                        quantity: String(order.quantity || ''),
                                                                                        expectedDeliveryDate: (specs as any)['Expected Delivery'] || '',
                                                                                        pincode,
                                                                                        city: '',
                                                                                        state: '',
                                                                                        country: 'India',
                                                                                        incoterms: '',
                                                                                        shippingAddress: order.shippingAddress || '',
                                                                                        notes: order.notes || '',
                                                                                        sellerBidRunningTime: (specs as any)['Seller Bid Running Time (hours)'] || ((specs as any)['Seller Bid Running Time (days)'] ? String(parseInt((specs as any)['Seller Bid Running Time (days)']) * 24) : '24'),
                                                                                        shippingBidRunningTime: (specs as any)['Shipping Bid Running Time (hours)'] || ((specs as any)['Shipping Bid Running Time (days)'] ? String(parseInt((specs as any)['Shipping Bid Running Time (days)']) * 24) : '24'),
                                                                                    });
                                                                                    setIsPlaceBidDialogOpen(true);
                                                                                    setOpenDropdowns(prev => ({ ...prev, [order.id]: false }));
                                                                                }}
                                                                            >
                                                                                <Copy className="mr-2 h-4 w-4" />
                                                                                Duplicate
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                onClick={() => {
                                                                                    const specs = order.item?.specifications || {};
                                                                                    setBidForm({
                                                                                        productName: order.item?.name || '',
                                                                                        hsnCode: (specs as any)['HSN Code'] || '',
                                                                                        size: order.item?.size || '',
                                                                                        specification: (specs as any)['Specification'] || '',
                                                                                        quality: '',
                                                                                        quantity: String(order.quantity || ''),
                                                                                        expectedDeliveryDate: (specs as any)['Expected Delivery'] || '',
                                                                                        pincode,
                                                                                        city: '',
                                                                                        state: '',
                                                                                        country: 'India',
                                                                                        incoterms: '',
                                                                                        shippingAddress: order.shippingAddress || '',
                                                                                        notes: order.notes || '',
                                                                                        sellerBidRunningTime: (specs as any)['Seller Bid Running Time (hours)'] || ((specs as any)['Seller Bid Running Time (days)'] ? String(parseInt((specs as any)['Seller Bid Running Time (days)']) * 24) : '24'),
                                                                                        shippingBidRunningTime: (specs as any)['Shipping Bid Running Time (hours)'] || ((specs as any)['Shipping Bid Running Time (days)'] ? String(parseInt((specs as any)['Shipping Bid Running Time (days)']) * 24) : '24'),
                                                                                    });
                                                                                    setIsPlaceBidDialogOpen(true);
                                                                                    setOpenDropdowns(prev => ({ ...prev, [order.id]: false }));
                                                                                }}
                                                                            >
                                                                                <Edit className="mr-2 h-4 w-4" />
                                                                                Modify
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                    </div>
                                                                </div>

                                                                {/* Bid Statistics and Price Comparison Bar */}
                                                                {totalBids > 0 && (
                                                                    <div className="mt-3 p-3 bg-success/10 rounded-lg border border-success/20">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <div className="flex items-center gap-4 text-xs">
                                                                                <div className="flex items-center gap-1">
                                                                                    <Users className="h-3 w-3 text-success" />
                                                                                    <span className="font-semibold text-success">{uniqueSellers} Supplier{uniqueSellers !== 1 ? 's' : ''}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <Trophy className="h-3 w-3 text-success" />
                                                                                    <span className="font-semibold text-success">{totalBids} Bid{totalBids !== 1 ? 's' : ''}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-xs font-medium text-success">
                                                                                Price Range
                                                                            </div>
                                                                        </div>

                                                                        {/* Visual Price Bar */}
                                                                        <div className="relative h-6 bg-background rounded-full overflow-hidden border border-success/30 mb-2">
                                                                            <div
                                                                                className="absolute h-full bg-success rounded-full"
                                                                                style={{ width: '100%' }}
                                                                            />
                                                                            <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-bold text-success-foreground tabular-nums">
                                                                                <span>₹{lowestBid?.toFixed(0)}</span>
                                                                                <span>₹{highestBid?.toFixed(0)}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Price Labels */}
                                                                        <div className="flex items-center justify-between text-xs">
                                                                            <div className="flex items-center gap-1">
                                                                                <div className="w-2 h-2 rounded-full bg-success"></div>
                                                                                <span className="font-medium text-success tabular-nums">Lowest: ₹{lowestBid?.toFixed(2)}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <div className="w-2 h-2 rounded-full bg-success"></div>
                                                                                <span className="font-medium text-success tabular-nums">Highest: ₹{highestBid?.toFixed(2)}</span>
                                                                            </div>
                                                                            {lowestBid && highestBid && lowestBid !== highestBid && (
                                                                                <span className="text-muted-foreground tabular-nums">
                                                                                    Savings: ₹{(highestBid - lowestBid).toFixed(2)} ({(((highestBid - lowestBid) / highestBid) * 100).toFixed(1)}%)
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* No Bids Message */}
                                                                {totalBids === 0 && (
                                                                    <div className="mt-3 p-3 bg-muted rounded-lg border border-border text-center">
                                                                <p className="text-xs text-muted-foreground">{t("buyer.noOrders")}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }))}
                                            </div>
                                            {filteredAndSortedMyBids.length > 10 && (
                                                <div className="flex justify-center pt-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs"
                                                        onClick={() => setMyBidsShowAll(!myBidsShowAll)}
                                                    >
                                                        {myBidsShowAll ? (
                                                            <>
                                                                <ChevronUp className="mr-1 h-3 w-3" />
                                                                {t("common.showLess")}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown className="mr-1 h-3 w-3" />
                                                                {t("common.viewAll")} {filteredAndSortedMyBids.length - 10} {t("seller.more")}
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Items Grid - only visible when a search term is entered */}
                                {itemSearchQuery ? (
                                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                        {filteredItems.map((item) => (
                                            <CardContainer key={item.id} className="inter-var w-full">
                                                <CardBody className="bg-card relative group/card border-border w-full h-auto rounded-xl p-6 border shadow-whisper">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <CardItem
                                                            translateZ="50"
                                                            className="text-xl font-bold text-foreground"
                                                        >
                                                            {localizedProductName(item.name)}
                                                        </CardItem>
                                                        {item.category && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {localizedProductMeta(item.category)}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <CardItem
                                                        as="p"
                                                        translateZ="60"
                                                        className="text-muted-foreground text-sm max-w-sm mt-2 line-clamp-2"
                                                    >
                                                        {item.description}
                                                    </CardItem>
                                                    <CardItem translateZ="100" className="w-full mt-4">
                                                        <div className="flex items-center justify-center w-full h-40 bg-accent rounded-xl">
                                                            <Package className="h-16 w-16 text-accent-foreground" />
                                                        </div>
                                                    </CardItem>
                                                    <div className="flex justify-between items-center mt-8">
                                                        <CardItem
                                                            translateZ={20}
                                                            className="px-4 py-2 rounded-xl text-xs font-normal"
                                                        >
                                                            <span className="text-2xl font-bold text-primary tabular-nums">${item.price}</span>
                                                            <span className="text-muted-foreground ml-1">/ {item.size}</span>
                                                        </CardItem>
                                                        <CardItem
                                                            translateZ={20}
                                                            as="button"
                                                            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-colors"
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setIsItemDetailsDialogOpen(true);
                                                            }}
                                                        >
                                                            {t("common.details")}
                                                        </CardItem>
                                                    </div>
                                                </CardBody>
                                            </CardContainer>
                                        ))}

                                        {filteredItems.length === 0 && (
                                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                                                <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                                <h3 className="font-semibold text-lg">{t("buyer.noItems")}</h3>
                                                <p className="text-muted-foreground text-sm mt-1">
                                                    {t("buyer.filterByCategory")}
                                                </p>
                                                <Button
                                                    variant="link"
                                                    onClick={() => {
                                                        setItemSearchQuery('');
                                                        setItemCategoryFilter('all');
                                                    }}
                                                >
                                                    {t("seller.clearFilters")}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* My Orders Tab */}
                        {currentTab === 'orders' && (
                            <div className="space-y-4">
                                <div className="grid gap-4">
                                    {orders.map((order) => (
                                        <Card key={order.id}>
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <Package className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div>
                                                            <CardTitle>{localizedProductName(order.item?.name) || 'Unknown Item'}</CardTitle>
                                                            <CardDescription>Order #{order.id.slice(0, 8)} • {new Date(order.createdAt).toLocaleDateString()}</CardDescription>
                                                        </div>
                                                    </div>
                                                    <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="p-3 bg-muted rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.quantity")}</Label>
                                                        <p className="font-semibold tabular-nums">{order.quantity} units</p>
                                                    </div>
                                                    <div className="p-3 bg-muted rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.price")}</Label>
                                                        <p className="font-semibold text-primary tabular-nums">${(order.totalPrice || 0).toFixed(2)}</p>
                                                    </div>
                                                    <div className="p-3 bg-muted rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.status")}</Label>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold capitalize">{order.status}</p>
                                                            {order.status === 'pending' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                                                    className="h-6 text-xs"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            )}
                                                            {order.status === 'accepted' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                                                    className="h-6 text-xs"
                                                                >
                                                                    Mark Complete
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-muted rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Updated</Label>
                                                        <p className="font-semibold">{new Date(order.updatedAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Seller Bids Tab */}
                        {currentTab === 'bids' && (
                            <div className="space-y-4">
                                <div className="grid gap-4">
                                    {bids.map((bid) => (
                                        <Card key={bid.id} className="overflow-hidden relative">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle>Bid from Vendor #{bid.id.slice(0, 6).toUpperCase()}</CardTitle>
                                                        <CardDescription>
                                                            Order #{bid.orderId.slice(0, 8)} • {new Date(bid.createdAt).toLocaleDateString()}
                                                        </CardDescription>
                                                    </div>
                                                    <Badge variant={getStatusVariant(bid.status)}>{bid.status}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    <div className="p-3 bg-muted rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t("buyer.bidAmount")}</Label>
                                                        <p className="text-xl font-bold text-primary tabular-nums">${Number(bid.bidAmount).toFixed(2)}</p>
                                                    </div>
                                                    <div className="p-3 bg-muted rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t("buyer.estimatedDelivery")}</Label>
                                                        <p className="font-medium">{new Date(bid.estimatedDelivery).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="p-3 bg-muted rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.status")}</Label>
                                                        <p className="font-medium capitalize">{bid.status}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            {bid.status === 'pending' && (
                                                <CardFooter className="gap-3 bg-muted/50 p-4">
                                                    <Button
                                                        className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                                                        onClick={() => handleAcceptBid(bid.id)}
                                                    >
                                                        <Check className="mr-2 h-4 w-4" />
                                                        {t("buyer.acceptBid")}
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        className="flex-1"
                                                        onClick={() => handleRejectBid(bid.id)}
                                                    >
                                                        <X className="mr-2 h-4 w-4" />
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={() => handleDeleteBid(bid.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </Button>
                                                </CardFooter>
                                            )}
                                            {bid.status !== 'pending' && (
                                                <CardFooter className="gap-3 bg-muted/50 p-4">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={() => handleDeleteBid(bid.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Bid
                                                    </Button>
                                                </CardFooter>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Live Bids Section - Always visible at the end */}
                    {bids.filter(b => b.status === 'pending').length > 0 && (
                        <div className="space-y-6 mt-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 bg-success rounded-full animate-pulse" />
                                    <h2 className="text-xl font-semibold text-foreground">{t("buyer.sellerBids")}</h2>
                                    <Badge variant="secondary" className="ml-2">{filteredAndSortedLiveBids.length} active</Badge>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetLiveBidsFilters}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="mr-1 h-4 w-4" />
                                    Clear Filters
                                </Button>
                            </div>

                            {/* Enhanced Search and Filter Controls for Live Bids */}
                            <div className="space-y-4">
                                {/* Search Bar */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder={t("buyer.liveBidsSearchPlaceholder")}
                                        className="pl-10 h-10 text-sm"
                                        value={liveBidsSearchQuery}
                                        onChange={(e) => setLiveBidsSearchQuery(e.target.value)}
                                    />
                                    {liveBidsSearchQuery && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute inset-y-0 right-0 pr-3 h-full"
                                            onClick={() => setLiveBidsSearchQuery('')}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Sort Controls */}
                                <div className="flex flex-wrap gap-4 items-center">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">{t("buyer.sortBy")}:</span>
                                        <Select value={liveBidsSortBy} onValueChange={(value: any) => setLiveBidsSortBy(value)}>
                                            <SelectTrigger className="w-[140px] h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ending">{t("buyer.sortEndingTime")}</SelectItem>
                                                <SelectItem value="date">{t("seller.sortDateCreated")}</SelectItem>
                                                <SelectItem value="amount">{t("seller.sortBidAmount")}</SelectItem>
                                                <SelectItem value="delivery">{t("seller.sortDeliveryDate")}</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setLiveBidsSortDirection(liveBidsSortDirection === 'asc' ? 'desc' : 'asc')}
                                            className="p-2 h-8"
                                        >
                                            {liveBidsSortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {filteredAndSortedLiveBids.length === 0 ? (
                                    <Card className="p-8 text-center">
                                        <div className="h-3 w-3 bg-muted-foreground/40 rounded-full animate-pulse mx-auto mb-4" />
                                        <p className="text-muted-foreground">
                                            {bids.filter(b => b.status === 'pending').length === 0 ? t("buyer.noLiveBids") : t("buyer.noBidsMatchSearch")}
                                        </p>
                                        {liveBidsSearchQuery && (
                                            <Button
                                                variant="outline"
                                                className="mt-4"
                                                onClick={resetLiveBidsFilters}
                                            >
                                                {t("seller.clearFilters")}
                                            </Button>
                                        )}
                                    </Card>
                                ) : (
                                    (liveBidsShowAll ? filteredAndSortedLiveBids : filteredAndSortedLiveBids.slice(0, 5)).map((bid) => {
                                        const order = orders.find(o => o.id === bid.orderId);
                                        const timeLeftLabel = getBidTimeLeftLabel(order);
                                        const isExpired = timeLeftLabel === 'Expired';

                                        // Check if order is domestic or international
                                        const destinationCountry = order?.item?.specifications?.['Destination Country'] || 'India';
                                        const isInternational = destinationCountry !== 'India';

                                        // Find the lowest shipping bid for this order
                                        const orderShippingBids = shippingBids.filter(sb => sb.orderId === bid.orderId && sb.status === 'pending');
                                        const lowestShippingBid = orderShippingBids.length > 0
                                            ? orderShippingBids.reduce((lowest, sb) => sb.bidAmount < lowest.bidAmount ? sb : lowest)
                                            : null;
                                        const totalCost = bid.bidAmount + (lowestShippingBid?.bidAmount || 0);

                                        // Calculate bid comparison - find all bids for this order
                                        const allOrderBids = bids.filter(b => b.orderId === bid.orderId && b.status === 'pending');
                                        const highestBid = allOrderBids.length > 0 ? Math.max(...allOrderBids.map(b => b.bidAmount)) : bid.bidAmount;
                                        const percentLowerThanHighest = highestBid > 0 && bid.bidAmount < highestBid
                                            ? ((highestBid - bid.bidAmount) / highestBid * 100).toFixed(1)
                                            : null;

                                        return (
                                            <Card key={bid.id} className="overflow-hidden relative">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                                <CardHeader>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <CardTitle>
                                                                {order?.item?.name || `Order #${bid.orderId.slice(0, 8)}`}
                                                            </CardTitle>
                                                            <CardDescription>
                                                                Enquiry Number #{bid.sellerId?.slice(0, 6).toUpperCase() || bid.id.slice(0, 6).toUpperCase()} • {new Date(bid.createdAt).toLocaleDateString()}
                                                            </CardDescription>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                                                                <Badge variant="success">Live</Badge>
                                                            </div>
                                                            <div className={`flex items-center gap-2 mt-1 px-3 py-1.5 rounded-full border ${isExpired ? 'bg-destructive/10 border-destructive/20' : 'bg-warning/10 border-warning/20'}`}>
                                                                <ClockTimer
                                                                    endTime={order ? calculateBidEndTime(order) : new Date()}
                                                                    size={18}
                                                                    className="font-extrabold text-sm tracking-wide"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    <div className={`grid ${isInternational ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'} gap-4`}>
                                                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                                                            <Label className="text-xs text-primary uppercase tracking-wider">{t("buyer.sellerBidLabel")}</Label>
                                                            <p className="text-xl font-bold text-primary tabular-nums">${Number(bid.bidAmount).toFixed(2)}</p>
                                                            <p className="text-[10px] text-primary/80 mt-0.5">{t("buyer.exclusiveGST")}</p>
                                                        </div>
                                                        {isInternational && (
                                                            <>
                                                                <div className="p-3 bg-info/10 rounded-lg border border-info/20">
                                                                    <Label className="text-xs text-info uppercase tracking-wider">{t("buyer.shippingCostLabel")}</Label>
                                                                    <p className="text-xl font-bold text-info tabular-nums">
                                                                        {lowestShippingBid ? `$${Number(lowestShippingBid.bidAmount).toFixed(2)}` : t("buyer.noBidYet")}
                                                                    </p>
                                                                    {orderShippingBids.length > 1 && (
                                                                        <p className="text-xs text-muted-foreground mt-1">{orderShippingBids.length} {t("buyer.shippingBidsCount")}</p>
                                                                    )}
                                                                </div>
                                                                <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                                                                    <Label className="text-xs text-success uppercase tracking-wider">{t("buyer.totalCostLabel")}</Label>
                                                                    <p className="text-2xl font-bold text-success tabular-nums">${Number(totalCost).toFixed(2)}</p>
                                                                </div>
                                                            </>
                                                        )}
                                                        <div className="p-3 bg-muted rounded-lg">
                                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.quantity")}</Label>
                                                            <p className="font-medium tabular-nums">{order?.quantity || 'N/A'} {t("seller.units")}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-muted rounded-lg">
                                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t("buyer.estimatedDelivery")}</Label>
                                                        <p className="font-medium">{new Date(bid.estimatedDelivery).toLocaleDateString()}</p>
                                                    </div>

                                                    {/* Pickup Address - Hidden as per requirements */}

                                                    {/* Bid Comparison */}
                                                    {percentLowerThanHighest && allOrderBids.length > 1 && (
                                                        <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center justify-center w-8 h-8 bg-success rounded-full">
                                                                    <TrendingDown className="h-4 w-4 text-success-foreground" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <Label className="text-xs text-success uppercase tracking-wider font-bold">{t("buyer.bestValueLabel")}</Label>
                                                                    <p className="text-sm font-bold text-success mt-0.5">
                                                                        {t("buyer.bestValueLabel")}: {percentLowerThanHighest}% lower
                                                                    </p>
                                                                    <p className="text-xs text-success mt-1">
                                                                        {allOrderBids.length - 1} {allOrderBids.length - 1 > 1 ? t("seller.otherSellers") : t("seller.otherSeller")}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Display shipping details including Incoterms */}
                                                    {order?.item?.specifications && (
                                                        <>
                                                            {order.item.specifications['Destination Country'] && order.item.specifications['Destination Country'] !== 'India' && order.item.specifications['Incoterms'] && (
                                                                <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                                                                    <Label className="text-xs text-warning uppercase tracking-wider">{t("buyer.internationalShipping")}</Label>
                                                                    <div className="mt-1 space-y-1">
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-muted-foreground">{t("buyer.destination")}:</span>
                                                                            <span className="font-medium">{order.item.specifications['Destination Country']}</span>
                                                                        </div>
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-muted-foreground">{t("buyer.incotermsLabel")}:</span>
                                                                            <span className="font-medium text-warning">{order.item.specifications['Incoterms']}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {order.item.specifications['Destination Country'] && order.item.specifications['Destination Country'] === 'India' && (
                                                                <div className="p-3 bg-info/10 rounded-lg border border-info/20">
                                                                    <Label className="text-xs text-info uppercase tracking-wider">{t("buyer.domesticShipping")}</Label>
                                                                    <div className="mt-1">
                                                                        <div className="flex justify-between text-sm">
                                                                            <span className="text-muted-foreground">{t("buyer.destination")}:</span>
                                                                            <span className="font-medium">{t("buyer.indiaDomestic")}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </CardContent>
                                                <CardFooter className="gap-3 bg-muted/50 p-4">
                                                    <Button
                                                        className="w-32 rounded-lg bg-success hover:bg-success/90 text-success-foreground"
                                                        onClick={() => handleAcceptBid(bid.id)}
                                                    >
                                                        <Check className="mr-2 h-4 w-4" />
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        className="w-32 rounded-lg"
                                                        onClick={() => handleRejectBid(bid.id)}
                                                    >
                                                        <X className="mr-2 h-4 w-4" />
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="w-32 rounded-lg"
                                                        onClick={() => handleDeleteBid(bid.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        );
                                    }))}

                                {/* Load More button for Live Bids */}
                                {filteredAndSortedLiveBids.length > 5 && (
                                    <div className="flex justify-center">
                                        <Button
                                            variant="outline"
                                            className="w-full max-w-xs"
                                            onClick={() => setLiveBidsShowAll(!liveBidsShowAll)}
                                        >
                                            {liveBidsShowAll ? (
                                                <>
                                                    <ChevronUp className="mr-2 h-4 w-4" />
                                                    Show Less
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="mr-2 h-4 w-4" />
                                                    Show {filteredAndSortedLiveBids.length - 5} More
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Analytics Section */}
                    <div className="space-y-6 mt-12">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold text-foreground">{t("buyer.analytics")}</h2>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* Order Status Pie Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <PieChart className="h-5 w-5 text-primary" />
                                        {t("buyer.orderStatusDistribution")}
                                    </CardTitle>
                                    <CardDescription>{t("buyer.ordersOverview")}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {orderStatusData.length > 0 ? (
                                        <ChartContainer config={orderStatusChartConfig} className="h-[220px] w-full">
                                            <RechartsPieChart>
                                                <Pie
                                                    data={orderStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    label={({ name, percent }) => percent !== undefined ? `${name} ${(percent * 100).toFixed(0)}%` : name}
                                                    labelLine={false}
                                                >
                                                    {orderStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <ChartTooltip content={<ChartTooltipContent />} />
                                            </RechartsPieChart>
                                        </ChartContainer>
                                    ) : (
                                        <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                                            <div className="text-center">
                                                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                <p>{t("buyer.noOrderData")}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-center gap-4 mt-4 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-warning" />
                                            <span className="text-xs text-muted-foreground">{t("status.pending")} ({buyerStats.pendingOrders})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-success" />
                                            <span className="text-xs text-muted-foreground">{t("status.completed")} ({buyerStats.completedOrders})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full bg-destructive" />
                                            <span className="text-xs text-muted-foreground">{t("status.cancelled")} ({buyerStats.cancelledOrders})</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Procurement Metrics */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        {t("buyer.procurementMetrics")}
                                    </CardTitle>
                                    <CardDescription>{t("buyer.purchasingActivity")}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex flex-col items-center">
                                        <div className="relative h-32 w-32">
                                            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                                                <circle
                                                    cx="50" cy="50" r="40"
                                                    stroke="currentColor" strokeWidth="8" fill="none"
                                                    strokeDasharray={`${Math.min((buyerStats.totalBidsReceived / Math.max(buyerStats.activeBidRequests, 1)) * 2.51, 251)} 251`}
                                                    className="text-primary"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                <span className="text-3xl font-bold text-foreground tabular-nums">{buyerStats.totalBidsReceived}</span>
                                                <span className="text-xs text-muted-foreground">{t("seller.bidCount")}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">{t("buyer.totalBidsReceived")}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-primary/10 rounded-lg">
                                            <p className="text-2xl font-bold text-primary tabular-nums">{buyerStats.activeBidRequests}</p>
                                            <p className="text-xs text-muted-foreground">{t("buyer.activeRequests")}</p>
                                        </div>
                                        <div className="text-center p-3 bg-info/10 rounded-lg">
                                            <p className="text-2xl font-bold text-info tabular-nums">{buyerStats.totalOrders}</p>
                                            <p className="text-xs text-muted-foreground">{t("buyer.stats.totalOrders")}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Cost Savings Summary */}
                            <Card className="bg-success text-success-foreground border-transparent">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg text-success-foreground">
                                        <DollarSign className="h-5 w-5" />
                                        {t("buyer.costSavingsSummary")}
                                    </CardTitle>
                                    <CardDescription className="text-success-foreground/80">{t("buyer.procurementSavings")}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-white/20 rounded-lg">
                                            <span className="text-success-foreground/80">{t("buyer.stats.totalSpent")}</span>
                                            <span className="text-xl font-bold tabular-nums">₹{Number(buyerStats.totalSpent).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white/20 rounded-lg">
                                            <span className="text-success-foreground/80">{t("buyer.potentialSavings")}</span>
                                            <span className="text-xl font-bold tabular-nums">₹{Number(savings.totalSavings).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-white/20 rounded-lg">
                                            <span className="text-success-foreground/80">{t("buyer.savingsRate")}</span>
                                            <span className="text-xl font-bold tabular-nums">
                                                {savings.savingsPercent.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Full Width Charts */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Monthly Spending Trends */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Activity className="h-5 w-5 text-primary" />
                                        {t("buyer.monthlySpendingTrends")}
                                    </CardTitle>
                                    <CardDescription>{t("buyer.spendingOverTime")}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={spendingChartConfig} className="h-[250px] w-full">
                                        <AreaChart data={monthlySpendingData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                            <XAxis dataKey="month" className="text-xs" />
                                            <YAxis className="text-xs" />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Area type="monotone" dataKey="spending" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSpending)" />
                                        </AreaChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>

                            {/* Bid Activity Timeline */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Trophy className="h-5 w-5 text-primary" />
                                        {t("buyer.bidActivityTimeline")}
                                    </CardTitle>
                                    <CardDescription>{t("buyer.bidsPerMonth")}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChartContainer config={spendingChartConfig} className="h-[250px] w-full">
                                        <LineChart data={bidActivityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                            <XAxis dataKey="month" className="text-xs" />
                                            <YAxis className="text-xs" />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Line type="monotone" dataKey="bids" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                                        </LineChart>
                                    </ChartContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Market Price Chart & Today's Prices */}
                        <div className="space-y-4 mt-6">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-success" />
                                <h3 className="text-lg font-semibold text-foreground">{t("cardamom.pageTitle")}</h3>
                                {cardamomStats && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                        {t("cardamom.lastUpdatedPrefix")} {new Date(cardamomStats.lastUpdated).toLocaleDateString('en-IN')}
                                    </span>
                                )}
                            </div>
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Price History Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <BarChart3 className="h-5 w-5 text-success" />
                                            {t("cardamom.priceHistoryTitle")}
                                        </CardTitle>
                                        <CardDescription>{t("cardamom.priceHistoryDesc")}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {cardamomPriceChartData.length > 0 ? (
                                            <ChartContainer config={{ price: { label: t('cardamom.modalPriceLabel'), color: '#16a34a' } }} className="h-[250px] w-full">
                                                <LineChart data={cardamomPriceChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="buyerPriceGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                                                    <ChartTooltip content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-popover border border-border rounded-lg p-2 shadow-micro">
                                                                    <p className="text-sm font-medium">{payload[0].payload.date}</p>
                                                                    <p className="text-xs text-success tabular-nums">₹{payload[0].value}{t("common.perKg")}</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }} />
                                                    <Line type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a', r: 4 }} />
                                                </LineChart>
                                            </ChartContainer>
                                        ) : (
                                            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                                <div className="text-center">
                                                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                                    <p className="text-sm">{t("cardamom.noData")}</p>
                                                    <p className="text-xs mt-1">{t("cardamom.visitMarketPrices")}</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Today's Prices */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Calendar className="h-5 w-5 text-success" />
                                            {t("cardamom.todaysPrices")}
                                        </CardTitle>
                                        <CardDescription>
                                            {todayCardamomPrices.length > 0
                                                ? `${todayCardamomPrices.length} listings — ${new Date(todayCardamomPrices[0].arrivalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                                : t('cardamom.latestAvailablePrices')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {todayCardamomPrices.length > 0 ? (
                                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                                {cardamomStats && (
                                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                                        <div className="text-center p-2 bg-success/10 rounded-lg">
                                                            <p className="text-xs text-muted-foreground">{t("cardamom.minPrice")}</p>
                                                            <p className="text-sm font-bold text-success tabular-nums">₹{cardamomStats.minPrice}</p>
                                                        </div>
                                                        <div className="text-center p-2 bg-info/10 rounded-lg">
                                                            <p className="text-xs text-muted-foreground">{t("cardamom.avgPrice")}</p>
                                                            <p className="text-sm font-bold text-info tabular-nums">₹{Math.round(cardamomStats.avgPrice)}</p>
                                                        </div>
                                                        <div className="text-center p-2 bg-warning/10 rounded-lg">
                                                            <p className="text-xs text-muted-foreground">{t("cardamom.maxPrice")}</p>
                                                            <p className="text-sm font-bold text-warning tabular-nums">₹{cardamomStats.maxPrice}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {todayCardamomPrices.slice(0, 8).map((p, i) => (
                                                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-foreground truncate">{p.variety}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{p.market}{p.state ? `, ${p.state}` : ''}</p>
                                                        </div>
                                                        <div className="text-right ml-3 flex-shrink-0">
                                                            <p className="text-sm font-bold text-success tabular-nums">₹{p.modalPrice}<span className="text-xs font-normal text-muted-foreground">{t("common.perKg")}</span></p>
                                                            {p.minPrice && p.maxPrice && (
                                                                <p className="text-xs text-muted-foreground tabular-nums">₹{p.minPrice}–₹{p.maxPrice}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {todayCardamomPrices.length > 8 && (
                                                    <p className="text-xs text-center text-muted-foreground pt-1">+{todayCardamomPrices.length - 8} more — <a href="/dashboard/cardamom-prices" className="text-primary hover:underline">{t("cardamom.viewAll")}</a></p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                                                <div className="text-center">
                                                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                                                    <p className="text-sm">{t("cardamom.noPricesToday")}</p>
                                                    <p className="text-xs mt-1">
                                                        <a href="/dashboard/cardamom-prices" className="text-primary hover:underline">{t("cardamom.refreshMarketData")}</a>
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Historical Price Charts */}
                            <div className="space-y-6 mt-2">
                                <HistoricalPriceChart isDark={resolvedTheme === "dark"} />
                                <YearComparisonChart isDark={resolvedTheme === "dark"} />
                            </div>
                        </div>
                    </div>

                    {/* Place Order Dialog */}
                    <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t("buyer.placeOrder")}</DialogTitle>
                                <DialogDescription>{t("buyer.orderDetails")}: {localizedProductName(selectedItem?.name)}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>{t("common.quantity")}</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={orderForm.quantity}
                                        onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>{t("buyer.deliveryAddress")}</Label>
                                    <Textarea
                                        value={orderForm.shippingAddress}
                                        onChange={(e) => setOrderForm({ ...orderForm, shippingAddress: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <Label>{t("common.notes")}</Label>
                                    <Textarea
                                        value={orderForm.notes}
                                        onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                                {selectedItem && orderForm.quantity && (
                                    <div className="p-3 bg-muted rounded-lg">
                                        <Label>{t("common.price")}</Label>
                                        <p className="text-2xl font-bold text-primary tabular-nums">
                                            ${(selectedItem.price * parseInt(orderForm.quantity)).toFixed(2)}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsOrderDialogOpen(false)}
                                    disabled={placingOrder}
                                >
                                    {t("common.cancel")}
                                </Button>
                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={!orderForm.quantity || !orderForm.shippingAddress || placingOrder}
                                >
                                    {placingOrder ? t("common.loading") : t("buyer.placeOrder")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Item Details Dialog */}
                    <Dialog open={isItemDetailsDialogOpen} onOpenChange={setIsItemDetailsDialogOpen}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{localizedProductName(selectedItem?.name)}</DialogTitle>
                                <DialogDescription>{selectedItem?.description}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="relative h-64 bg-muted rounded-lg">
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                        <Package className="h-32 w-32" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">{t("common.price")}</Label>
                                        <p className="text-2xl font-bold text-primary tabular-nums">${selectedItem?.price}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">{t("seller.size")}</Label>
                                        <p className="text-lg font-medium">{selectedItem?.size}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">{t("common.category")}</Label>
                                        <p className="text-lg font-medium">{selectedItem?.category}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Condition</Label>
                                        <p className="text-lg font-medium capitalize">{selectedItem?.condition}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Available Stock</Label>
                                        <p className="text-lg font-medium">{selectedItem?.quantity} units</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Listed By</Label>
                                        <p className="text-lg font-medium">Verified Vendor</p>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <Label className="text-lg font-semibold mb-2 block">Specifications</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(selectedItem?.specifications || {}).map(([key, value]) => (
                                            <div key={key} className="bg-muted p-3 rounded-lg">
                                                <p className="text-sm text-muted-foreground">{key}</p>
                                                <p className="font-medium">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="flex-col sm:flex-row gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setIsItemDetailsDialogOpen(false);
                                        setOrderForm({
                                            quantity: '1',
                                            shippingAddress: '',
                                            notes: '',
                                        });
                                        setIsOrderDialogOpen(true);
                                    }}
                                >
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Place Order
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => {
                                        setIsItemDetailsDialogOpen(false);
                                        setBidForm({
                                            ...bidForm,
                                            productName: selectedItem?.name || '',
                                            size: selectedItem?.size || '',
                                            specification: selectedItem?.specifications?.['Variety/Grade'] || '',
                                            quality: selectedItem?.specifications?.['Quality Grade'] || '',
                                        });
                                        setIsPlaceBidDialogOpen(true);
                                    }}
                                >
                                    <Package className="mr-2 h-4 w-4" />
                                    {t("buyer.placeBidRequestTitle")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Select from Catalog Dialog */}
                    <Dialog open={isSelectProductDialogOpen} onOpenChange={setIsSelectProductDialogOpen}>
                        <DialogContent className="max-w-4xl max-h-[85vh]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">Product Catalog</DialogTitle>
                                <DialogDescription>
                                    Search by product name or HSN code to quickly find and add products
                                </DialogDescription>
                            </DialogHeader>

                            {/* Search and Filter */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or HSN code (e.g., 0909, Cumin)..."
                                        value={catalogSearchQuery}
                                        onChange={(e) => setCatalogSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="w-full sm:w-[200px]">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        <SelectItem value="Spices">🌶️ Spices</SelectItem>
                                        <SelectItem value="Vegetables">🥬 Vegetables</SelectItem>
                                        <SelectItem value="Pulses">🫘 Pulses</SelectItem>
                                        <SelectItem value="Dry Fruits & Nuts">🥜 Dry Fruits & Nuts</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Category Quick Filters */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge
                                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    All ({ALL_PRODUCTS.length})
                                </Badge>
                                <Badge
                                    variant={selectedCategory === 'Spices' ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                                    onClick={() => setSelectedCategory('Spices')}
                                >
                                    🌶️ Spices ({PRODUCT_CATALOG.spices.length})
                                </Badge>
                                <Badge
                                    variant={selectedCategory === 'Vegetables' ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                                    onClick={() => setSelectedCategory('Vegetables')}
                                >
                                    🥬 Vegetables ({PRODUCT_CATALOG.vegetables.length})
                                </Badge>
                                <Badge
                                    variant={selectedCategory === 'Pulses' ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                                    onClick={() => setSelectedCategory('Pulses')}
                                >
                                    🫘 Pulses ({PRODUCT_CATALOG.pulses.length})
                                </Badge>
                                <Badge
                                    variant={selectedCategory === 'Dry Fruits & Nuts' ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                                    onClick={() => setSelectedCategory('Dry Fruits & Nuts')}
                                >
                                    🥜 Dry Fruits ({PRODUCT_CATALOG.dry_fruits_and_nuts.length})
                                </Badge>
                            </div>

                            {/* Results Count */}
                            <p className="text-sm text-muted-foreground mb-2">
                                {filteredCatalogProducts.length} products found
                                {catalogSearchQuery && ` for "${catalogSearchQuery}"`}
                            </p>

                            {/* Product Grid */}
                            <ScrollArea className="h-[400px] pr-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredCatalogProducts.map((product, index) => (
                                        <Card
                                            key={`${product.name}-${index}`}
                                            className="hover:border-primary/40 transition-colors group"
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                                                        {localizedProductName(product.name)}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-1 mt-2">
                                                        <Badge variant="secondary" className="text-xs">
                                                            HSN: {product.hsn}
                                                        </Badge>
                                                        <Badge variant="warning" className="text-xs">
                                                            {localizedProductMeta(product.variety)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {localizedProductMeta(product.category)}
                                                    </p>
                                                </div>
                                                <div className="mt-3">
                                                    <Button
                                                        size="sm"
                                                        className="w-full text-xs"
                                                        onClick={() => selectCatalogProductForBid(product)}
                                                    >
                                                        <Send className="h-3 w-3 mr-1" />
                                                        Place Bid
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {filteredCatalogProducts.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <h3 className="font-semibold text-lg">No products found</h3>
                                        <p className="text-muted-foreground text-sm mt-1">
                                            Try a different search term or category
                                        </p>
                                        <Button
                                            variant="link"
                                            onClick={() => {
                                                setCatalogSearchQuery('');
                                                setSelectedCategory('all');
                                            }}
                                        >
                                            Clear filters
                                        </Button>
                                    </div>
                                )}
                            </ScrollArea>

                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setIsSelectProductDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setIsSelectProductDialogOpen(false);
                                        setIsPlaceBidDialogOpen(true);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Enter Custom Product
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Add Product Dialog */}
                    <Dialog open={isAddProductDialogOpen} onOpenChange={(open) => {
                        setIsAddProductDialogOpen(open);
                        if (!open) {
                            // Reset form when dialog closes
                            setProductForm({
                                name: '',
                                description: '',
                                price: '',
                                size: '',
                                category: '',
                                condition: 'new',
                                quality: '',
                                quantity: '',
                                specifications: {},
                            });
                            setSpecKey('');
                            setSpecValue('');
                        }
                    }}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Product</DialogTitle>
                                <DialogDescription>
                                    {productForm.name ? `Adding: ${productForm.name}` : 'Create a new product to sell in the marketplace'}
                                </DialogDescription>
                            </DialogHeader>

                            {/* HSN Badge if selected from catalog */}
                            {productForm.specifications['HSN Code'] && (
                                <div className="flex flex-wrap items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                    <Badge variant="secondary">
                                        HSN: {productForm.specifications['HSN Code']}
                                    </Badge>
                                    {productForm.specifications['Variety/Grade'] && (
                                        <Badge variant="warning">
                                            {productForm.specifications['Variety/Grade']}
                                        </Badge>
                                    )}
                                    <span className="text-sm text-primary">
                                        Selected from catalog
                                    </span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="productName">Product Name</Label>
                                        <Input
                                            id="productName"
                                            value={productForm.name}
                                            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                            placeholder="e.g., Fresh Organic Tomatoes"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="productPrice">Price ($)</Label>
                                        <Input
                                            id="productPrice"
                                            type="number"
                                            step="0.01"
                                            value={productForm.price}
                                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="productDescription">Description</Label>
                                    <Textarea
                                        id="productDescription"
                                        value={productForm.description}
                                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                        placeholder="Describe your product..."
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="productSize">Size</Label>
                                        <Input
                                            id="productSize"
                                            value={productForm.size}
                                            onChange={(e) => setProductForm({ ...productForm, size: e.target.value })}
                                            placeholder="e.g., 1kg, 500ml"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="productCategory">Category</Label>
                                        <Input
                                            id="productCategory"
                                            value={productForm.category}
                                            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                            placeholder="e.g., Vegetables, Electronics"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="productCondition">Condition</Label>
                                        <Select
                                            value={productForm.condition}
                                            onValueChange={(value: 'new' | 'used' | 'refurbished') => setProductForm({ ...productForm, condition: value })}
                                        >
                                            <SelectTrigger id="productCondition">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="new">New</SelectItem>
                                                <SelectItem value="used">Used</SelectItem>
                                                <SelectItem value="refurbished">Refurbished</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="productQuantity">Quantity</Label>
                                        <Input
                                            id="productQuantity"
                                            type="number"
                                            value={productForm.quantity}
                                            onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Quality Grade Selection */}
                                <div>
                                    <Label htmlFor="productQuality">Quality Grade *</Label>
                                    <Select
                                        value={productForm.quality || undefined}
                                        onValueChange={(value) => setProductForm({ ...productForm, quality: value })}
                                    >
                                        <SelectTrigger id="productQuality" className="mt-1">
                                            <SelectValue placeholder="Select quality grade..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {QUALITY_GRADES.map((grade) => (
                                                <SelectItem key={grade.value} value={grade.value}>
                                                    <span className="font-medium">{grade.label}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {productForm.quality && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {QUALITY_GRADES.find(g => g.value === productForm.quality)?.description}
                                        </p>
                                    )}
                                </div>
                                <Separator />
                                <div>
                                    <Label>Specifications (Optional)</Label>
                                    <div className="space-y-2 mt-2">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Key (e.g., Origin)"
                                                value={specKey}
                                                onChange={(e) => setSpecKey(e.target.value)}
                                            />
                                            <Input
                                                placeholder="Value (e.g., India)"
                                                value={specValue}
                                                onChange={(e) => setSpecValue(e.target.value)}
                                            />
                                            <Button type="button" onClick={addSpecification} variant="outline">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {Object.entries(productForm.specifications).length > 0 && (
                                            <div className="space-y-1">
                                                {Object.entries(productForm.specifications).map(([key, value]) => (
                                                    <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                                                        <span className="text-sm"><strong>{key}:</strong> {value}</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeSpecification(key)}
                                                            className="h-6 w-6"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddProductDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddProduct}
                                    disabled={addingProduct}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {addingProduct ? "Adding..." : "Add Product"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Place Bid Request Dialog */}
                    <Dialog open={isPlaceBidDialogOpen} onOpenChange={(open) => {
                        setIsPlaceBidDialogOpen(open);
                        if (!open) {
                            setBidForm({
                                productName: '',
                                hsnCode: '',
                                size: '',
                                specification: '',
                                quality: '',
                                quantity: '',
                                expectedDeliveryDate: '',
                                pincode: '',
                                city: '',
                                state: '',
                                country: 'India',
                                incoterms: '',
                                shippingAddress: '',
                                notes: '',
                                sellerBidRunningTime: '',
                                shippingBidRunningTime: '',
                            });
                            setSelectedCatalogProduct(null);
                        }
                    }}>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">{t("buyer.placeBidRequestTitle")}</DialogTitle>
                                <DialogDescription>
                                    {t("buyer.placeBidRequestDesc")}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Product Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="bidProductName">{t("buyer.productNameRequired")}</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="bidProductName"
                                            value={bidForm.productName}
                                            onChange={(e) => setBidForm({ ...bidForm, productName: e.target.value })}
                                            placeholder={t("buyer.enterProductOrCatalog")}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setIsPlaceBidDialogOpen(false);
                                                setIsSelectProductDialogOpen(true);
                                            }}
                                        >
                                            <Search className="h-4 w-4 mr-2" />
                                            {t("buyer.catalog")}
                                        </Button>
                                    </div>
                                </div>

                                {/* HSN Code and Size */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="bidHsnCode">{t("buyer.hsnCodeLabel")}</Label>
                                        <Input
                                            id="bidHsnCode"
                                            value={bidForm.hsnCode}
                                            onChange={(e) => setBidForm({ ...bidForm, hsnCode: e.target.value })}
                                            placeholder={t("buyer.hsnPlaceholder")}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="bidSize">{t("buyer.sizeUnitLabel")}</Label>
                                        <Select
                                            value={bidForm.size}
                                            onValueChange={(value) => setBidForm({ ...bidForm, size: value })}
                                        >
                                            <SelectTrigger id="bidSize">
                                                <SelectValue placeholder={t("buyer.sizePlaceholder")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SIZE_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Specification and Quality */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="bidSpecification">{t("buyer.specificationVariety")}</Label>
                                        <Input
                                            id="bidSpecification"
                                            value={bidForm.specification}
                                            onChange={(e) => setBidForm({ ...bidForm, specification: e.target.value })}
                                            placeholder={t("buyer.specificationPlaceholder")}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="bidQuality">{t("buyer.qualityGrade")}</Label>
                                        <Select
                                            value={bidForm.quality}
                                            onValueChange={(value) => setBidForm({ ...bidForm, quality: value })}
                                        >
                                            <SelectTrigger id="bidQuality">
                                                <SelectValue placeholder={t("buyer.qualityPlaceholder")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {QUALITY_GRADES.map((grade) => (
                                                    <SelectItem key={grade.value} value={grade.value}>
                                                        {grade.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Quantity and Expected Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="bidQuantity">{t("buyer.quantityRequired")}</Label>
                                        <Input
                                            id="bidQuantity"
                                            type="number"
                                            min="1"
                                            value={bidForm.quantity}
                                            onChange={(e) => setBidForm({ ...bidForm, quantity: e.target.value })}
                                            placeholder={t("buyer.quantityPlaceholder")}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="bidExpectedDate">{t("buyer.expectedDeliveryDateRequired")}</Label>
                                        <Input
                                            id="bidExpectedDate"
                                            type="date"
                                            value={bidForm.expectedDeliveryDate}
                                            onChange={(e) => setBidForm({ ...bidForm, expectedDeliveryDate: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>

                                {/* Bid Running Time - Single Input (Shipping auto-set to 1 day) */}
                                <div className="space-y-4">
                                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                                        <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {t("buyer.biddingTimeline")}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {t("buyer.biddingTimelineDesc")}
                                        </p>

                                        <div>
                                            <Label htmlFor="sellerBidRunningTime" className="text-primary font-semibold">
                                                {t("buyer.sellerBidRunningTimeRequired")}
                                            </Label>
                                            <select
                                                id="sellerBidRunningTime"
                                                value={bidForm.sellerBidRunningTime}
                                                onChange={(e) => {
                                                    setBidForm({
                                                        ...bidForm,
                                                        sellerBidRunningTime: e.target.value,
                                                        shippingBidRunningTime: '24' // Auto-set to 24 hours
                                                    });
                                                }}
                                                className="mt-1 w-full px-3 py-2 border border-primary/30 rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring"
                                            >
                                                <option value="">{t("buyer.selectDuration")}</option>
                                                <option value="6">{t("buyer.sixHours")}</option>
                                                <option value="12">{t("buyer.twelveHours")}</option>
                                                <option value="24">{t("buyer.twentyFourHours")}</option>
                                                <option value="48">{t("buyer.fortyEightHours")}</option>
                                                <option value="72">{t("buyer.seventyTwoHours")}</option>
                                            </select>
                                            <p className="text-xs text-primary mt-1">
                                                {t("buyer.sellerBidTimelineHint")}
                                            </p>
                                            <p className="text-xs text-info mt-2">
                                                {t("buyer.shippingBidAutoHint")}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Details */}
                                <div className="space-y-4">
                                    {/* Country Selection */}
                                    <div>
                                        <Label htmlFor="bidCountry">{t("buyer.destinationCountryRequired")}</Label>
                                        <Select
                                            value={bidForm.country}
                                            onValueChange={(value) => setBidForm({ ...bidForm, country: value, incoterms: value !== 'India' ? bidForm.incoterms : '' })}
                                        >
                                            <SelectTrigger id="bidCountry">
                                                <SelectValue placeholder={t("buyer.selectCountry")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <ScrollArea className="h-[200px]">
                                                    {COUNTRIES.map((country) => (
                                                        <SelectItem key={country} value={country}>{country}</SelectItem>
                                                    ))}
                                                </ScrollArea>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Incoterms - Show only if country is not India */}
                                    {bidForm.country && bidForm.country !== 'India' && (
                                        <div>
                                            <Label htmlFor="bidIncoterms">{t("buyer.incotermsRequired")}</Label>
                                            <Select
                                                value={bidForm.incoterms}
                                                onValueChange={(value) => setBidForm({ ...bidForm, incoterms: value })}
                                            >
                                                <SelectTrigger id="bidIncoterms">
                                                    <SelectValue placeholder={t("buyer.selectIncoterms")} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {INCOTERMS.map((incoterm) => (
                                                        <SelectItem key={incoterm.code} value={incoterm.code}>
                                                            {incoterm.code} - {incoterm.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Indian location details - Show only if country is India */}
                                    {bidForm.country === 'India' && (
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <Label htmlFor="bidPincode">{t("buyer.pincodeRequired")}</Label>
                                                <Input
                                                    id="bidPincode"
                                                    value={bidForm.pincode}
                                                    onChange={(e) => setBidForm({ ...bidForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6), city: '', state: '' })}
                                                    placeholder={t("buyer.pincodePlaceholder")}
                                                    maxLength={6}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="bidCity">City <span className="text-muted-foreground text-xs">(auto-filled)</span></Label>
                                                <Input
                                                    id="bidCity"
                                                    value={bidForm.city}
                                                    onChange={(e) => setBidForm({ ...bidForm, city: e.target.value })}
                                                    placeholder="Auto-filled from pincode"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="bidState">State <span className="text-muted-foreground text-xs">(auto-filled)</span></Label>
                                                <Select
                                                    value={bidForm.state}
                                                    onValueChange={(value) => setBidForm({ ...bidForm, state: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Auto-filled from pincode" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <ScrollArea className="h-[200px]">
                                                            {INDIAN_STATES.map((state) => (
                                                                <SelectItem key={state} value={state}>{state}</SelectItem>
                                                            ))}
                                                        </ScrollArea>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}

                                    {/* International location details - Show only if country is not India */}
                                    {bidForm.country && bidForm.country !== 'India' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label htmlFor="bidCity">{t("buyer.cityRequired")}</Label>
                                                <Input
                                                    id="bidCity"
                                                    value={bidForm.city}
                                                    onChange={(e) => setBidForm({ ...bidForm, city: e.target.value })}
                                                    placeholder={t("buyer.cityPlaceholder")}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="bidState">{t("buyer.stateProvince")}</Label>
                                                <Input
                                                    id="bidState"
                                                    value={bidForm.state}
                                                    onChange={(e) => setBidForm({ ...bidForm, state: e.target.value })}
                                                    placeholder={t("buyer.stateProvincePlaceholder")}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Shipping Address (optional - pincode provides location) */}
                                <div>
                                    <Label htmlFor="bidShippingAddress">Complete Shipping Address <span className="text-muted-foreground text-xs">(optional)</span></Label>
                                    <Textarea
                                        id="bidShippingAddress"
                                        value={bidForm.shippingAddress}
                                        onChange={(e) => setBidForm({ ...bidForm, shippingAddress: e.target.value })}
                                        placeholder={t("buyer.shippingAddressPlaceholder")}
                                        rows={2}
                                    />
                                </div>

                                {/* Additional Notes */}
                                <div>
                                    <Label htmlFor="bidNotes">{t("buyer.additionalNotesOptional")}</Label>
                                    <Textarea
                                        id="bidNotes"
                                        value={bidForm.notes}
                                        onChange={(e) => setBidForm({ ...bidForm, notes: e.target.value })}
                                        placeholder={t("buyer.additionalNotesPlaceholder")}
                                        rows={2}
                                    />
                                </div>

                                {/* Summary Card */}
                                {bidForm.productName && bidForm.quantity && (
                                    <Card className="bg-primary/5 border-primary/20">
                                        <CardContent className="p-4">
                                            <h4 className="font-semibold text-primary mb-2">{t("buyer.bidRequestSummary")}</h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">{t("seller.product")}:</span>
                                                    <p className="font-medium">{localizedProductName(bidForm.productName)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">{t("common.quantity")}:</span>
                                                    <p className="font-medium">{bidForm.quantity} {bidForm.size || 'units'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">{t("buyer.destination")}:</span>
                                                    <p className="font-medium">{bidForm.country}</p>
                                                </div>
                                                {bidForm.country !== 'India' && bidForm.incoterms && (
                                                    <div>
                                                        <span className="text-muted-foreground">{t("buyer.incotermsRequired").replace(' *','')}:</span>
                                                        <p className="font-medium text-warning">{bidForm.incoterms} - {INCOTERMS.find(i => i.code === bidForm.incoterms)?.name}</p>
                                                    </div>
                                                )}
                                                {bidForm.quality && (
                                                    <div>
                                                        <span className="text-muted-foreground">{t("seller.quality")}:</span>
                                                        <p className="font-medium">{QUALITY_GRADES.find(g => g.value === bidForm.quality)?.label}</p>
                                                    </div>
                                                )}
                                                {bidForm.expectedDeliveryDate && (
                                                    <div>
                                                        <span className="text-muted-foreground">{t("buyer.expectedBy")}:</span>
                                                        <p className="font-medium">{new Date(bidForm.expectedDeliveryDate).toLocaleDateString()}</p>
                                                    </div>
                                                )}
                                                {bidForm.sellerBidRunningTime && (
                                                    <div>
                                                        <span className="text-muted-foreground">{t("buyer.sellerBidTime")}:</span>
                                                        <p className="font-medium text-primary">{bidForm.sellerBidRunningTime} {t("buyer.hourUnit")}</p>
                                                    </div>
                                                )}
                                                {bidForm.shippingBidRunningTime && (
                                                    <div>
                                                        <span className="text-muted-foreground">{t("buyer.shippingBidTime")}:</span>
                                                        <p className="font-medium text-info">{bidForm.shippingBidRunningTime} {t("buyer.hourUnit")}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setIsPlaceBidDialogOpen(false)}>
                                    {t("common.cancel")}
                                </Button>
                                <Button
                                    onClick={handlePlaceBidRequest}
                                    disabled={
                                        placingBidRequest ||
                                        !bidForm.productName ||
                                        !bidForm.quantity ||
                                        !bidForm.shippingAddress ||
                                        !bidForm.expectedDeliveryDate ||
                                        !bidForm.sellerBidRunningTime ||
                                        !bidForm.country ||
                                        !bidForm.city ||
                                        (bidForm.country === 'India' && (!bidForm.pincode || !bidForm.state || bidForm.pincode.length !== 6)) ||
                                        (bidForm.country !== 'India' && !bidForm.incoterms)
                                    }
                                >
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    {placingBidRequest ? t("buyer.placingRequest") : t("buyer.placeBidRequestTitle")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Add to List Dialog */}
                    <Dialog open={isAddToListDialogOpen} onOpenChange={(open) => {
                        setIsAddToListDialogOpen(open);
                        if (!open) {
                            setAddToListForm({
                                productName: '',
                                hsnCode: '',
                                size: '',
                                specification: '',
                                quality: '',
                                quantity: '',
                                expectedDeliveryDate: '',
                                pincode: '',
                                city: '',
                                state: '',
                                country: 'India',
                                incoterms: '',
                                shippingAddress: '',
                                notes: '',
                            });
                            setSelectedProductForList(null);
                        }
                    }}>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">Add New Item</DialogTitle>
                                <DialogDescription>
                                    Add a new item to the catalog. It will appear in the items list below the search bar.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Product Selection */}
                                <div>
                                    <Label>Product *</Label>
                                    <div className="flex gap-2 mt-1">
                                        <Input
                                            value={addToListForm.productName}
                                            onChange={(e) => setAddToListForm({ ...addToListForm, productName: e.target.value })}
                                            placeholder="Enter product name or browse catalog"
                                            className="flex-1"
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsSelectProductDialogOpen(true)}
                                        >
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* HSN Code and Specification */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="listHsnCode">HSN Code</Label>
                                        <Input
                                            id="listHsnCode"
                                            value={addToListForm.hsnCode}
                                            onChange={(e) => setAddToListForm({ ...addToListForm, hsnCode: e.target.value })}
                                            placeholder="e.g., 0909"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="listSpecification">Specification/Variety</Label>
                                        <Input
                                            id="listSpecification"
                                            value={addToListForm.specification}
                                            onChange={(e) => setAddToListForm({ ...addToListForm, specification: e.target.value })}
                                            placeholder="e.g., Singapore Quality"
                                        />
                                    </div>
                                </div>

                                {/* Size, Quality, Quantity */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <Label htmlFor="listSize">Size/Package</Label>
                                        <Select
                                            value={addToListForm.size}
                                            onValueChange={(value) => setAddToListForm({ ...addToListForm, size: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select size" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SIZE_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="listQuality">Quality Grade</Label>
                                        <Select
                                            value={addToListForm.quality}
                                            onValueChange={(value) => setAddToListForm({ ...addToListForm, quality: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select quality" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <ScrollArea className="h-[200px]">
                                                    {QUALITY_GRADES.map((grade) => (
                                                        <SelectItem key={grade.value} value={grade.value}>{grade.label}</SelectItem>
                                                    ))}
                                                </ScrollArea>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="listQuantity">Quantity *</Label>
                                        <Input
                                            id="listQuantity"
                                            type="number"
                                            value={addToListForm.quantity}
                                            onChange={(e) => setAddToListForm({ ...addToListForm, quantity: e.target.value })}
                                            placeholder="e.g., 100"
                                            min="1"
                                        />
                                    </div>
                                </div>

                                {/* Expected Delivery Date */}
                                <div>
                                    <Label htmlFor="listExpectedDate">Expected Delivery Date</Label>
                                    <Input
                                        id="listExpectedDate"
                                        type="date"
                                        value={addToListForm.expectedDeliveryDate}
                                        onChange={(e) => setAddToListForm({ ...addToListForm, expectedDeliveryDate: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                {/* Location Details */}
                                <div className="space-y-4">
                                    {/* Country Selection */}
                                    <div>
                                        <Label htmlFor="listCountry">Destination Country *</Label>
                                        <Select
                                            value={addToListForm.country}
                                            onValueChange={(value) => setAddToListForm({ ...addToListForm, country: value, incoterms: value !== 'India' ? addToListForm.incoterms : '' })}
                                        >
                                            <SelectTrigger id="listCountry">
                                                <SelectValue placeholder="Select country" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <ScrollArea className="h-[200px]">
                                                    {COUNTRIES.map((country) => (
                                                        <SelectItem key={country} value={country}>{country}</SelectItem>
                                                    ))}
                                                </ScrollArea>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Incoterms - Show only if country is not India */}
                                    {addToListForm.country && addToListForm.country !== 'India' && (
                                        <div>
                                            <Label htmlFor="listIncoterms">Incoterms *</Label>
                                            <Select
                                                value={addToListForm.incoterms}
                                                onValueChange={(value) => setAddToListForm({ ...addToListForm, incoterms: value })}
                                            >
                                                <SelectTrigger id="listIncoterms">
                                                    <SelectValue placeholder="Select Incoterms" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {INCOTERMS.map((incoterm) => (
                                                        <SelectItem key={incoterm.code} value={incoterm.code}>
                                                            {incoterm.code} - {incoterm.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {/* Indian location details - Show only if country is India */}
                                    {addToListForm.country === 'India' && (
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <Label htmlFor="listPincode">Pincode</Label>
                                                <Input
                                                    id="listPincode"
                                                    value={addToListForm.pincode}
                                                    onChange={(e) => setAddToListForm({ ...addToListForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                                    placeholder="6-digit"
                                                    maxLength={6}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="listCity">City</Label>
                                                <Input
                                                    id="listCity"
                                                    value={addToListForm.city}
                                                    onChange={(e) => setAddToListForm({ ...addToListForm, city: e.target.value })}
                                                    placeholder="Enter city"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="listState">State</Label>
                                                <Select
                                                    value={addToListForm.state}
                                                    onValueChange={(value) => setAddToListForm({ ...addToListForm, state: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select state" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <ScrollArea className="h-[200px]">
                                                            {INDIAN_STATES.map((state) => (
                                                                <SelectItem key={state} value={state}>{state}</SelectItem>
                                                            ))}
                                                        </ScrollArea>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}

                                    {/* International location details - Show only if country is not India */}
                                    {addToListForm.country && addToListForm.country !== 'India' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label htmlFor="listCity">City</Label>
                                                <Input
                                                    id="listCity"
                                                    value={addToListForm.city}
                                                    onChange={(e) => setAddToListForm({ ...addToListForm, city: e.target.value })}
                                                    placeholder="Enter city"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="listState">State/Province</Label>
                                                <Input
                                                    id="listState"
                                                    value={addToListForm.state}
                                                    onChange={(e) => setAddToListForm({ ...addToListForm, state: e.target.value })}
                                                    placeholder="Enter state/province"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Shipping Address */}
                                <div>
                                    <Label htmlFor="listShippingAddress">Shipping Address</Label>
                                    <Textarea
                                        id="listShippingAddress"
                                        value={addToListForm.shippingAddress}
                                        onChange={(e) => setAddToListForm({ ...addToListForm, shippingAddress: e.target.value })}
                                        placeholder="Enter street address, landmark, etc."
                                        rows={2}
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <Label htmlFor="listNotes">Notes (Optional)</Label>
                                    <Textarea
                                        id="listNotes"
                                        value={addToListForm.notes}
                                        onChange={(e) => setAddToListForm({ ...addToListForm, notes: e.target.value })}
                                        placeholder="Any special requirements..."
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setIsAddToListDialogOpen(false)} disabled={addingToList}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddToList}
                                    disabled={addingToList || !addToListForm.productName || !addToListForm.quantity}
                                >
                                    <List className="mr-2 h-4 w-4" />
                                    {addingToList ? "Adding..." : "Add Item"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default function BuyerDashboardPage() {
    return (
        <Suspense fallback={
            <DashboardLayout role="buyer">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading buyer dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        }>
            <BuyerDashboardContent />
        </Suspense>
    );
}

