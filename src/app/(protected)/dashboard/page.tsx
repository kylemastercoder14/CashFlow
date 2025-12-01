/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2,
  DollarSign,
  Folder,
  TrendingUp,
  TrendingDown,
  Calendar,
  PiggyBank,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(142, 76%, 36%)",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(0, 84%, 60%)",
  },
  income: {
    label: "Income",
    color: "hsl(142, 76%, 36%)",
  },
  outgoings: {
    label: "Outgoings",
    color: "hsl(0, 84%, 60%)",
  },
  netProfit: {
    label: "Net Profit",
    color: "hsl(217, 91%, 60%)",
  },
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [revenues, setRevenues] = useState<any[]>([]);
  const [savings, setSavings] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState("monthly");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [expensesRes, revenueRes, savingsRes, budgetRes, invoicesRes] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/revenue"),
        fetch("/api/savings"),
        fetch("/api/budget"),
        fetch("/api/invoices"),
      ]);

      if (!expensesRes.ok || !revenueRes.ok || !savingsRes.ok || !budgetRes.ok || !invoicesRes.ok) {
        toast.error("Failed to fetch dashboard data");
        return;
      }

      const expensesData = await expensesRes.json();
      const revenuesData = await revenueRes.json();
      const savingsData = await savingsRes.json();
      const budgetsData = await budgetRes.json();
      const invoicesData = await invoicesRes.json();

      setExpenses(expensesData);
      setRevenues(revenuesData);
      setSavings(savingsData);
      setBudgets(budgetsData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalRevenue = revenues.filter((r: any) => r.status === "Received").reduce((sum: number, r: any) => sum + r.amount, 0);
    const totalExpenses = expenses.filter((e: any) => e.status === "Paid").reduce((sum: number, e: any) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const totalSavings = savings
      .filter((s: any) => s.type === "Deposit")
      .reduce((sum: number, s: any) => sum + s.amount, 0) -
      savings.filter((s: any) => s.type === "Withdrawal").reduce((sum: number, s: any) => sum + s.amount, 0);

    // Calculate previous period for trends (last 30 days vs previous 30 days)
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const currentRevenue = revenues
      .filter((r: any) => new Date(r.date) >= last30Days && r.status === "Received")
      .reduce((sum: number, r: any) => sum + r.amount, 0);
    const previousRevenue = revenues
      .filter((r: any) => {
        const date = new Date(r.date);
        return date >= previous30Days && date < last30Days && r.status === "Received";
      })
      .reduce((sum: number, r: any) => sum + r.amount, 0);

    const currentExpenses = expenses
      .filter((e: any) => new Date(e.date) >= last30Days && e.status === "Paid")
      .reduce((sum: number, e: any) => sum + e.amount, 0);
    const previousExpenses = expenses
      .filter((e: any) => {
        const date = new Date(e.date);
        return date >= previous30Days && date < last30Days && e.status === "Paid";
      })
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    const revenueTrend = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const expenseTrend = previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;
    const profitTrend = previousRevenue - previousExpenses > 0
      ? ((netProfit - (previousRevenue - previousExpenses)) / (previousRevenue - previousExpenses)) * 100
      : 0;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      totalSavings,
      revenueTrend,
      expenseTrend,
      profitTrend,
      totalTransactions: expenses.length + revenues.length,
    };
  }, [expenses, revenues, savings]);

  // Generate monthly data for charts
  const monthlyData = useMemo(() => {
    const data: Record<string, { revenue: number; expenses: number; profit: number }> = {};

    revenues.forEach((revenue: any) => {
      if (revenue.status === "Received") {
        const date = new Date(revenue.date);
        const monthKey = date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });
        if (!data[monthKey]) {
          data[monthKey] = { revenue: 0, expenses: 0, profit: 0 };
        }
        data[monthKey].revenue += revenue.amount;
      }
    });

    expenses.forEach((expense: any) => {
      if (expense.status === "Paid") {
        const date = new Date(expense.date);
        const monthKey = date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });
        if (!data[monthKey]) {
          data[monthKey] = { revenue: 0, expenses: 0, profit: 0 };
        }
        data[monthKey].expenses += expense.amount;
      }
    });

    return Object.entries(data)
      .map(([month, values]) => ({
        month,
        revenue: values.revenue,
        expenses: values.expenses,
        profit: values.revenue - values.expenses,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12); // Last 12 months
  }, [revenues, expenses]);

  // Generate daily data for last 7 days
  const dailyData = useMemo(() => {
    const data: Record<string, { revenue: number; expenses: number }> = {};
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayKey = days[date.getDay()];
      data[dayKey] = { revenue: 0, expenses: 0 };
    }

    revenues.forEach((revenue: any) => {
      if (revenue.status === "Received") {
        const date = new Date(revenue.date);
        const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff <= 6) {
          const dayKey = days[date.getDay()];
          if (data[dayKey]) {
            data[dayKey].revenue += revenue.amount;
          }
        }
      }
    });

    expenses.forEach((expense: any) => {
      if (expense.status === "Paid") {
        const date = new Date(expense.date);
        const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff <= 6) {
          const dayKey = days[date.getDay()];
          if (data[dayKey]) {
            data[dayKey].expenses += expense.amount;
          }
        }
      }
    });

    return Object.entries(data).map(([day, values]) => ({
      day,
      revenue: values.revenue,
      expenses: values.expenses,
    }));
  }, [revenues, expenses]);

  // Expenses by category
  const expensesByCategory = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    expenses
      .filter((e: any) => e.status === "Paid")
      .forEach((expense: any) => {
        const categoryName = expense.category?.name || "Uncategorized";
        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + expense.amount;
      });

    const colors = ["#ef4444", "#f97316", "#eab308", "#8b5cf6", "#3b82f6", "#10b981"];
    return Object.entries(categoryMap)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [expenses]);

  // Budget data
  const budgetData = useMemo(() => {
    const totalBudget = budgets.reduce((sum: number, b: any) => sum + b.allocated, 0);
    const totalSpent = budgets.reduce((sum: number, b: any) => sum + b.spent, 0);

    return {
      totalBudget,
      totalSpent,
      budgets: budgets.slice(0, 4).map((budget: any) => ({
        name: budget.name,
        spent: budget.spent,
        total: budget.allocated,
        percentage: budget.allocated > 0 ? (budget.spent / budget.allocated) * 100 : 0,
      })),
    };
  }, [budgets]);

  // Savings data
  const savingsData = useMemo(() => {
    const totalDeposits = savings
      .filter((s: any) => s.type === "Deposit")
      .reduce((sum: number, s: any) => sum + s.amount, 0);
    const totalWithdrawals = savings
      .filter((s: any) => s.type === "Withdrawal")
      .reduce((sum: number, s: any) => sum + s.amount, 0);
    return {
      totalDeposits,
      totalWithdrawals,
      netSavings: totalDeposits - totalWithdrawals,
    };
  }, [savings]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Loading text="Loading dashboard..." />
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(summaryStats.totalRevenue),
      trend: `${summaryStats.revenueTrend >= 0 ? "+" : ""}${summaryStats.revenueTrend.toFixed(1)}%`,
      trendDirection: summaryStats.revenueTrend >= 0 ? "up" : "down",
      icon: Building2,
      iconColor: "bg-purple-500",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(summaryStats.totalExpenses),
      trend: `${summaryStats.expenseTrend >= 0 ? "+" : ""}${summaryStats.expenseTrend.toFixed(1)}%`,
      trendDirection: summaryStats.expenseTrend >= 0 ? "down" : "up",
      icon: Folder,
      iconColor: "bg-orange-500",
    },
    {
      title: "Net Profit",
      value: formatCurrency(summaryStats.netProfit),
      trend: `${summaryStats.profitTrend >= 0 ? "+" : ""}${summaryStats.profitTrend.toFixed(1)}%`,
      trendDirection: summaryStats.profitTrend >= 0 ? "up" : "down",
      icon: DollarSign,
      iconColor: "bg-blue-500",
    },
    {
      title: "Net Savings",
      value: formatCurrency(savingsData.netSavings),
      trend: `${savingsData.totalDeposits > 0 ? "+" : ""}${((savingsData.netSavings / savingsData.totalDeposits) * 100).toFixed(1)}%`,
      trendDirection: savingsData.netSavings >= 0 ? "up" : "down",
      icon: PiggyBank,
      iconColor: "bg-teal-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const TrendIcon = card.trendDirection === "up" ? TrendingUp : TrendingDown;
          const trendColor = card.trendDirection === "up" ? "text-green-600" : "text-red-600";

          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`${card.iconColor} p-2 rounded-lg`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className={`flex items-center text-xs ${trendColor} mt-1`}>
                  <TrendIcon className="h-3 w-3 mr-1" />
                  {card.trend} {card.trendDirection === "up" ? "Increased" : "Decreased"} last month
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Statistics and Budget Status */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Total Statistics Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Total Statistics</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold">{formatCurrency(summaryStats.totalRevenue + summaryStats.totalExpenses)}</span>
                  <div className="flex items-center text-green-600 text-sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {summaryStats.revenueTrend >= 0 ? "+" : ""}
                    {summaryStats.revenueTrend.toFixed(1)}%
                  </div>
                </div>
              </div>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[150px]">
                  <Calendar className="h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeframe === "daily" ? dailyData : monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey={timeframe === "daily" ? "day" : "month"} />
                  <YAxis />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid gap-2">
                              {payload.map((entry: any, index: number) => (
                                <div key={index} className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-sm text-muted-foreground">{entry.name}</span>
                                  </div>
                                  <span className="font-medium">{formatCurrency(entry.value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <span className="text-sm">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span className="text-sm">Expenses</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Status */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Budget</span>
                <span className="text-sm font-bold">
                  {formatCurrency(budgetData.totalSpent)} out of {formatCurrency(budgetData.totalBudget)}
                </span>
              </div>
              <Progress
                value={budgetData.totalBudget > 0 ? (budgetData.totalSpent / budgetData.totalBudget) * 100 : 0}
                className="h-3"
              />
            </div>
            <div className="space-y-4">
              {budgetData.budgets.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">No budgets set</div>
              ) : (
                budgetData.budgets.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm">
                        {formatCurrency(item.spent)} / {formatCurrency(item.total)}
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cash Flow</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">{formatCurrency(summaryStats.netProfit)}</span>
                <div className={`flex items-center text-sm ${summaryStats.profitTrend >= 0 ? "text-green-600" : "text-red-600"}`}>
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {summaryStats.profitTrend >= 0 ? "+" : ""}
                  {summaryStats.profitTrend.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                  <span className="text-sm">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                  <span className="text-sm">Expenses</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                                </div>
                                <span className="font-medium">{formatCurrency(entry.value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Income Statement and Expenses by Category */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Income Statement */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Income Statement</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold">{formatCurrency(summaryStats.netProfit)}</span>
                  <div className={`flex items-center text-sm ${summaryStats.profitTrend >= 0 ? "text-green-600" : "text-red-600"}`}>
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {summaryStats.profitTrend >= 0 ? "+" : ""}
                    {summaryStats.profitTrend.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid gap-2">
                              {payload.map((entry: any, index: number) => (
                                <div key={index} className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-sm text-muted-foreground">{entry.name}</span>
                                  </div>
                                  <span className="font-medium">{formatCurrency(entry.value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={3}
                    dot={{ fill: "hsl(217, 91%, 60%)", r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Expenses by Category</CardTitle>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{formatCurrency(summaryStats.totalExpenses)}</span>
            </div>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No expense data available</div>
            ) : (
              <>
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="font-medium">{payload[0].payload.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatCurrency(payload[0].value as number)}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="space-y-2 mt-4">
                  {expensesByCategory.map((item, index) => {
                    const total = expensesByCategory.reduce((sum, i) => sum + i.value, 0);
                    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                          <span className="text-sm text-muted-foreground">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Savings Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Savings Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Deposits</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(savingsData.totalDeposits)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Withdrawals</div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(savingsData.totalWithdrawals)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Net Savings</div>
              <div
                className={`text-2xl font-bold ${savingsData.netSavings >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(savingsData.netSavings)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
