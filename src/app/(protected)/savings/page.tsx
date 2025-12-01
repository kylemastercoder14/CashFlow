/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
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
import { Plus, Download, PiggyBank, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";

interface Savings {
  id: string;
  description: string;
  type: string;
  amount: number;
  date: string;
  category: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SavingsPage() {
  const [savings, setSavings] = useState<Savings[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSavings, setEditingSavings] = useState<Savings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavings();
  }, [filterType]);

  const fetchSavings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== "all") {
        params.append("type", filterType);
      }
      const response = await fetch(`/api/savings?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSavings(data);
      } else {
        toast.error("Failed to fetch savings");
      }
    } catch (error) {
      console.error("Error fetching savings:", error);
      toast.error("Failed to fetch savings");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (savingsRecord: Savings) => {
    try {
      const response = await fetch(`/api/savings/${savingsRecord.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Savings record deleted successfully");
        fetchSavings();
      } else {
        toast.error("Failed to delete savings record");
      }
    } catch (error) {
      console.error("Error deleting savings record:", error);
      toast.error("Failed to delete savings record");
    }
  };

  const handleEdit = (savingsRecord: Savings) => {
    setEditingSavings(savingsRecord);
    setIsDialogOpen(true);
  };

  const handleSave = async (formData: any) => {
    try {
      const url = editingSavings ? `/api/savings/${editingSavings.id}` : "/api/savings";
      const method = editingSavings ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingSavings ? "Savings record updated successfully" : "Savings record created successfully");
        setIsDialogOpen(false);
        setEditingSavings(null);
        fetchSavings();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save savings record");
      }
    } catch (error) {
      console.error("Error saving savings record:", error);
      toast.error("Failed to save savings record");
    }
  };

  // Calculate totals
  const totalDeposits = savings
    .filter((s) => s.type === "Deposit")
    .reduce((sum, s) => sum + s.amount, 0);
  const totalWithdrawals = savings
    .filter((s) => s.type === "Withdrawal")
    .reduce((sum, s) => sum + s.amount, 0);
  const netSavings = totalDeposits - totalWithdrawals;

  const getTypeColor = (type: string) => {
    return type === "Deposit" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  // Separate column definitions
  const columns: ColumnDef<Savings>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return <div>{date.toLocaleDateString("en-PH")}</div>;
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div className="font-medium">{row.getValue("description")}</div>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return <Badge className={getTypeColor(type)}>{type}</Badge>;
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.getValue("category") as string | null;
        return category ? <Badge variant="outline">{category}</Badge> : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const savingsRecord = row.original;
        const amount = row.getValue("amount") as number;
        const colorClass = savingsRecord.type === "Deposit" ? "text-green-600" : "text-red-600";
        const prefix = savingsRecord.type === "Deposit" ? "+" : "-";
        return (
          <div className={`font-semibold ${colorClass}`}>
            {prefix}{formatCurrency(amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const notes = row.getValue("notes") as string | null;
        return <div className="text-sm text-muted-foreground">{notes || "-"}</div>;
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
          deleteTitle="Delete Savings Record?"
          deleteDescription="This will permanently delete this savings record. This action cannot be undone."
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
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalDeposits)}</div>
            <p className="text-xs text-muted-foreground">All deposits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalWithdrawals)}</div>
            <p className="text-xs text-muted-foreground">All withdrawals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netSavings)}
            </div>
            <p className="text-xs text-muted-foreground">Deposits - Withdrawals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savings.length}</div>
            <p className="text-xs text-muted-foreground">All transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <CardTitle>Savings</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Deposit">Deposits</SelectItem>
                  <SelectItem value="Withdrawal">Withdrawals</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingSavings(null)}>
                    <Plus className="h-4 w-4" />
                    Add Record
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingSavings ? "Edit Savings Record" : "Add New Savings Record"}</DialogTitle>
                  </DialogHeader>
                  <SavingsForm
                    savings={editingSavings}
                    onClose={() => {
                      setIsDialogOpen(false);
                      setEditingSavings(null);
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
            <DataTable
              columns={columns}
              data={savings}
              searchKey="description"
              searchPlaceholder="Search savings records..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SavingsForm({
  savings,
  onClose,
  onSave,
}: {
  savings: Savings | null;
  onClose: () => void;
  onSave: (savings: any) => void;
}) {
  const [formData, setFormData] = useState<{
    description: string;
    type: string;
    amount: string;
    date: string;
    category: string;
    notes: string;
  }>({
    description: savings?.description || "",
    type: savings?.type || "Deposit",
    amount: savings?.amount?.toString() || "",
    date: savings?.date ? new Date(savings.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    category: savings?.category || "",
    notes: savings?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount),
      category: formData.category || null,
      notes: formData.notes || null,
    });
  };

  const categories = [
    "Emergency Fund",
    "Vacation",
    "Investment",
    "House Fund",
    "Education",
    "Retirement",
    "Other",
  ];

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
            placeholder="e.g., Monthly savings deposit"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Deposit">Deposit</SelectItem>
              <SelectItem value="Withdrawal">Withdrawal</SelectItem>
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
            placeholder="0.00"
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

      <div className="space-y-2">
        <Label htmlFor="category">Category (Optional)</Label>
        <Select
          value={formData.category || "none"}
          onValueChange={(value) => setFormData({ ...formData, category: value === "none" ? "" : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
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
          placeholder="Additional notes about this savings record..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save Record</Button>
      </div>
    </form>
  );
}

