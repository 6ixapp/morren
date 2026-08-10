'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Package, ShoppingCart, TrendingUp, Users, Plus, Edit, Trash2, Eye, BarChart3, Shield, UserPlus } from 'lucide-react';
import { Item, Order, Bid, User } from '@/lib/types';
import { DashboardLayout } from '@/components/dashboard-layout';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getItems, getOrders, getBids, getUsers, createItem, updateItem, deleteItem, deleteOrder, getAdminStats, createSellerAccount } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const router = useRouter();
    const { toast } = useToast();
    const [items, setItems] = useState<Item[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [bids, setBids] = useState<Bid[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
    const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
    const [isAddSellerDialogOpen, setIsAddSellerDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    const [itemForm, setItemForm] = useState({
        name: '',
        description: '',
        price: '',
        size: '',
        category: '',
        condition: 'new' as 'new' | 'used' | 'refurbished',
        quantity: '',
        specifications: {} as Record<string, string>,
    });

    const [sellerForm, setSellerForm] = useState({
        name: '',
        email: '',
        phone: '',
        whatsappNumber: '',
        whatsappOptIn: false,
        password: '',
        confirmPassword: '',
    });
    const [isCreatingSeller, setIsCreatingSeller] = useState(false);

    const [specKey, setSpecKey] = useState('');
    const [specValue, setSpecValue] = useState('');

    // Stats
    const stats = {
        totalItems: items.length,
        totalOrders: orders.length,
        totalBids: bids.length,
        totalUsers: users.length,
        activeItems: items.filter(i => i.status === 'active').length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalPrice, 0),
    };

    const getStatusVariant = (status: string): 'success' | 'warning' | 'destructive' | 'secondary' => {
        const variants: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
            pending: 'warning',
            accepted: 'success',
            rejected: 'destructive',
            completed: 'success',
            cancelled: 'destructive',
            active: 'success',
            sold: 'secondary',
            inactive: 'secondary',
        };
        return variants[status] || 'secondary';
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const [itemsData, ordersData, bidsData, usersData] = await Promise.all([
                getItems(),
                getOrders(),
                getBids(),
                getUsers(),
            ]);
            setItems(itemsData);
            setOrders(ordersData);
            setBids(bidsData);
            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth?role=admin');
            return;
        }
        if (user && user.role !== 'admin') {
            router.push(`/dashboard/${user.role}`);
            return;
        }
        if (user) {
            fetchData();
        }
    }, [user, authLoading, router, fetchData]);

    const handleAddItem = async () => {
        if (!user) return;
        try {
            await createItem({
                name: itemForm.name,
                description: itemForm.description,
                image: '/api/placeholder/400/300',
                price: parseFloat(itemForm.price),
                size: itemForm.size,
                category: itemForm.category,
                condition: itemForm.condition,
                quantity: parseInt(itemForm.quantity),
                specifications: itemForm.specifications,
                sellerId: user.id, // Admin can create items
                status: 'active',
            });
            setIsAddItemDialogOpen(false);
            resetItemForm();
            await fetchData();
        } catch (error) {
            console.error('Error creating item:', error);
            alert('Failed to create item. Please try again.');
        }
    };

    const handleEditItem = async () => {
        if (!selectedItem) return;
        try {
            await updateItem(selectedItem.id, {
                name: itemForm.name,
                description: itemForm.description,
                price: parseFloat(itemForm.price),
                size: itemForm.size,
                category: itemForm.category,
                condition: itemForm.condition,
                quantity: parseInt(itemForm.quantity),
                specifications: itemForm.specifications,
            });
            setIsEditItemDialogOpen(false);
            resetItemForm();
            await fetchData();
        } catch (error) {
            console.error('Error updating item:', error);
            alert('Failed to update item. Please try again.');
        }
    };

    const handleDeleteItem = async (id: string) => {
        try {
            await deleteItem(id);
            await fetchData();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item. Please try again.');
        }
    };

    const handleDeleteOrder = async (id: string) => {
        try {
            await deleteOrder(id);
            await fetchData();
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Failed to delete order. Please try again.');
        }
    };

    const resetItemForm = () => {
        setItemForm({
            name: '',
            description: '',
            price: '',
            size: '',
            category: '',
            condition: 'new',
            quantity: '',
            specifications: {},
        });
        setSelectedItem(null);
    };

    const openEditDialog = (item: Item) => {
        setSelectedItem(item);
        setItemForm({
            name: item.name,
            description: item.description,
            price: item.price.toString(),
            size: item.size,
            category: item.category,
            condition: item.condition,
            quantity: item.quantity.toString(),
            specifications: item.specifications,
        });
        setIsEditItemDialogOpen(true);
    };

    const addSpecification = () => {
        if (specKey && specValue) {
            setItemForm({
                ...itemForm,
                specifications: { ...itemForm.specifications, [specKey]: specValue }
            });
            setSpecKey('');
            setSpecValue('');
        }
    };

    const removeSpecification = (key: string) => {
        const newSpecs = { ...itemForm.specifications };
        delete newSpecs[key];
        setItemForm({ ...itemForm, specifications: newSpecs });
    };

    const handleAddSeller = async () => {
        if (!sellerForm.name || !sellerForm.email || !sellerForm.password) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            return;
        }

        if (sellerForm.password !== sellerForm.confirmPassword) {
            toast({
                title: 'Error',
                description: 'Passwords do not match',
                variant: 'destructive',
            });
            return;
        }

        if (sellerForm.password.length < 6) {
            toast({
                title: 'Error',
                description: 'Password must be at least 6 characters',
                variant: 'destructive',
            });
            return;
        }

        setIsCreatingSeller(true);
        try {
            await createSellerAccount(
                sellerForm.email,
                sellerForm.password,
                sellerForm.name,
                {
                    phone: sellerForm.phone || undefined,
                    whatsappNumber: sellerForm.whatsappNumber || undefined,
                    whatsappOptIn: sellerForm.whatsappOptIn,
                }
            );

            toast({
                title: 'Success',
                description: `Seller account created for ${sellerForm.name}. They can now login with their email and password.`,
            });
            setIsAddSellerDialogOpen(false);
            setSellerForm({ name: '', email: '', phone: '', whatsappNumber: '', whatsappOptIn: false, password: '', confirmPassword: '' });
            await fetchData();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create seller account',
                variant: 'destructive',
            });
        } finally {
            setIsCreatingSeller(false);
        }
    };

    if (authLoading || loading) {
        return (
            <DashboardLayout role="admin">
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
        <DashboardLayout role="admin">
            <div className="relative min-h-[calc(100vh-4rem)]">
                {/* Background Effect - only visible in dark mode */}
                <div className="fixed inset-0 z-0 pointer-events-none opacity-50 hidden dark:block">
                    <BackgroundBeams />
                </div>

                <div className="relative z-10 space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                {t("admin.pageTitle")}
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">Complete control over marketplace operations</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsAddSellerDialogOpen(true)}
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                {t("admin.addSeller")}
                            </Button>
                            <Button onClick={() => setIsAddItemDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t("admin.addItem")}
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Package className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-foreground tabular-nums">{stats.totalItems}</div>
                                        <div className="text-sm text-muted-foreground">{t("admin.stats.totalItems")}</div>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">{stats.activeItems} active items</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                                        <ShoppingCart className="h-5 w-5 text-info" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-foreground tabular-nums">{stats.totalOrders}</div>
                                        <div className="text-sm text-muted-foreground">{t("admin.stats.totalOrders")}</div>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">{stats.pendingOrders} pending</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                                        <TrendingUp className="h-5 w-5 text-success" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-foreground tabular-nums">${stats.totalRevenue.toFixed(2)}</div>
                                        <div className="text-sm text-muted-foreground">{t("admin.stats.totalRevenue")}</div>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">From completed orders</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                                        <Users className="h-5 w-5 text-accent-foreground" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-foreground tabular-nums">{stats.totalUsers}</div>
                                        <div className="text-sm text-muted-foreground">{t("admin.stats.totalUsers")}</div>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">Registered users</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <Tabs defaultValue="items" className="space-y-6">
                        <TabsList className="bg-card p-1 border border-border rounded-xl">
                            <TabsTrigger value="items" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">{t("admin.manageItems")}</TabsTrigger>
                            <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">{t("admin.manageOrders")}</TabsTrigger>
                            <TabsTrigger value="bids" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">{t("buyer.totalBids")}</TabsTrigger>
                            <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">{t("admin.manageUsers")}</TabsTrigger>
                        </TabsList>

                        {/* Items Tab */}
                        <TabsContent value="items" className="space-y-6">
                            <div className="grid gap-6">
                                {items.map((item) => (
                                    <Card key={item.id} className="group">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="flex items-center gap-2">
                                                        {item.name}
                                                        <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
                                                    </CardTitle>
                                                    <CardDescription>{item.description}</CardDescription>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="outline" size="icon" onClick={() => openEditDialog(item)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="icon">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>{t("admin.deleteItem")}</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive text-white hover:bg-destructive/90">
                                                                    {t("common.delete")}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.price")}</Label>
                                                    <p className="text-lg font-bold text-foreground tabular-nums">${item.price}</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Size</Label>
                                                    <p className="font-medium">{item.size}</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">{t("common.category")}</Label>
                                                    <p className="font-medium">{item.category}</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Condition</Label>
                                                    <p className="font-medium capitalize">{item.condition}</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Stock</Label>
                                                    <p className="font-medium tabular-nums">{item.quantity} units</p>
                                                </div>
                                            </div>
                                            {item.specifications && Object.keys(item.specifications).length > 0 && (
                                                <div className="mt-4">
                                                    <Label className="font-semibold mb-2 block text-sm uppercase tracking-wider text-muted-foreground">Specifications</Label>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        {Object.entries(item.specifications).map(([key, value]) => (
                                                            <div key={key} className="bg-background p-2 rounded border border-border text-sm">
                                                                <p className="text-muted-foreground text-xs">{key}</p>
                                                                <p className="font-medium">{value}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Orders Tab */}
                        <TabsContent value="orders" className="space-y-6">
                            <div className="grid gap-6">
                                {orders.map((order) => (
                                    <Card key={order.id} className="group">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        Order #{order.id}
                                                        <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {order.item?.name} • Buyer: {order.buyer?.name}
                                                    </CardDescription>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t("common.delete")} Order</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete order #{order.id}? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteOrder(order.id)} className="bg-destructive text-white hover:bg-destructive/90">
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quantity</Label>
                                                    <p className="font-medium tabular-nums">{order.quantity} units</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Total Price</Label>
                                                    <p className="font-bold text-foreground tabular-nums">${Number(order.totalPrice).toFixed(2)}</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Created</Label>
                                                    <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Updated</Label>
                                                    <p className="font-medium">{new Date(order.updatedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Shipping Address</Label>
                                                <p className="font-medium">{order.shippingAddress}</p>
                                            </div>
                                            {order.notes && (
                                                <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Notes</Label>
                                                    <p className="font-medium">{order.notes}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Bids Tab */}
                        <TabsContent value="bids" className="space-y-6">
                            <div className="grid gap-6">
                                {bids.map((bid) => (
                                    <Card key={bid.id}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        Bid #{bid.id}
                                                        <Badge variant={getStatusVariant(bid.status)}>{bid.status}</Badge>
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Order #{bid.orderId} • Seller: {bid.seller?.name}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Bid Amount</Label>
                                                    <p className="text-lg font-bold text-foreground tabular-nums">${Number(bid.bidAmount).toFixed(2)}</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Delivery</Label>
                                                    <p className="font-medium">{new Date(bid.estimatedDelivery).toLocaleDateString()}</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Created</Label>
                                                    <p className="font-medium">{new Date(bid.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            {bid.message && (
                                                <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Message</Label>
                                                    <p className="font-medium mt-1">"{bid.message}"</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Users Tab */}
                        <TabsContent value="users" className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {users.map((user) => (
                                    <Card key={user.id}>
                                        <CardHeader>
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <CardTitle>{user.name}</CardTitle>
                                                    <CardDescription>{user.email}</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Role</Label>
                                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                                    {user.role}
                                                </Badge>
                                            </div>
                                            {user.phone && (
                                                <div className="p-2 bg-muted/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Phone</Label>
                                                    <p className="font-medium text-sm">{user.phone}</p>
                                                </div>
                                            )}
                                            {user.whatsappNumber && (
                                                <div className="p-2 bg-muted/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">WhatsApp</Label>
                                                    <p className="font-medium text-sm">{user.whatsappNumber}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {user.whatsappOptIn ? 'Opted in' : 'Not opted in'}
                                                    </p>
                                                </div>
                                            )}
                                            {user.address && (
                                                <div className="p-2 bg-muted/50 rounded-lg">
                                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Address</Label>
                                                    <p className="font-medium text-sm truncate">{user.address}</p>
                                                </div>
                                            )}
                                            <div className="p-2 bg-muted/50 rounded-lg">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Joined</Label>
                                                <p className="font-medium text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Add Item Dialog */}
                    <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{t("admin.addItem")}</DialogTitle>
                                <DialogDescription>Create a new item in the marketplace</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">Item Name</Label>
                                        <Input
                                            id="name"
                                            value={itemForm.name}
                                            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                            placeholder="e.g., Fresh Organic Tomatoes"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="price">Price ($)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            value={itemForm.price}
                                            onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={itemForm.description}
                                        onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                                        placeholder="Detailed description of the item"
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="size">Size</Label>
                                        <Input
                                            id="size"
                                            value={itemForm.size}
                                            onChange={(e) => setItemForm({ ...itemForm, size: e.target.value })}
                                            placeholder="e.g., 1 kg, Large, 15 inch"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="category">Category</Label>
                                        <Input
                                            id="category"
                                            value={itemForm.category}
                                            onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                                            placeholder="e.g., Vegetables, Electronics"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="condition">Condition</Label>
                                        <Select value={itemForm.condition} onValueChange={(value: any) => setItemForm({ ...itemForm, condition: value })}>
                                            <SelectTrigger>
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
                                        <Label htmlFor="quantity">Quantity</Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            value={itemForm.quantity}
                                            onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="mb-2 block">Specifications</Label>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Key (e.g., Origin)"
                                                value={specKey}
                                                onChange={(e) => setSpecKey(e.target.value)}
                                            />
                                            <Input
                                                placeholder="Value (e.g., Local Farm)"
                                                value={specValue}
                                                onChange={(e) => setSpecValue(e.target.value)}
                                            />
                                            <Button type="button" onClick={addSpecification}>Add</Button>
                                        </div>
                                        {Object.entries(itemForm.specifications).length > 0 && (
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {Object.entries(itemForm.specifications).map(([key, value]) => (
                                                    <div key={key} className="bg-muted p-2 rounded flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">{key}</p>
                                                            <p className="text-sm font-medium">{value}</p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => removeSpecification(key)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => { setIsAddItemDialogOpen(false); resetItemForm(); }}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAddItem}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Item
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Add Seller Dialog */}
                    <Dialog open={isAddSellerDialogOpen} onOpenChange={setIsAddSellerDialogOpen}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <UserPlus className="h-5 w-5 text-primary" />
                                    Add New Seller
                                </DialogTitle>
                                <DialogDescription>
                                    Create a seller account. The seller will be able to login with these credentials.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="seller-name">Full Name *</Label>
                                    <Input
                                        id="seller-name"
                                        value={sellerForm.name}
                                        onChange={(e) => setSellerForm({ ...sellerForm, name: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="seller-email">Email Address *</Label>
                                    <Input
                                        id="seller-email"
                                        type="email"
                                        value={sellerForm.email}
                                        onChange={(e) => setSellerForm({ ...sellerForm, email: e.target.value })}
                                        placeholder="seller@example.com"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="seller-password">Password *</Label>
                                    <Input
                                        id="seller-password"
                                        type="password"
                                        value={sellerForm.password}
                                        onChange={(e) => setSellerForm({ ...sellerForm, password: e.target.value })}
                                        placeholder="Min. 6 characters"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="seller-phone">Phone Number</Label>
                                    <Input
                                        id="seller-phone"
                                        type="tel"
                                        value={sellerForm.phone}
                                        onChange={(e) => setSellerForm({ ...sellerForm, phone: e.target.value })}
                                        placeholder="+91XXXXXXXXXX"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="seller-whatsapp">WhatsApp Number</Label>
                                    <Input
                                        id="seller-whatsapp"
                                        type="tel"
                                        value={sellerForm.whatsappNumber}
                                        onChange={(e) => setSellerForm({ ...sellerForm, whatsappNumber: e.target.value })}
                                        placeholder="+91XXXXXXXXXX"
                                    />
                                </div>
                                <label className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={sellerForm.whatsappOptIn}
                                        onCheckedChange={(checked) => setSellerForm({ ...sellerForm, whatsappOptIn: Boolean(checked) })}
                                    />
                                    Enable WhatsApp bidding updates for this seller
                                </label>
                                <div>
                                    <Label htmlFor="seller-confirm-password">Confirm Password *</Label>
                                    <Input
                                        id="seller-confirm-password"
                                        type="password"
                                        value={sellerForm.confirmPassword}
                                        onChange={(e) => setSellerForm({ ...sellerForm, confirmPassword: e.target.value })}
                                        placeholder="Confirm password"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddSellerDialogOpen(false);
                                        setSellerForm({ name: '', email: '', phone: '', whatsappNumber: '', whatsappOptIn: false, password: '', confirmPassword: '' });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddSeller}
                                    disabled={isCreatingSeller}
                                >
                                    {isCreatingSeller ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-primary-foreground/50 border-t-primary-foreground rounded-full animate-spin" />
                                            Creating...
                                        </div>
                                    ) : (
                                        <>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Create Seller
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Item Dialog */}
                    <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{t("admin.editItem")}</DialogTitle>
                                <DialogDescription>Update item details</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="edit-name">Item Name</Label>
                                        <Input
                                            id="edit-name"
                                            value={itemForm.name}
                                            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-price">Price ($)</Label>
                                        <Input
                                            id="edit-price"
                                            type="number"
                                            step="0.01"
                                            value={itemForm.price}
                                            onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                        id="edit-description"
                                        value={itemForm.description}
                                        onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="edit-size">Size</Label>
                                        <Input
                                            id="edit-size"
                                            value={itemForm.size}
                                            onChange={(e) => setItemForm({ ...itemForm, size: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-category">Category</Label>
                                        <Input
                                            id="edit-category"
                                            value={itemForm.category}
                                            onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="edit-condition">Condition</Label>
                                        <Select value={itemForm.condition} onValueChange={(value: any) => setItemForm({ ...itemForm, condition: value })}>
                                            <SelectTrigger>
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
                                        <Label htmlFor="edit-quantity">Quantity</Label>
                                        <Input
                                            id="edit-quantity"
                                            type="number"
                                            value={itemForm.quantity}
                                            onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="mb-2 block">Specifications</Label>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Key"
                                                value={specKey}
                                                onChange={(e) => setSpecKey(e.target.value)}
                                            />
                                            <Input
                                                placeholder="Value"
                                                value={specValue}
                                                onChange={(e) => setSpecValue(e.target.value)}
                                            />
                                            <Button type="button" onClick={addSpecification}>Add</Button>
                                        </div>
                                        {Object.entries(itemForm.specifications).length > 0 && (
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                {Object.entries(itemForm.specifications).map(([key, value]) => (
                                                    <div key={key} className="bg-muted p-2 rounded flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">{key}</p>
                                                            <p className="text-sm font-medium">{value}</p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => removeSpecification(key)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => { setIsEditItemDialogOpen(false); resetItemForm(); }}>
                                    Cancel
                                </Button>
                                <Button onClick={handleEditItem}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Update Item
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </DashboardLayout>
    );
}
