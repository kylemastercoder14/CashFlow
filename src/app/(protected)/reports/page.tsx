/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { Printer, Calendar, FileText, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";

const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(142, 76%, 36%)" },
  expenses: { label: "Expenses", color: "hsl(0, 84%, 60%)" },
  profit: { label: "Profit", color: "hsl(217, 91%, 60%)" },
  income: { label: "Income", color: "hsl(142, 76%, 36%)" },
  deposits: { label: "Deposits", color: "hsl(142, 76%, 36%)" },
  withdrawals: { label: "Withdrawals", color: "hsl(0, 84%, 60%)" },
};

interface ReportData {
  expenses: any[];
  revenues: any[];
  savings: any[];
  budgets: any[];
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState("financial");
  const [timeframe, setTimeframe] = useState("6months");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({
    expenses: [],
    revenues: [],
    savings: [],
    budgets: [],
  });

  useEffect(() => {
    fetchReportData();
  }, [timeframe]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [expensesRes, revenueRes, savingsRes, budgetRes] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/revenue"),
        fetch("/api/savings"),
        fetch("/api/budget"),
      ]);

      if (!expensesRes.ok || !revenueRes.ok || !savingsRes.ok || !budgetRes.ok) {
        toast.error("Failed to fetch report data");
        return;
      }

      const expenses = await expensesRes.json();
      const revenues = await revenueRes.json();
      const savings = await savingsRes.json();
      const budgets = await budgetRes.json();

      // Filter data based on timeframe
      const now = new Date();
      const filterDate = getFilterDate(now, timeframe);

      const filteredExpenses = expenses.filter((e: any) => new Date(e.date) >= filterDate);
      const filteredRevenues = revenues.filter((r: any) => new Date(r.date) >= filterDate);
      const filteredSavings = savings.filter((s: any) => new Date(s.date) >= filterDate);

      setReportData({
        expenses: filteredExpenses,
        revenues: filteredRevenues,
        savings: filteredSavings,
        budgets,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const getFilterDate = (now: Date, timeframe: string): Date => {
    const date = new Date(now);
    switch (timeframe) {
      case "1month":
        date.setMonth(date.getMonth() - 1);
        break;
      case "3months":
        date.setMonth(date.getMonth() - 3);
        break;
      case "6months":
        date.setMonth(date.getMonth() - 6);
        break;
      case "1year":
        date.setFullYear(date.getFullYear() - 1);
        break;
      default:
        date.setMonth(date.getMonth() - 6);
    }
    return date;
  };

  // Calculate totals
  const totalRevenue = reportData.revenues
    .filter((r: any) => r.status === "Received")
    .reduce((sum: number, r: any) => sum + r.amount, 0);
  const totalExpenses = reportData.expenses
    .filter((e: any) => e.status === "Paid")
    .reduce((sum: number, e: any) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Group data by month for charts
  const getMonthlyData = () => {
    const monthlyData: Record<string, { revenue: number; expenses: number; profit: number }> = {};

    reportData.revenues.forEach((revenue: any) => {
      if (revenue.status === "Received") {
        const date = new Date(revenue.date);
        const monthKey = date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, expenses: 0, profit: 0 };
        }
        monthlyData[monthKey].revenue += revenue.amount;
      }
    });

    reportData.expenses.forEach((expense: any) => {
      if (expense.status === "Paid") {
        const date = new Date(expense.date);
        const monthKey = date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, expenses: 0, profit: 0 };
        }
        monthlyData[monthKey].expenses += expense.amount;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  };

  // Revenue by category
  const getRevenueByCategory = () => {
    const categoryMap: Record<string, number> = {};
    reportData.revenues.forEach((revenue: any) => {
      if (revenue.status === "Received") {
        const categoryName = revenue.category?.name || "Uncategorized";
        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + revenue.amount;
      }
    });

    const colors = ["#9333ea", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
    return Object.entries(categoryMap)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Expenses by category
  const getExpensesByCategory = () => {
    const categoryMap: Record<string, number> = {};
    reportData.expenses.forEach((expense: any) => {
      if (expense.status === "Paid") {
        const categoryName = expense.category?.name || "Uncategorized";
        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + expense.amount;
      }
    });

    const colors = ["#ef4444", "#f97316", "#eab308", "#8b5cf6", "#3b82f6", "#10b981"];
    return Object.entries(categoryMap)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Savings data
  const getSavingsData = () => {
    const totalDeposits = reportData.savings
      .filter((s: any) => s.type === "Deposit")
      .reduce((sum: number, s: any) => sum + s.amount, 0);
    const totalWithdrawals = reportData.savings
      .filter((s: any) => s.type === "Withdrawal")
      .reduce((sum: number, s: any) => sum + s.amount, 0);
    const netSavings = totalDeposits - totalWithdrawals;

    // Group by category
    const categoryMap: Record<string, { deposits: number; withdrawals: number }> = {};
    reportData.savings.forEach((saving: any) => {
      const category = saving.category || "Uncategorized";
      if (!categoryMap[category]) {
        categoryMap[category] = { deposits: 0, withdrawals: 0 };
      }
      if (saving.type === "Deposit") {
        categoryMap[category].deposits += saving.amount;
      } else {
        categoryMap[category].withdrawals += saving.amount;
      }
    });

    return {
      totalDeposits,
      totalWithdrawals,
      netSavings,
      byCategory: Object.entries(categoryMap).map(([name, data]) => ({
        name,
        deposits: data.deposits,
        withdrawals: data.withdrawals,
        net: data.deposits - data.withdrawals,
      })),
    };
  };

  const monthlyData = getMonthlyData();
  const revenueByCategory = getRevenueByCategory();
  const expensesByCategory = getExpensesByCategory();
  const savingsData = getSavingsData();

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print reports");
      return;
    }

    const getTimeframeLabel = () => {
      switch (timeframe) {
        case "1month":
          return "Last Month";
        case "3months":
          return "Last 3 Months";
        case "6months":
          return "Last 6 Months";
        case "1year":
          return "Last Year";
        default:
          return "Last 6 Months";
      }
    };

    const getReportTypeLabel = () => {
      switch (reportType) {
        case "financial":
          return "Financial Summary";
        case "income":
          return "Income Analysis";
        case "expenses":
          return "Expense Analysis";
        case "savings":
          return "Savings Analysis";
        default:
          return "Financial Report";
      }
    };

    // Generate print content based on report type
    let printContent = "";

    if (reportType === "financial") {
      printContent = generateFinancialSummaryPrint();
    } else if (reportType === "income") {
      printContent = generateIncomeAnalysisPrint();
    } else if (reportType === "expenses") {
      printContent = generateExpenseAnalysisPrint();
    } else if (reportType === "savings") {
      printContent = generateSavingsAnalysisPrint();
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${getReportTypeLabel()} - ${getTimeframeLabel()}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              color: #000;
              background: #fff;
              padding: 2rem;
            }
            .report-container {
              max-width: 1000px;
              margin: 0 auto;
            }
            .header {
              margin-bottom: 2rem;
              border-bottom: 2px solid #333;
              padding-bottom: 1rem;
            }
            .header h1 {
              font-size: 2rem;
              font-weight: bold;
              margin-bottom: 0.5rem;
            }
            .header-info {
              display: flex;
              justify-content: space-between;
              color: #666;
              font-size: 0.875rem;
            }
            .summary-cards {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 1rem;
              margin-bottom: 2rem;
            }
            .summary-card {
              border: 1px solid #ddd;
              padding: 1rem;
              border-radius: 4px;
            }
            .summary-card-title {
              font-size: 0.875rem;
              color: #666;
              margin-bottom: 0.5rem;
            }
            .summary-card-value {
              font-size: 1.5rem;
              font-weight: bold;
            }
            .summary-card-value.positive {
              color: #16a34a;
            }
            .summary-card-value.negative {
              color: #dc2626;
            }
            .section {
              margin-bottom: 2rem;
            }
            .section-title {
              font-size: 1.25rem;
              font-weight: bold;
              margin-bottom: 1rem;
              border-bottom: 1px solid #ddd;
              padding-bottom: 0.5rem;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 1.5rem;
            }
            thead tr {
              border-bottom: 2px solid #333;
            }
            th {
              text-align: left;
              padding: 0.75rem 1rem;
              font-weight: 600;
              background: #f5f5f5;
            }
            th.text-center {
              text-align: center;
            }
            th.text-right {
              text-align: right;
            }
            tbody tr {
              border-bottom: 1px solid #ddd;
            }
            tbody tr:hover {
              background: #f9f9f9;
            }
            td {
              padding: 0.75rem 1rem;
            }
            td.text-center {
              text-align: center;
            }
            td.text-right {
              text-align: right;
            }
            .category-item {
              display: flex;
              justify-content: space-between;
              padding: 0.75rem;
              border-bottom: 1px solid #eee;
            }
            .category-name {
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
            .category-color {
              width: 16px;
              height: 16px;
              border-radius: 50%;
              display: inline-block;
            }
            .footer {
              margin-top: 3rem;
              padding-top: 1.5rem;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 0.875rem;
              color: #666;
            }
            @media print {
              body {
                padding: 1rem;
              }
              @page {
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>${getReportTypeLabel()}</h1>
              <div class="header-info">
                <span>Period: ${getTimeframeLabel()}</span>
                <span>Generated: ${new Date().toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</span>
              </div>
            </div>
            ${printContent}
            <div class="footer">
              <p>Generated by CashFlow Financial Management System</p>
              <p>This is a computer-generated report.</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const generateFinancialSummaryPrint = () => {
    const sortedRevenues = [...reportData.revenues].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const sortedExpenses = [...reportData.expenses].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return `
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-card-title">Total Revenue</div>
          <div class="summary-card-value positive">${formatCurrency(totalRevenue)}</div>
          <div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">
            ${reportData.revenues.filter((r: any) => r.status === "Received").length} transactions
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Total Expenses</div>
          <div class="summary-card-value negative">${formatCurrency(totalExpenses)}</div>
          <div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">
            ${reportData.expenses.filter((e: any) => e.status === "Paid").length} transactions
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Net Profit</div>
          <div class="summary-card-value ${netProfit >= 0 ? "positive" : "negative"}">${formatCurrency(netProfit)}</div>
          <div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">
            ${profitMargin.toFixed(1)}% profit margin
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Total Transactions</div>
          <div class="summary-card-value">${reportData.revenues.length + reportData.expenses.length}</div>
          <div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">
            All records
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Monthly Income Statement</div>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th class="text-right">Revenue</th>
              <th class="text-right">Expenses</th>
              <th class="text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyData.length === 0
              ? '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #666;">No data available for the selected period</td></tr>'
              : monthlyData
                  .map(
                    (item) => `
              <tr>
                <td>${item.month}</td>
                <td class="text-right">${formatCurrency(item.revenue)}</td>
                <td class="text-right">${formatCurrency(item.expenses)}</td>
                <td class="text-right ${item.profit >= 0 ? "positive" : "negative"}">${formatCurrency(item.profit)}</td>
              </tr>
            `
                  )
                  .join("")}
          </tbody>
        </table>
      </div>
      <div class="section">
        <div class="section-title">All Revenue Transactions</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Customer</th>
              <th class="text-right">Amount</th>
              <th>Payment Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${sortedRevenues.length === 0
              ? '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #666;">No revenue data available</td></tr>'
              : sortedRevenues
                  .map(
                    (item: any) => `
              <tr>
                <td>${new Date(item.date).toLocaleDateString("en-PH")}</td>
                <td>${item.description}</td>
                <td>${item.category?.name || "N/A"}</td>
                <td>${item.customer || "-"}</td>
                <td class="text-right positive">${formatCurrency(item.amount)}</td>
                <td>${item.paymentMethod}</td>
                <td>${item.status}</td>
              </tr>
            `
                  )
                  .join("")}
          </tbody>
          <tfoot>
            <tr style="background: #f5f5f5; font-weight: bold;">
              <td colspan="4" class="text-right">Total Revenue:</td>
              <td class="text-right positive">${formatCurrency(totalRevenue)}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="section">
        <div class="section-title">All Expense Transactions</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Vendor</th>
              <th class="text-right">Amount</th>
              <th>Payment Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${sortedExpenses.length === 0
              ? '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #666;">No expense data available</td></tr>'
              : sortedExpenses
                  .map(
                    (item: any) => `
              <tr>
                <td>${new Date(item.date).toLocaleDateString("en-PH")}</td>
                <td>${item.description}</td>
                <td>${item.category?.name || "N/A"}</td>
                <td>${item.vendor || "-"}</td>
                <td class="text-right negative">${formatCurrency(item.amount)}</td>
                <td>${item.paymentMethod}</td>
                <td>${item.status}</td>
              </tr>
            `
                  )
                  .join("")}
          </tbody>
          <tfoot>
            <tr style="background: #f5f5f5; font-weight: bold;">
              <td colspan="4" class="text-right">Total Expenses:</td>
              <td class="text-right negative">${formatCurrency(totalExpenses)}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="section">
        <div class="section-title">Revenue by Category</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Percentage</th>
              <th class="text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            ${revenueByCategory.length === 0
              ? '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #666;">No revenue data available</td></tr>'
              : revenueByCategory
                  .map((item) => {
                    const total = revenueByCategory.reduce((sum, i) => sum + i.value, 0);
                    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                    const count = reportData.revenues.filter(
                      (r: any) => r.category?.name === item.name && r.status === "Received"
                    ).length;
                    return `
                <tr>
                  <td>
                    <div class="category-name">
                      <span class="category-color" style="background-color: ${item.color};"></span>
                      ${item.name}
                    </div>
                  </td>
                  <td class="text-right positive">${formatCurrency(item.value)}</td>
                  <td class="text-right">${percentage}%</td>
                  <td class="text-right">${count}</td>
                </tr>
              `;
                  })
                  .join("")}
          </tbody>
        </table>
      </div>
      <div class="section">
        <div class="section-title">Expenses by Category</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Percentage</th>
              <th class="text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            ${expensesByCategory.length === 0
              ? '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #666;">No expense data available</td></tr>'
              : expensesByCategory
                  .map((item) => {
                    const total = expensesByCategory.reduce((sum, i) => sum + i.value, 0);
                    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                    const count = reportData.expenses.filter(
                      (e: any) => e.category?.name === item.name && e.status === "Paid"
                    ).length;
                    return `
                <tr>
                  <td>
                    <div class="category-name">
                      <span class="category-color" style="background-color: ${item.color};"></span>
                      ${item.name}
                    </div>
                  </td>
                  <td class="text-right negative">${formatCurrency(item.value)}</td>
                  <td class="text-right">${percentage}%</td>
                  <td class="text-right">${count}</td>
                </tr>
              `;
                  })
                  .join("")}
          </tbody>
        </table>
      </div>
    `;
  };

  const generateIncomeAnalysisPrint = () => {
    const sortedRevenues = [...reportData.revenues]
      .filter((r: any) => r.status === "Received")
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return `
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-card-title">Total Revenue</div>
          <div class="summary-card-value positive">${formatCurrency(totalRevenue)}</div>
          <div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">
            ${sortedRevenues.length} transactions
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Average per Transaction</div>
          <div class="summary-card-value">${formatCurrency(sortedRevenues.length > 0 ? totalRevenue / sortedRevenues.length : 0)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Highest Revenue</div>
          <div class="summary-card-value positive">${formatCurrency(sortedRevenues.length > 0 ? Math.max(...sortedRevenues.map((r: any) => r.amount)) : 0)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Categories</div>
          <div class="summary-card-value">${revenueByCategory.length}</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Revenue by Category</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Percentage</th>
              <th class="text-right">Count</th>
              <th class="text-right">Average</th>
            </tr>
          </thead>
          <tbody>
            ${revenueByCategory.length === 0
              ? '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #666;">No revenue data available</td></tr>'
              : revenueByCategory
                  .map((item) => {
                    const total = revenueByCategory.reduce((sum, i) => sum + i.value, 0);
                    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                    const categoryRevenues = reportData.revenues.filter(
                      (r: any) => r.category?.name === item.name && r.status === "Received"
                    );
                    const count = categoryRevenues.length;
                    const average = count > 0 ? item.value / count : 0;
                    return `
                <tr>
                  <td>
                    <div class="category-name">
                      <span class="category-color" style="background-color: ${item.color};"></span>
                      ${item.name}
                    </div>
                  </td>
                  <td class="text-right positive">${formatCurrency(item.value)}</td>
                  <td class="text-right">${percentage}%</td>
                  <td class="text-right">${count}</td>
                  <td class="text-right">${formatCurrency(average)}</td>
                </tr>
              `;
                  })
                  .join("")}
          </tbody>
          <tfoot>
            <tr style="background: #f5f5f5; font-weight: bold;">
              <td class="text-right">Total:</td>
              <td class="text-right positive">${formatCurrency(totalRevenue)}</td>
              <td class="text-right">100%</td>
              <td class="text-right">${sortedRevenues.length}</td>
              <td class="text-right">${formatCurrency(sortedRevenues.length > 0 ? totalRevenue / sortedRevenues.length : 0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="section">
        <div class="section-title">Monthly Revenue Trends</div>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th class="text-right">Revenue</th>
              <th class="text-right">Count</th>
              <th class="text-right">Average</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyData.length === 0
              ? '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #666;">No data available</td></tr>'
              : monthlyData
                  .map((item) => {
                    const monthRevenues = reportData.revenues.filter((r: any) => {
                      const date = new Date(r.date);
                      const monthKey = date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });
                      return monthKey === item.month && r.status === "Received";
                    });
                    const count = monthRevenues.length;
                    const average = count > 0 ? item.revenue / count : 0;
                    return `
              <tr>
                <td>${item.month}</td>
                <td class="text-right positive">${formatCurrency(item.revenue)}</td>
                <td class="text-right">${count}</td>
                <td class="text-right">${formatCurrency(average)}</td>
              </tr>
            `;
                  })
                  .join("")}
          </tbody>
        </table>
      </div>
      <div class="section">
        <div class="section-title">All Revenue Transactions</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Customer</th>
              <th class="text-right">Amount</th>
              <th>Payment Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${sortedRevenues.length === 0
              ? '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #666;">No revenue data available</td></tr>'
              : sortedRevenues
                  .map(
                    (item: any) => `
              <tr>
                <td>${new Date(item.date).toLocaleDateString("en-PH")}</td>
                <td>${item.description}</td>
                <td>${item.category?.name || "N/A"}</td>
                <td>${item.customer || "-"}</td>
                <td class="text-right positive">${formatCurrency(item.amount)}</td>
                <td>${item.paymentMethod}</td>
                <td>${item.status}</td>
              </tr>
            `
                  )
                  .join("")}
          </tbody>
          <tfoot>
            <tr style="background: #f5f5f5; font-weight: bold;">
              <td colspan="4" class="text-right">Total Revenue:</td>
              <td class="text-right positive">${formatCurrency(totalRevenue)}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  };

  const generateExpenseAnalysisPrint = () => {
    const sortedExpenses = [...reportData.expenses]
      .filter((e: any) => e.status === "Paid")
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return `
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-card-title">Total Expenses</div>
          <div class="summary-card-value negative">${formatCurrency(totalExpenses)}</div>
          <div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">
            ${sortedExpenses.length} transactions
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Average per Transaction</div>
          <div class="summary-card-value">${formatCurrency(sortedExpenses.length > 0 ? totalExpenses / sortedExpenses.length : 0)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Highest Expense</div>
          <div class="summary-card-value negative">${formatCurrency(sortedExpenses.length > 0 ? Math.max(...sortedExpenses.map((e: any) => e.amount)) : 0)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Categories</div>
          <div class="summary-card-value">${expensesByCategory.length}</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Expenses by Category</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Percentage</th>
              <th class="text-right">Count</th>
              <th class="text-right">Average</th>
            </tr>
          </thead>
          <tbody>
            ${expensesByCategory.length === 0
              ? '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #666;">No expense data available</td></tr>'
              : expensesByCategory
                  .map((item) => {
                    const total = expensesByCategory.reduce((sum, i) => sum + i.value, 0);
                    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                    const categoryExpenses = reportData.expenses.filter(
                      (e: any) => e.category?.name === item.name && e.status === "Paid"
                    );
                    const count = categoryExpenses.length;
                    const average = count > 0 ? item.value / count : 0;
                    return `
                <tr>
                  <td>
                    <div class="category-name">
                      <span class="category-color" style="background-color: ${item.color};"></span>
                      ${item.name}
                    </div>
                  </td>
                  <td class="text-right negative">${formatCurrency(item.value)}</td>
                  <td class="text-right">${percentage}%</td>
                  <td class="text-right">${count}</td>
                  <td class="text-right">${formatCurrency(average)}</td>
                </tr>
              `;
                  })
                  .join("")}
          </tbody>
          <tfoot>
            <tr style="background: #f5f5f5; font-weight: bold;">
              <td class="text-right">Total:</td>
              <td class="text-right negative">${formatCurrency(totalExpenses)}</td>
              <td class="text-right">100%</td>
              <td class="text-right">${sortedExpenses.length}</td>
              <td class="text-right">${formatCurrency(sortedExpenses.length > 0 ? totalExpenses / sortedExpenses.length : 0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="section">
        <div class="section-title">Monthly Expense Trends</div>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th class="text-right">Expenses</th>
              <th class="text-right">Count</th>
              <th class="text-right">Average</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyData.length === 0
              ? '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #666;">No data available</td></tr>'
              : monthlyData
                  .map((item) => {
                    const monthExpenses = reportData.expenses.filter((e: any) => {
                      const date = new Date(e.date);
                      const monthKey = date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });
                      return monthKey === item.month && e.status === "Paid";
                    });
                    const count = monthExpenses.length;
                    const average = count > 0 ? item.expenses / count : 0;
                    return `
              <tr>
                <td>${item.month}</td>
                <td class="text-right negative">${formatCurrency(item.expenses)}</td>
                <td class="text-right">${count}</td>
                <td class="text-right">${formatCurrency(average)}</td>
              </tr>
            `;
                  })
                  .join("")}
          </tbody>
        </table>
      </div>
      <div class="section">
        <div class="section-title">All Expense Transactions</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Vendor</th>
              <th class="text-right">Amount</th>
              <th>Payment Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${sortedExpenses.length === 0
              ? '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #666;">No expense data available</td></tr>'
              : sortedExpenses
                  .map(
                    (item: any) => `
              <tr>
                <td>${new Date(item.date).toLocaleDateString("en-PH")}</td>
                <td>${item.description}</td>
                <td>${item.category?.name || "N/A"}</td>
                <td>${item.vendor || "-"}</td>
                <td class="text-right negative">${formatCurrency(item.amount)}</td>
                <td>${item.paymentMethod}</td>
                <td>${item.status}</td>
              </tr>
            `
                  )
                  .join("")}
          </tbody>
          <tfoot>
            <tr style="background: #f5f5f5; font-weight: bold;">
              <td colspan="4" class="text-right">Total Expenses:</td>
              <td class="text-right negative">${formatCurrency(totalExpenses)}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  };

  const generateSavingsAnalysisPrint = () => {
    const sortedSavings = [...reportData.savings].sort(
      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const deposits = sortedSavings.filter((s: any) => s.type === "Deposit");
    const withdrawals = sortedSavings.filter((s: any) => s.type === "Withdrawal");

    return `
      <div class="summary-cards" style="grid-template-columns: repeat(4, 1fr);">
        <div class="summary-card">
          <div class="summary-card-title">Total Deposits</div>
          <div class="summary-card-value positive">${formatCurrency(savingsData.totalDeposits)}</div>
          <div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">
            ${deposits.length} deposits
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Total Withdrawals</div>
          <div class="summary-card-value negative">${formatCurrency(savingsData.totalWithdrawals)}</div>
          <div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">
            ${withdrawals.length} withdrawals
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Net Savings</div>
          <div class="summary-card-value ${savingsData.netSavings >= 0 ? "positive" : "negative"}">${formatCurrency(savingsData.netSavings)}</div>
          <div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">
            Deposits - Withdrawals
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-card-title">Total Transactions</div>
          <div class="summary-card-value">${sortedSavings.length}</div>
          <div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">
            All records
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Savings by Category</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th class="text-right">Deposits</th>
              <th class="text-right">Withdrawals</th>
              <th class="text-right">Net Savings</th>
              <th class="text-right">Deposit Count</th>
              <th class="text-right">Withdrawal Count</th>
            </tr>
          </thead>
          <tbody>
            ${savingsData.byCategory.length === 0
              ? '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #666;">No savings data available</td></tr>'
              : savingsData.byCategory
                  .map((item) => {
                    const categoryDeposits = deposits.filter((d: any) => (d.category || "Uncategorized") === item.name).length;
                    const categoryWithdrawals = withdrawals.filter((w: any) => (w.category || "Uncategorized") === item.name).length;
                    return `
                <tr>
                  <td>${item.name}</td>
                  <td class="text-right positive">${formatCurrency(item.deposits)}</td>
                  <td class="text-right negative">${formatCurrency(item.withdrawals)}</td>
                  <td class="text-right ${item.net >= 0 ? "positive" : "negative"}">${formatCurrency(item.net)}</td>
                  <td class="text-right">${categoryDeposits}</td>
                  <td class="text-right">${categoryWithdrawals}</td>
                </tr>
              `;
                  })
                  .join("")}
          </tbody>
          <tfoot>
            <tr style="background: #f5f5f5; font-weight: bold;">
              <td class="text-right">Total:</td>
              <td class="text-right positive">${formatCurrency(savingsData.totalDeposits)}</td>
              <td class="text-right negative">${formatCurrency(savingsData.totalWithdrawals)}</td>
              <td class="text-right ${savingsData.netSavings >= 0 ? "positive" : "negative"}">${formatCurrency(savingsData.netSavings)}</td>
              <td class="text-right">${deposits.length}</td>
              <td class="text-right">${withdrawals.length}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div class="section">
        <div class="section-title">All Savings Transactions</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th>Category</th>
              <th class="text-right">Amount</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${sortedSavings.length === 0
              ? '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #666;">No savings data available</td></tr>'
              : sortedSavings
                  .map(
                    (item: any) => `
              <tr>
                <td>${new Date(item.date).toLocaleDateString("en-PH")}</td>
                <td>${item.description}</td>
                <td><span style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: ${item.type === "Deposit" ? "#dcfce7" : "#fee2e2"}; color: ${item.type === "Deposit" ? "#16a34a" : "#dc2626"};">${item.type}</span></td>
                <td>${item.category || "Uncategorized"}</td>
                <td class="text-right ${item.type === "Deposit" ? "positive" : "negative"}">${item.type === "Deposit" ? "+" : "-"}${formatCurrency(item.amount)}</td>
                <td>${item.notes || "-"}</td>
              </tr>
            `
                  )
                  .join("")}
          </tbody>
          <tfoot>
            <tr style="background: #f5f5f5; font-weight: bold;">
              <td colspan="4" class="text-right">Net Savings:</td>
              <td class="text-right ${savingsData.netSavings >= 0 ? "positive" : "negative"}">${formatCurrency(savingsData.netSavings)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Loading text="Loading reports..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Comprehensive financial analysis and insights</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={reportType === "financial" ? "default" : "outline"}
          onClick={() => setReportType("financial")}
        >
          <FileText className="h-4 w-4" />
          Financial Summary
        </Button>
        <Button
          variant={reportType === "income" ? "default" : "outline"}
          onClick={() => setReportType("income")}
        >
          <TrendingUp className="h-4 w-4" />
          Income Analysis
        </Button>
        <Button
          variant={reportType === "expenses" ? "default" : "outline"}
          onClick={() => setReportType("expenses")}
        >
          <TrendingDown className="h-4 w-4" />
          Expense Analysis
        </Button>
        <Button
          variant={reportType === "savings" ? "default" : "outline"}
          onClick={() => setReportType("savings")}
        >
          <PiggyBank className="h-4 w-4" />
          Savings Analysis
        </Button>
      </div>

      {/* Financial Summary Report */}
      {reportType === "financial" && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.revenues.filter((r: any) => r.status === "Received").length} transactions
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
                  {reportData.expenses.filter((e: any) => e.status === "Paid").length} transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(netProfit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {profitMargin.toFixed(1)}% profit margin
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.revenues.length + reportData.expenses.length}
                </div>
                <p className="text-xs text-muted-foreground">All records</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Income Statement</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No data available for the selected period</div>
              ) : (
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={400}>
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
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Income Analysis */}
      {reportType === "income" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByCategory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No revenue data available</div>
              ) : (
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={revenueByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {revenueByCategory.map((entry, index) => (
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
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Revenue Sources</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueByCategory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No data available</div>
                ) : (
                  <div className="space-y-4">
                    {revenueByCategory.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span>{item.name}</span>
                        </div>
                        <div className="font-semibold">{formatCurrency(item.value)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No data available</div>
                ) : (
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                  <div className="font-medium">{formatCurrency(payload[0].value as number)}</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(142, 76%, 36%)"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Expense Analysis */}
      {reportType === "expenses" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No expense data available</div>
              ) : (
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
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
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Expense Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {expensesByCategory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No data available</div>
                ) : (
                  <div className="space-y-4">
                    {expensesByCategory.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span>{item.name}</span>
                        </div>
                        <div className="font-semibold">{formatCurrency(item.value)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expense Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No data available</div>
                ) : (
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                  <div className="font-medium">{formatCurrency(payload[0].value as number)}</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          stroke="hsl(0, 84%, 60%)"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Savings Analysis */}
      {reportType === "savings" && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(savingsData.totalDeposits)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData.savings.filter((s: any) => s.type === "Deposit").length} deposits
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(savingsData.totalWithdrawals)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData.savings.filter((s: any) => s.type === "Withdrawal").length} withdrawals
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${savingsData.netSavings >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(savingsData.netSavings)}
                </div>
                <p className="text-xs text-muted-foreground">Deposits - Withdrawals</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Savings by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {savingsData.byCategory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No savings data available</div>
              ) : (
                <div className="space-y-4">
                  {savingsData.byCategory.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Deposits: {formatCurrency(item.deposits)} • Withdrawals: {formatCurrency(item.withdrawals)}
                        </div>
                      </div>
                      <div className={`font-semibold ${item.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(item.net)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
