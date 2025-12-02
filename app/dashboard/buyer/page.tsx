'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, Package, DollarSign, TrendingUp, Eye, Plus, Check, X, Clock, Search, Leaf, Wheat, Apple, Nut } from 'lucide-react';
import { Item, Order, Bid } from '@/lib/types';
import { DashboardLayout } from '@/components/dashboard-layout';
import { CardContainer, CardBody, CardItem } from '@/components/ui/aceternity/3d-card';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveItems, getOrdersByBuyer, getBidsByOrder, createOrder, getBuyerStats, updateBid, updateOrder, createItem } from '@/lib/supabase-api';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        
        // Cardamom Green varieties
        { name: "Cardamom Green - 5-6mm", hsn: "0908", variety: "5-6mm" },
        { name: "Cardamom Green - 6-7mm", hsn: "0908", variety: "6-7mm" },
        { name: "Cardamom Green - 7-8mm", hsn: "0908", variety: "7-8mm" },
        { name: "Cardamom Green - 8mm+", hsn: "0908", variety: "8mm+ (Bold)" },
        { name: "Cardamom Green - AGB", hsn: "0908", variety: "AGB (Alleppey Green Bold)" },
        { name: "Cardamom Green - AGS", hsn: "0908", variety: "AGS (Alleppey Green Superior)" },
        
        // Cardamom Black varieties
        { name: "Cardamom Black - Large", hsn: "0908", variety: "Large" },
        { name: "Cardamom Black - Medium", hsn: "0908", variety: "Medium" },
        { name: "Cardamom Black - Small", hsn: "0908", variety: "Small" },
        
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
const ALL_PRODUCTS = [
    ...PRODUCT_CATALOG.spices.map(p => ({ ...p, category: 'Spices' })),
    ...PRODUCT_CATALOG.vegetables.map(p => ({ ...p, category: 'Vegetables' })),
    ...PRODUCT_CATALOG.pulses.map(p => ({ ...p, category: 'Pulses' })),
    ...PRODUCT_CATALOG.dry_fruits_and_nuts.map(p => ({ ...p, category: 'Dry Fruits & Nuts' })),
];

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

export default function BuyerDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [items, setItems] = useState<Item[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);
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
    
    // Catalog search states
    const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isSelectProductDialogOpen, setIsSelectProductDialogOpen] = useState(false);

    // Filter catalog products based on search query and category
    const filteredCatalogProducts = useMemo(() => {
        return ALL_PRODUCTS.filter(product => {
            const searchLower = catalogSearchQuery.toLowerCase();
            const matchesSearch = catalogSearchQuery === '' || 
                product.name.toLowerCase().includes(searchLower) ||
                product.hsn.includes(catalogSearchQuery) ||
                product.variety.toLowerCase().includes(searchLower);
            const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [catalogSearchQuery, selectedCategory]);

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

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth?role=buyer');
            return;
        }
        if (user && user.role !== 'buyer') {
            router.push(`/dashboard/${user.role}`);
            return;
        }
        if (user) {
            fetchData();
        }
    }, [user, authLoading, router]);

    const fetchData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const [itemsData, ordersData, statsData] = await Promise.all([
                getActiveItems(),
                getOrdersByBuyer(user.id),
                getBuyerStats(user.id),
            ]);

            setItems(itemsData);
            setOrders(ordersData);

            // Fetch bids for all orders
            const bidsPromises = ordersData.map(order => getBidsByOrder(order.id));
            const bidsArrays = await Promise.all(bidsPromises);
            setBids(bidsArrays.flat());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedItem || !user) {
            toast({
                title: "Error",
                description: "Please select an item to order.",
                variant: "destructive",
            });
            return;
        }

        if (!orderForm.quantity || !orderForm.shippingAddress) {
            toast({
                title: "Validation Error",
                description: "Please fill in quantity and shipping address.",
                variant: "destructive",
            });
            return;
        }

        const quantity = parseInt(orderForm.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid quantity.",
                variant: "destructive",
            });
            return;
        }

        if (quantity > selectedItem.quantity) {
            toast({
                title: "Insufficient Stock",
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
                description: `Your order for ${selectedItem.name} has been placed. Sellers can now bid on it.`,
            });

            setIsOrderDialogOpen(false);
            setOrderForm({ quantity: '', shippingAddress: '', notes: '' });
            setSelectedItem(null);
            
            // Refresh data immediately
            await fetchData();
        } catch (error: any) {
            console.error('Error creating order:', error);
            toast({
                title: "Error",
                description: error?.message || "Failed to create order. Please try again.",
                variant: "destructive",
            });
        } finally {
            setPlacingOrder(false);
        }
    };

    const handleAcceptBid = async (bidId: string) => {
        try {
            const bid = bids.find(b => b.id === bidId);
            if (!bid) {
                toast({
                    title: "Error",
                    description: "Bid not found.",
                    variant: "destructive",
                });
                return;
            }

            await updateBid(bidId, { status: 'accepted' });
            // Also update the order status to accepted
            await updateOrder(bid.orderId, { status: 'accepted' });
            
            toast({
                title: "Bid Accepted! ✅",
                description: `You've accepted the bid from ${bid.seller?.name || 'the seller'}.`,
            });
            
            await fetchData();
        } catch (error: any) {
            console.error('Error accepting bid:', error);
            toast({
                title: "Error",
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
                title: "Error",
                description: error?.message || "Failed to reject bid. Please try again.",
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
                title: "Error",
                description: error?.message || "Failed to update order status. Please try again.",
                variant: "destructive",
            });
        }
    };

    const [addingProduct, setAddingProduct] = useState(false);

    const handleAddProduct = async () => {
        if (!user) {
            toast({
                title: "Error",
                description: "You must be logged in to add products.",
                variant: "destructive",
            });
            return;
        }

        // Validation
        if (!productForm.name || !productForm.description || !productForm.price || 
            !productForm.size || !productForm.category || !productForm.quantity) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }

        const price = parseFloat(productForm.price);
        const quantity = parseInt(productForm.quantity);

        if (isNaN(price) || price <= 0) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid price.",
                variant: "destructive",
            });
            return;
        }

        if (isNaN(quantity) || quantity <= 0) {
            toast({
                title: "Validation Error",
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
                title: "Error",
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
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalSpent: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.totalPrice || 0), 0),
        activeBids: bids.filter(b => b.status === 'pending').length,
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
            accepted: 'bg-blue-500/10 text-blue-600 border-blue-200',
            rejected: 'bg-red-500/10 text-red-600 border-red-200',
            completed: 'bg-green-500/10 text-green-600 border-green-200',
            cancelled: 'bg-gray-500/10 text-gray-600 border-gray-200',
        };
        return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-200';
    };

    if (authLoading || loading) {
        return (
            <DashboardLayout role="buyer">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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
                {/* Background Effect */}
                <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
                    <BackgroundBeams />
                </div>

                <div className="relative z-10 space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                Welcome back, {user.name}
                            </h1>
                            <p className="text-muted-foreground mt-1">Here's what's happening with your orders today.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20"
                                onClick={() => setIsSelectProductDialogOpen(true)}
                            >
                                <Search className="mr-2 h-4 w-4" />
                                Select from Catalog
                            </Button>
                            <Button
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
                                onClick={() => setIsAddProductDialogOpen(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Custom Product
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-none shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalOrders}</div>
                                <p className="text-xs text-muted-foreground mt-1">All time orders placed</p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pendingOrders}</div>
                                <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">${stats.totalSpent.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Lifetime spending</p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Active Bids</CardTitle>
                                <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeBids}</div>
                                <p className="text-xs text-muted-foreground mt-1">Pending seller bids</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <Tabs defaultValue="items" className="space-y-6">
                        <TabsList className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-1 border border-gray-200 dark:border-gray-800 rounded-xl">
                            <TabsTrigger value="items" className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Browse Items</TabsTrigger>
                            <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">My Orders</TabsTrigger>
                            <TabsTrigger value="bids" className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Seller Bids</TabsTrigger>
                        </TabsList>

                        {/* Browse Items Tab */}
                        <TabsContent value="items" className="space-y-6">
                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {items.map((item) => (
                                    <CardContainer key={item.id} className="inter-var w-full">
                                        <CardBody className="bg-white dark:bg-gray-950 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:border-white/[0.2] border-black/[0.1] w-full h-auto rounded-xl p-6 border shadow-xl">
                                            <CardItem
                                                translateZ="50"
                                                className="text-xl font-bold text-neutral-600 dark:text-white"
                                            >
                                                {item.name}
                                            </CardItem>
                                            <CardItem
                                                as="p"
                                                translateZ="60"
                                                className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300 line-clamp-2"
                                            >
                                                {item.description}
                                            </CardItem>
                                            <CardItem translateZ="100" className="w-full mt-4">
                                                <div className="flex items-center justify-center w-full h-40 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl group-hover/card:shadow-xl">
                                                    <Package className="h-16 w-16 text-purple-500/50" />
                                                </div>
                                            </CardItem>
                                            <div className="flex justify-between items-center mt-8">
                                                <CardItem
                                                    translateZ={20}
                                                    className="px-4 py-2 rounded-xl text-xs font-normal dark:text-white"
                                                >
                                                    <span className="text-2xl font-bold text-purple-600">${item.price}</span>
                                                    <span className="text-muted-foreground ml-1">/ {item.size}</span>
                                                </CardItem>
                                                <CardItem
                                                    translateZ={20}
                                                    as="button"
                                                    className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold"
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setIsItemDetailsDialogOpen(true);
                                                    }}
                                                >
                                                    View Details
                                                </CardItem>
                                            </div>
                                        </CardBody>
                                    </CardContainer>
                                ))}
                            </div>
                        </TabsContent>

                        {/* My Orders Tab */}
                        <TabsContent value="orders" className="space-y-4">
                            <div className="grid gap-4">
                                {orders.map((order) => (
                                    <Card key={order.id} className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                        <Package className="h-6 w-6 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>{order.item?.name || 'Unknown Item'}</CardTitle>
                                                        <CardDescription>Order #{order.id.slice(0, 8)} • {new Date(order.createdAt).toLocaleDateString()}</CardDescription>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={getStatusColor(order.status)}>{order.status}</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quantity</Label>
                                                    <p className="font-semibold">{order.quantity} units</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Total Price</Label>
                                                    <p className="font-semibold text-purple-600">${(order.totalPrice || 0).toFixed(2)}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
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
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Updated</Label>
                                                    <p className="font-semibold">{new Date(order.updatedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Seller Bids Tab */}
                        <TabsContent value="bids" className="space-y-4">
                            <div className="grid gap-4">
                                {bids.map((bid) => (
                                    <Card key={bid.id} className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500" />
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle>Bid from {bid.seller?.name || 'Unknown Seller'}</CardTitle>
                                                    <CardDescription>
                                                        Order #{bid.orderId.slice(0, 8)} • {new Date(bid.createdAt).toLocaleDateString()}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant="outline" className={getStatusColor(bid.status)}>{bid.status}</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Bid Amount</Label>
                                                    <p className="text-xl font-bold text-purple-600">${bid.bidAmount.toFixed(2)}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Delivery</Label>
                                                    <p className="font-medium">{new Date(bid.estimatedDelivery).toLocaleDateString()}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                                                    <p className="font-medium capitalize">{bid.status}</p>
                                                </div>
                                            </div>
                                            {bid.message && (
                                                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/20">
                                                    <Label className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider font-semibold">Message from Seller</Label>
                                                    <p className="font-medium mt-1 text-gray-700 dark:text-gray-300">"{bid.message}"</p>
                                                </div>
                                            )}
                                        </CardContent>
                                        {bid.status === 'pending' && (
                                            <CardFooter className="gap-3 bg-gray-50/50 dark:bg-gray-900/50 p-4">
                                                <Button
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                                                    onClick={() => handleAcceptBid(bid.id)}
                                                >
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Accept Bid
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    className="flex-1 shadow-lg shadow-red-500/20"
                                                    onClick={() => handleRejectBid(bid.id)}
                                                >
                                                    <X className="mr-2 h-4 w-4" />
                                                    Reject Bid
                                                </Button>
                                            </CardFooter>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Place Order Dialog */}
                    <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Place Order</DialogTitle>
                                <DialogDescription>Order details for {selectedItem?.name}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Quantity</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={orderForm.quantity}
                                        onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Shipping Address</Label>
                                    <Textarea
                                        value={orderForm.shippingAddress}
                                        onChange={(e) => setOrderForm({ ...orderForm, shippingAddress: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <Label>Notes (Optional)</Label>
                                    <Textarea
                                        value={orderForm.notes}
                                        onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                                {selectedItem && orderForm.quantity && (
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <Label>Total Price</Label>
                                        <p className="text-2xl font-bold text-purple-600">
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
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={!orderForm.quantity || !orderForm.shippingAddress || placingOrder}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                >
                                    {placingOrder ? "Placing Order..." : "Place Order"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Item Details Dialog */}
                    <Dialog open={isItemDetailsDialogOpen} onOpenChange={setIsItemDetailsDialogOpen}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{selectedItem?.name}</DialogTitle>
                                <DialogDescription>{selectedItem?.description}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                        <Package className="h-32 w-32" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Price</Label>
                                        <p className="text-2xl font-bold text-purple-600">${selectedItem?.price}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Size</Label>
                                        <p className="text-lg font-medium">{selectedItem?.size}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Category</Label>
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
                                        <Label className="text-muted-foreground">Seller</Label>
                                        <p className="text-lg font-medium">{selectedItem?.seller?.name || 'Unknown'}</p>
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
                            <DialogFooter>
                                <Button
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                    onClick={() => {
                                        setIsItemDetailsDialogOpen(false);
                                        setIsOrderDialogOpen(true);
                                    }}
                                >
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Place Order
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
                                    className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    All ({ALL_PRODUCTS.length})
                                </Badge>
                                <Badge 
                                    variant={selectedCategory === 'Spices' ? 'default' : 'outline'} 
                                    className="cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                                    onClick={() => setSelectedCategory('Spices')}
                                >
                                    🌶️ Spices ({PRODUCT_CATALOG.spices.length})
                                </Badge>
                                <Badge 
                                    variant={selectedCategory === 'Vegetables' ? 'default' : 'outline'} 
                                    className="cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                    onClick={() => setSelectedCategory('Vegetables')}
                                >
                                    🥬 Vegetables ({PRODUCT_CATALOG.vegetables.length})
                                </Badge>
                                <Badge 
                                    variant={selectedCategory === 'Pulses' ? 'default' : 'outline'} 
                                    className="cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                                    onClick={() => setSelectedCategory('Pulses')}
                                >
                                    🫘 Pulses ({PRODUCT_CATALOG.pulses.length})
                                </Badge>
                                <Badge 
                                    variant={selectedCategory === 'Dry Fruits & Nuts' ? 'default' : 'outline'} 
                                    className="cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
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
                                            className="cursor-pointer hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 group"
                                            onClick={() => selectCatalogProduct(product)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-sm group-hover:text-purple-600 transition-colors line-clamp-2">
                                                            {product.name}
                                                        </h4>
                                                        <div className="flex flex-wrap items-center gap-1 mt-2">
                                                            <Badge variant="secondary" className="text-xs">
                                                                HSN: {product.hsn}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                                                                {product.variety}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {product.category}
                                                        </p>
                                                    </div>
                                                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                        <Plus className="h-4 w-4 text-purple-600" />
                                                    </div>
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
                                        setIsAddProductDialogOpen(true);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Custom Product Instead
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
                                <div className="flex flex-wrap items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                        HSN: {productForm.specifications['HSN Code']}
                                    </Badge>
                                    {productForm.specifications['Variety/Grade'] && (
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                                            {productForm.specifications['Variety/Grade']}
                                        </Badge>
                                    )}
                                    <span className="text-sm text-purple-600 dark:text-purple-400">
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
                                                    <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
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
                                    className="bg-gradient-to-r from-purple-600 to-blue-600"
                                    disabled={addingProduct}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {addingProduct ? "Adding..." : "Add Product"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </DashboardLayout>
    );
}
