"use client"

import { useState, useEffect } from "react"
import {
  getCardamomPrices,
  getCardamomStats,
  getCardamomVarieties,
  getCardamomMarkets,
  refreshCardamomPrices,
  type CardamomPrice,
  type CardamomPriceStats,
  type CardamomMarket,
} from "@/lib/api-client"
import { useAuth } from "@/contexts/AuthContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { format } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { RefreshCw, TrendingUp, MapPin, Package, BarChart3 } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

export default function CardamomPricesPage() {
  const { toast } = useToast()
  const { resolvedTheme } = useTheme()
  const { user, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  const [prices, setPrices] = useState<CardamomPrice[]>([])
  const [stats, setStats] = useState<CardamomPriceStats | null>(null)
  const [varieties, setVarieties] = useState<string[]>([])
  const [markets, setMarkets] = useState<CardamomMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [selectedVariety, setSelectedVariety] = useState<string>("All")
  const [selectedMarket, setSelectedMarket] = useState<string>("All")

  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth?role=buyer')
      return
    }
    if (user) {
      fetchData(true)
    }
  }, [user, authLoading, router])

  const fetchData = async (autoSeedIfEmpty = false) => {
    try {
      setLoading(true)
      const [pricesData, statsData, varietiesData, marketsData] = await Promise.all([
        getCardamomPrices(),
        getCardamomStats(),
        getCardamomVarieties(),
        getCardamomMarkets(),
      ])
      setPrices(pricesData)
      setStats(statsData)
      setVarieties(varietiesData)
      setMarkets(marketsData)

      // On first load, if DB is empty auto-seed from indianspices.com
      if (autoSeedIfEmpty && pricesData.length === 0) {
        setRefreshing(true)
        try {
          await refreshCardamomPrices()
          const [newPrices, newStats, newVarieties, newMarkets] = await Promise.all([
            getCardamomPrices(),
            getCardamomStats(),
            getCardamomVarieties(),
            getCardamomMarkets(),
          ])
          setPrices(newPrices)
          setStats(newStats)
          setVarieties(newVarieties)
          setMarkets(newMarkets)
        } catch {
          // silently ignore — user can click Refresh manually
        } finally {
          setRefreshing(false)
        }
      }
    } catch (error) {
      console.error('Error fetching cardamom prices:', error)
      toast({
        title: "Error",
        description: "Failed to load cardamom prices.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      const result = await refreshCardamomPrices()
      await fetchData()
      toast({
        title: "Data Refreshed",
        description: `${result.inserted} new prices added, ${result.deleted} old records removed.`,
      })
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh cardamom prices. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Filter prices
  const filteredPrices = prices.filter((p) => {
    const varietyMatch = selectedVariety === "All" || p.variety === selectedVariety
    const marketMatch = selectedMarket === "All" || p.market === selectedMarket
    return varietyMatch && marketMatch
  })

  // Prepare chart data (last 7 days, grouped by variety)
  const chartData = prepareChartData(filteredPrices)

  if (authLoading || loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading cardamom prices...</p>
            {refreshing && <p className="mt-1 text-xs text-muted-foreground">Fetching live data from indianspices.com…</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("cardamom.pageTitle")}</h1>
          <p className="text-muted-foreground mt-1">Live prices from indianspices.com (Last 7 days)</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {t("cardamom.refreshData")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.totalMarkets || 0}</div>
                <div className="text-sm text-muted-foreground">{t("cardamom.market")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.totalVarieties || 0}</div>
                <div className="text-sm text-muted-foreground">{t("cardamom.variety")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">₹{stats?.avgPrice?.toFixed(0) || 0}</div>
                <div className="text-sm text-muted-foreground">Avg Price/Kg</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{filteredPrices.length}</div>
                <div className="text-sm text-muted-foreground">Price Entries</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filter by Variety</label>
              <Select value={selectedVariety} onValueChange={setSelectedVariety}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Varieties</SelectItem>
                  {varieties.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filter by Market</label>
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Markets</SelectItem>
                  {markets.map((m) => (
                    <SelectItem key={m.market} value={m.market}>
                      {m.market} {m.state && `(${m.state})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Price Trends (Last 7 Days)</CardTitle>
            <CardDescription>Modal price trends across markets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                <XAxis dataKey="date" stroke={isDark ? "#9ca3af" : "#6b7280"} />
                <YAxis stroke={isDark ? "#9ca3af" : "#6b7280"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="modalPrice"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Modal Price (₹/Kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Price Table */}
      <Card>
        <CardHeader>
          <CardTitle>Price Details</CardTitle>
          <CardDescription>Current cardamom prices from indianspices.com — Small Cardamom shows auction avg price; Large Cardamom shows market rate</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPrices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("cardamom.noData")}</p>
              <p className="text-sm mt-2">Click "Refresh Data" to fetch latest prices from indianspices.com</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead>{t("cardamom.market")}</TableHead>
                    <TableHead>{t("cardamom.variety")}</TableHead>
                    <TableHead>{t("cardamom.minPrice")}</TableHead>
                    <TableHead>{t("cardamom.modalPrice")}</TableHead>
                    <TableHead>{t("cardamom.maxPrice")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrices.slice(0, 100).map((price) => (
                    <TableRow key={price.id}>
                      <TableCell>
                        {format(new Date(price.arrivalDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{price.market}</div>
                          {price.district && (
                            <div className="text-xs text-muted-foreground">
                              {price.district}, {price.state}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{price.variety}</Badge>
                      </TableCell>
                      <TableCell>₹{price.minPrice?.toLocaleString() || '-'}</TableCell>
                      <TableCell className="font-bold text-primary">
                        ₹{price.modalPrice.toLocaleString()}
                      </TableCell>
                      <TableCell>₹{price.maxPrice?.toLocaleString() || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to prepare chart data
function prepareChartData(prices: CardamomPrice[]) {
  // Group by date and calculate average modal price
  const grouped = prices.reduce((acc, price) => {
    const dateKey = format(new Date(price.arrivalDate), "MMM dd")
    if (!acc[dateKey]) {
      acc[dateKey] = { date: dateKey, total: 0, count: 0 }
    }
    acc[dateKey].total += price.modalPrice
    acc[dateKey].count += 1
    return acc
  }, {} as Record<string, { date: string; total: number; count: number }>)

  return Object.values(grouped)
    .map((g) => ({
      date: g.date,
      modalPrice: Math.round(g.total / g.count),
    }))
    .sort((a, b) => {
      const dateA = new Date(a.date + " 2026")
      const dateB = new Date(b.date + " 2026")
      return dateA.getTime() - dateB.getTime()
    })
}
