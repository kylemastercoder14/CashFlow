/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { DataTable } from "@/components/ui/data-table";
import { ColumnActions } from "@/components/data-table-column-actions";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Edit, Trash2, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";

interface Budget {
  id: string;
  name: string;
  category: string;
  allocated: number;
  spent: number;
  period: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/budget");
      if (response.ok) {
        const data = await response.json();
        setBudgets(data);
      } else {
        toast.error("Failed to fetch budgets");
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
      toast.error("Failed to fetch budgets");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (budget: Budget) => {
    try {
      const response = await fetch(`/api/budget/${budget.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Budget deleted successfully");
        fetchBudgets();
      } else {
        toast.error("Failed to delete budget");
      }
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast.error("Failed to delete budget");
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsDialogOpen(true);
  };

  const handleSave = async (formData: any) => {
    try {
      const url = editingBudget ? `/api/budget/${editingBudget.id}` : "/api/budget";
      const method = editingBudget ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingBudget ? "Budget updated successfully" : "Budget created successfully");
        setIsDialogOpen(false);
        setEditingBudget(null);
        fetchBudgets();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save budget");
      }
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Failed to save budget");
    }
  };

  const totalAllocated = budgets.reduce((sum, budget) => sum + budget.allocated, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const remaining = totalAllocated - totalSpent;
  const averageMonthly = budgets.length > 0 ? remaining / budgets.length : 0;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "On Track": "bg-green-100 text-green-800",
      "Warning": "bg-yellow-100 text-yellow-800",
      "Over Budget": "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Separate column definitions
  const columns: ColumnDef<Budget>[] = [
    {
      accessorKey: "name",
      header: "Budget Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <Badge variant="outline">{row.getValue("category")}</Badge>,
    },
    {
      accessorKey: "period",
      header: "Period",
      cell: ({ row }) => <div>{row.getValue("period")}</div>,
    },
    {
      accessorKey: "allocated",
      header: "Allocated",
      cell: ({ row }) => {
        const amount = row.getValue("allocated") as number;
        return <div className="font-semibold">{formatCurrency(amount)}</div>;
      },
    },
    {
      accessorKey: "spent",
      header: "Spent",
      cell: ({ row }) => {
        const amount = row.getValue("spent") as number;
        return <div className="font-semibold">{formatCurrency(amount)}</div>;
      },
    },
    {
      accessorKey: "remaining",
      header: "Remaining",
      cell: ({ row }) => {
        const budget = row.original;
        const remaining = budget.allocated - budget.spent;
        return (
          <div className={`font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(remaining)}
          </div>
        );
      },
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const budget = row.original;
        const percentage = (budget.spent / budget.allocated) * 100;
        return (
          <div className="flex items-center gap-2 w-32">
            <Progress value={percentage} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground w-12 text-right">
              {percentage.toFixed(0)}%
            </span>
          </div>
        );
      },
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
          deleteTitle="Delete Budget?"
          deleteDescription="This will permanently delete this budget record. This action cannot be undone."
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAllocated)}</div>
            <p className="text-xs text-muted-foreground">Allocated amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              {totalAllocated > 0 ? `${((totalSpent / totalAllocated) * 100).toFixed(1)}%` : "0%"} of budget
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(remaining)}
            </div>
            <p className="text-xs text-muted-foreground">Available balance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgets.length}</div>
            <p className="text-xs text-muted-foreground">Budget categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Budget Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Budget Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Budget: {formatCurrency(totalAllocated)}</span>
              <span>Spent: {formatCurrency(totalSpent)} ({totalAllocated > 0 ? (totalSpent / totalAllocated * 100).toFixed(1) : 0}%)</span>
            </div>
            <Progress
              value={totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0}
              className="h-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Remaining: {formatCurrency(remaining)}</span>
              <span>{totalAllocated > 0 ? ((remaining / totalAllocated) * 100).toFixed(1) : 0}% left</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <CardTitle>Budget Categories</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingBudget(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Budget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBudget ? "Edit Budget" : "Create New Budget"}</DialogTitle>
                </DialogHeader>
                <BudgetForm
                  budget={editingBudget}
                  onClose={() => {
                    setIsDialogOpen(false);
                    setEditingBudget(null);
                  }}
                  onSave={handleSave}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loading />
          ) : (
            <DataTable
              columns={columns}
              data={budgets}
              searchKey="name"
              searchPlaceholder="Search budgets..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BudgetForm({
  budget,
  onClose,
  onSave,
}: {
  budget: Budget | null;
  onClose: () => void;
  onSave: (budget: any) => void;
}) {
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    allocated: string;
    spent: string;
    period: string;
  }>({
    name: budget?.name || "",
    category: budget?.category || "",
    allocated: budget?.allocated?.toString() || "",
    spent: budget?.spent?.toString() || "0",
    period: budget?.period || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      category: formData.category,
      allocated: parseFloat(formData.allocated),
      spent: parseFloat(formData.spent) || 0,
      period: formData.period,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Budget Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="e.g., Marketing Budget Q1 2024"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
            placeholder="e.g., Marketing, Office, Travel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="period">Period *</Label>
          <Input
            id="period"
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            required
            placeholder="e.g., 2024 Q1, Jan 2024"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="allocated">Allocated Amount (₱) *</Label>
          <Input
            id="allocated"
            type="number"
            step="0.01"
            value={formData.allocated}
            onChange={(e) => setFormData({ ...formData, allocated: e.target.value })}
            required
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="spent">Spent Amount (₱)</Label>
          <Input
            id="spent"
            type="number"
            step="0.01"
            value={formData.spent}
            onChange={(e) => setFormData({ ...formData, spent: e.target.value })}
            placeholder="0.00"
          />
          <p className="text-xs text-muted-foreground">Leave as 0 if starting fresh</p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save Budget</Button>
      </div>
    </form>
  );
}
