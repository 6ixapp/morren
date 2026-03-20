"use client"

import { useState, useMemo } from "react"
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// ─── Historical Price Data (Monthly auction prices ₹/kg, 2014–2026) ───────────
export const HISTORICAL_DATA = [
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
]

export const YEAR_LINE_COLORS: Record<string, string> = {
  "2022": "#FF6B6B",
  "2023": "#FFD93D",
  "2024": "#4D96FF",
  "2025": "#FF69B4",
  "2026": "#00C853",
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

function buildYearComparisonData() {
  const yearMap: Record<number, Record<string, number>> = {}
  HISTORICAL_DATA.forEach(({ date, price }) => {
    const parts = date.split("'")
    const monthStr = parts[0]
    const year = 2000 + parseInt(parts[1])
    if (year >= 2022) {
      if (!yearMap[year]) yearMap[year] = {}
      yearMap[year][monthStr] = price
    }
  })
  return MONTHS.map((month) => {
    const point: Record<string, number | string> = { month }
    ;[2022, 2023, 2024, 2025, 2026].forEach((yr) => {
      if (yearMap[yr]?.[month] !== undefined) {
        point[`y${yr}`] = yearMap[yr][month]
      }
    })
    return point
  })
}

// ─── Historical Price Chart (Area chart, range filters) ───────────────────────
export function HistoricalPriceChart({ isDark }: { isDark: boolean }) {
  const [range, setRange] = useState(0)
  const RANGE_OPTIONS = [
    { label: "All", months: 0 },
    { label: "5Y", months: 60 },
    { label: "3Y", months: 36 },
    { label: "1Y", months: 12 },
  ]
  const filtered = useMemo(() => {
    if (range === 0) return HISTORICAL_DATA
    return HISTORICAL_DATA.slice(-range)
  }, [range])

  const currentPrice = HISTORICAL_DATA[HISTORICAL_DATA.length - 1].price
  const firstPrice = filtered[0]?.price ?? currentPrice
  const pctChange = ((currentPrice - firstPrice) / firstPrice) * 100
  const maxPrice = Math.max(...filtered.map((d) => d.price))
  const minPrice = Math.min(...filtered.map((d) => d.price))
  const xInterval = Math.max(0, Math.floor(filtered.length / 8) - 1)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Historical Price Chart (2014–2026)</CardTitle>
            <CardDescription>Monthly cardamom auction prices (₹/kg)</CardDescription>
          </div>
          <div className="flex gap-2">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setRange(opt.months)}
                className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
                style={{
                  background: range === opt.months ? "#00C853" : "transparent",
                  color: range === opt.months ? "#fff" : isDark ? "#aaa" : "#555",
                  borderColor: range === opt.months ? "#00C853" : isDark ? "#374151" : "#d1d5db",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Current: </span>
            <span className="font-bold text-green-500">₹{currentPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Range High: </span>
            <span className="font-semibold">₹{maxPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Range Low: </span>
            <span className="font-semibold">₹{minPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Change: </span>
            <span className={`font-bold ${pctChange >= 0 ? "text-green-500" : "text-red-500"}`}>
              {pctChange >= 0 ? "+" : ""}{pctChange.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={filtered} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C853" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
            <XAxis
              dataKey="date"
              stroke={isDark ? "#9ca3af" : "#6b7280"}
              tick={{ fontSize: 11 }}
              interval={xInterval}
            />
            <YAxis
              stroke={isDark ? "#9ca3af" : "#6b7280"}
              tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v}`}
              tick={{ fontSize: 11 }}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#1f2937" : "#ffffff",
                border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                borderRadius: "8px",
              }}
              formatter={(val: number) => [`₹${val.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/kg`, "Price"]}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#00C853"
              strokeWidth={2}
              fill="url(#histGradient)"
              dot={false}
              activeDot={{ r: 5, fill: "#00C853" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ─── Year-over-Year Comparison Chart ─────────────────────────────────────────
export function YearComparisonChart({ isDark }: { isDark: boolean }) {
  const data = useMemo(() => buildYearComparisonData(), [])
  const years = ["2022", "2023", "2024", "2025", "2026"] as const

  return (
    <Card>
      <CardHeader>
        <CardTitle>5-Year Comparison (2022–2026)</CardTitle>
        <CardDescription>Month-by-month price overlay across the last 5 years</CardDescription>
        <div className="flex flex-wrap gap-3 mt-2">
          {years.map((yr) => (
            <div key={yr} className="flex items-center gap-1.5 text-xs font-semibold">
              <span
                className="inline-block rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: YEAR_LINE_COLORS[yr],
                  boxShadow: yr === "2026" ? `0 0 6px ${YEAR_LINE_COLORS[yr]}` : "none",
                }}
              />
              <span style={{ color: yr === "2026" ? YEAR_LINE_COLORS[yr] : isDark ? "#ccc" : "#555" }}>
                {yr}{yr === "2026" ? " ●" : ""}
              </span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
            <XAxis
              dataKey="month"
              stroke={isDark ? "#9ca3af" : "#6b7280"}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              stroke={isDark ? "#9ca3af" : "#6b7280"}
              tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v}`}
              tick={{ fontSize: 11 }}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#1f2937" : "#ffffff",
                border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                borderRadius: "8px",
              }}
              formatter={(val: number, name: string) => [
                `₹${val.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/kg`,
                name.replace("y", ""),
              ]}
            />
            {years.map((yr) => (
              <Line
                key={yr}
                type="monotone"
                dataKey={`y${yr}`}
                stroke={YEAR_LINE_COLORS[yr]}
                strokeWidth={yr === "2026" ? 2.5 : 1.5}
                dot={yr === "2026" ? { r: 4, fill: YEAR_LINE_COLORS[yr] } : false}
                activeDot={{ r: 5 }}
                connectNulls
                name={yr}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
