/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ComposedChart, Line } from "recharts";
import { Calendar, Download, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";

interface CashFlowData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export default function CashFlowPage() {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [timeframe, setTimeframe] = useState("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCashFlowData();
  }, [timeframe]);

  const fetchCashFlowData = async () => {
    try {
      setLoading(true);

      // Fetch expenses and revenue
      const [expensesRes, revenueRes] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/revenue"),
      ]);

      if (!expensesRes.ok || !revenueRes.ok) {
        toast.error("Failed to fetch cash flow data");
        return;
      }

      const expenses = await expensesRes.json();
      const revenues = await revenueRes.json();

      // Group by month
      const monthlyData: Record<string, { income: number; expenses: number; label: string }> = {};

      // Process revenues (income)
      revenues.forEach((revenue: any) => {
        const date = new Date(revenue.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0, label: monthLabel };
        }
        if (revenue.status === "Received") {
          monthlyData[monthKey].income += revenue.amount;
        }
      });

      // Process expenses
      expenses.forEach((expense: any) => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0, label: monthLabel };
        }
        if (expense.status === "Paid") {
          monthlyData[monthKey].expenses += expense.amount;
        }
      });

      // Convert to array and sort by month
      const sortedData = Object.entries(monthlyData)
        .map(([key, data]: [string, any]) => ({
          month: data.label || key,
          monthKey: key,
          income: data.income,
          expenses: data.expenses,
          net: data.income - data.expenses,
        }))
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
        .slice(-12); // Last 12 months

      setCashFlowData(sortedData);
    } catch (error) {
      console.error("Error fetching cash flow data:", error);
      toast.error("Failed to fetch cash flow data");
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = cashFlowData.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = cashFlowData.reduce((sum, item) => sum + item.expenses, 0);
  const netCashFlow = totalIncome - totalExpenses;
  const averageMonthly = cashFlowData.length > 0 ? netCashFlow / cashFlowData.length : 0;

  const chartConfig = {
    income: {
      label: "Income",
      color: "hsl(180, 100%, 25%)",
    },
    expenses: {
      label: "Expenses",
      color: "hsl(0, 84%, 60%)",
    },
    net: {
      label: "Net Cash Flow",
      color: "hsl(142, 76%, 36%)",
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">
              {cashFlowData.length > 0 ? `Last ${cashFlowData.length} months` : "No data"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {cashFlowData.length > 0 ? `Last ${cashFlowData.length} months` : "No data"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netCashFlow)}
            </div>
            <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${averageMonthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(averageMonthly)}
            </div>
            <p className="text-xs text-muted-foreground">Average per month</p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cash Flow Overview</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchCashFlowData}>
                <Download className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loading text="Loading cash flow data..." />
          ) : cashFlowData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No cash flow data available. Add some expenses and revenue to see your cash flow.
            </div>
          ) : (
            <>
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Bar dataKey="income" fill="hsl(180, 100%, 25%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="hsl(142, 76%, 36%)"
                      strokeWidth={3}
                      dot={{ fill: "hsl(142, 76%, 36%)", r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-700"></div>
                  <span className="text-sm">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Expenses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                  <span className="text-sm">Net Cash Flow</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loading />
          ) : cashFlowData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No data available. Start tracking your expenses and revenue to see monthly breakdowns.
            </div>
          ) : (
            <div className="space-y-4">
              {cashFlowData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.month}</div>
                    <div className="text-sm text-muted-foreground">
                      Income: {formatCurrency(item.income)} | Expenses: {formatCurrency(item.expenses)}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${item.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.net >= 0 ? '+' : ''}{formatCurrency(item.net)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
