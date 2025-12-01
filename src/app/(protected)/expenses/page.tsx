/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/ui/data-table";
import { ColumnActions } from "@/components/data-table-column-actions";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Printer, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Expense {
  id: string;
  description: string;
  categoryId: string;
  category: Category;
  amount: number;
  date: string;
  paymentMethod: string;
  status: string;
  vendor: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [filterCategory, startDate, endDate]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories?type=Expense");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory !== "all") {
        params.append("categoryId", filterCategory);
      }
      const response = await fetch(`/api/expenses?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      } else {
        toast.error("Failed to fetch expenses");
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expense: Expense) => {
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Expense deleted successfully");
        fetchExpenses();
      } else {
        toast.error("Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleSave = async (formData: any) => {
    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses";
      const method = editingExpense ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingExpense ? "Expense updated successfully" : "Expense created successfully");
        setIsDialogOpen(false);
        setEditingExpense(null);
        fetchExpenses();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save expense");
      }
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense");
    }
  };

  // Filter and sort expenses
  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter((e) => new Date(e.date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((e) => new Date(e.date) <= end);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "status") {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [expenses, startDate, endDate, sortBy, sortOrder]);

  const totalExpenses = filteredAndSortedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paidExpenses = filteredAndSortedExpenses.filter((e) => e.status === "Paid").reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpenses = filteredAndSortedExpenses.filter((e) => e.status === "Pending").reduce((sum, expense) => sum + expense.amount, 0);

  const getStatusColor = (status: string) => {
    return status === "Paid" ? "bg-green-100 text-green-800" : status === "Cancelled" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800";
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print expenses");
      return;
    }

    const dateRangeText = startDate && endDate
      ? `${new Date(startDate).toLocaleDateString("en-PH")} - ${new Date(endDate).toLocaleDateString("en-PH")}`
      : startDate
      ? `From ${new Date(startDate).toLocaleDateString("en-PH")}`
      : endDate
      ? `Until ${new Date(endDate).toLocaleDateString("en-PH")}`
      : "All Time";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Expenses Report</title>
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
              max-width: 1200px;
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
              grid-template-columns: repeat(3, 1fr);
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
            th.text-right {
              text-align: right;
            }
            tbody tr {
              border-bottom: 1px solid #ddd;
            }
            td {
              padding: 0.75rem 1rem;
            }
            td.text-right {
              text-align: right;
            }
            .status-paid {
              color: #16a34a;
              font-weight: 600;
            }
            .status-pending {
              color: #ca8a04;
              font-weight: 600;
            }
            .status-cancelled {
              color: #dc2626;
              font-weight: 600;
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
              <h1>Expenses Report</h1>
              <div class="header-info">
                <span>Period: ${dateRangeText}</span>
                <span>Generated: ${new Date().toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</span>
              </div>
            </div>
            <div class="summary-cards">
              <div class="summary-card">
                <div class="summary-card-title">Total Expenses</div>
                <div class="summary-card-value">${formatCurrency(totalExpenses)}</div>
              </div>
              <div class="summary-card">
                <div class="summary-card-title">Paid</div>
                <div class="summary-card-value" style="color: #16a34a;">${formatCurrency(paidExpenses)}</div>
              </div>
              <div class="summary-card">
                <div class="summary-card-title">Pending</div>
                <div class="summary-card-value" style="color: #ca8a04;">${formatCurrency(pendingExpenses)}</div>
              </div>
            </div>
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
                ${filteredAndSortedExpenses.length === 0
                  ? '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #666;">No expenses found</td></tr>'
                  : filteredAndSortedExpenses
                      .map(
                        (expense) => `
                  <tr>
                    <td>${new Date(expense.date).toLocaleDateString("en-PH")}</td>
                    <td>${expense.description}</td>
                    <td>${expense.category?.name || "N/A"}</td>
                    <td>${expense.vendor || "-"}</td>
                    <td class="text-right">${formatCurrency(expense.amount)}</td>
                    <td>${expense.paymentMethod}</td>
                    <td class="status-${expense.status.toLowerCase()}">${expense.status}</td>
                  </tr>
                `
                      )
                      .join("")}
              </tbody>
              <tfoot>
                <tr style="background: #f5f5f5; font-weight: bold;">
                  <td colspan="4" class="text-right">Total:</td>
                  <td class="text-right">${formatCurrency(totalExpenses)}</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
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

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div className="font-medium">{row.getValue("description")}</div>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.original.category;
        return <Badge variant="outline">{category.name}</Badge>;
      },
    },
    {
      accessorKey: "vendor",
      header: "Vendor",
      cell: ({ row }) => <div>{row.getValue("vendor") || "-"}</div>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        return <div className="font-semibold">{formatCurrency(amount)}</div>;
      },
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      cell: ({ row }) => <div>{row.getValue("paymentMethod")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <Badge className={getStatusColor(status)}>{status}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <ColumnActions
          row={row.original}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deleteTitle="Delete Expense?"
          deleteDescription="This will permanently delete this expense record. This action cannot be undone."
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">All time expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(paidExpenses)}</div>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingExpenses)}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <CardTitle>Expenses</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingExpense(null)}>
                    <Plus className="h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
                  </DialogHeader>
                  <ExpenseForm
                    expense={editingExpense}
                    categories={categories}
                    onClose={() => {
                      setIsDialogOpen(false);
                      setEditingExpense(null);
                    }}
                    onSave={handleSave}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loading />
          ) : (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <Label htmlFor="startDate" className="text-sm whitespace-nowrap">From:</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="endDate" className="text-sm whitespace-nowrap">To:</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="sortBy" className="text-sm whitespace-nowrap">Sort by:</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    {sortOrder === "asc" ? "Ascending" : "Descending"}
                  </Button>
                </div>
                {(startDate || endDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                  >
                    Clear Dates
                  </Button>
                )}
              </div>
              <DataTable
                columns={columns}
                data={filteredAndSortedExpenses}
                searchKey="description"
                searchPlaceholder="Search expenses..."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExpenseForm({
  expense,
  categories,
  onClose,
  onSave,
}: {
  expense: Expense | null;
  categories: Category[];
  onClose: () => void;
  onSave: (expense: any) => void;
}) {
  const [formData, setFormData] = useState({
    description: expense?.description || "",
    categoryId: expense?.categoryId || "",
    amount: expense?.amount || "",
    date: expense?.date ? new Date(expense.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    paymentMethod: expense?.paymentMethod || "",
    status: expense?.status || "Pending",
    vendor: expense?.vendor || "",
    notes: expense?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount as any),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category *</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₱) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor</Label>
          <Input
            id="vendor"
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method *</Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Gcash">Gcash</SelectItem>
              <SelectItem value="Credit Card">Credit Card</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Check">Check</SelectItem>
              <SelectItem value="PayPal">PayPal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save Expense</Button>
      </div>
    </form>
  );
}
