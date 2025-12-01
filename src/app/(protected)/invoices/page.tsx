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
import { Plus, Download, FileText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  date: string;
  dueDate: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/invoices");
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        toast.error("Failed to fetch invoices");
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Invoice deleted successfully");
        fetchInvoices();
      } else {
        toast.error("Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsDialogOpen(true);
  };

  const handlePrint = (invoice: Invoice) => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print invoices");
      return;
    }

    // Write the print content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
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
            }
            .invoice-container {
              padding: 2rem;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              margin-bottom: 2rem;
            }
            .header h1 {
              font-size: 2rem;
              font-weight: bold;
              margin-bottom: 0.5rem;
            }
            .header p {
              color: #666;
            }
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 2rem;
              margin-bottom: 2rem;
            }
            .info-section h3 {
              font-size: 0.875rem;
              color: #666;
              margin-bottom: 0.5rem;
              font-weight: 600;
            }
            .info-section p {
              margin: 0.25rem 0;
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
            td {
              padding: 0.75rem 1rem;
            }
            td.text-center {
              text-align: center;
            }
            td.text-right {
              text-align: right;
            }
            .totals {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 1.5rem;
            }
            .totals-container {
              width: 250px;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 0.5rem 0;
              border-bottom: 1px solid #ddd;
            }
            .totals-row.total {
              border-top: 2px solid #333;
              border-bottom: none;
              padding-top: 0.75rem;
              margin-top: 0.5rem;
              font-weight: bold;
              font-size: 1.125rem;
            }
            .notes {
              margin-bottom: 1.5rem;
            }
            .notes h3 {
              font-size: 0.875rem;
              color: #666;
              margin-bottom: 0.5rem;
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
                margin: 0;
                padding: 0;
              }
              .invoice-container {
                padding: 0;
              }
              @page {
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                  <h1>INVOICE</h1>
                  <p>Invoice #${invoice.invoiceNumber}</p>
                </div>
                <div style="text-align: right;">
                  <p style="font-size: 0.875rem; color: #666;">Date Issued</p>
                  <p style="font-weight: 600;">${new Date(invoice.date).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}</p>
                </div>
              </div>
            </div>

            <div class="info-section">
              <div>
                <h3>FROM</h3>
                <p style="font-weight: bold; font-size: 1.125rem;">CashFlow</p>
                <p style="font-size: 0.875rem; color: #666;">Financial Management System</p>
              </div>
              <div>
                <h3>BILL TO</h3>
                <p style="font-weight: 600;">${invoice.customer}</p>
              </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <p style="font-size: 0.875rem; color: #666;">Invoice Number</p>
                  <p style="font-weight: 600;">${invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p style="font-size: 0.875rem; color: #666;">Due Date</p>
                  <p style="font-weight: 600;">${new Date(invoice.dueDate).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}</p>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-center">Quantity</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map((item) => `
                  <tr>
                    <td>${item.description}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${formatCurrency(item.price)}</td>
                    <td class="text-right" style="font-weight: 600;">${formatCurrency(item.quantity * item.price)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="totals">
              <div class="totals-container">
                <div class="totals-row">
                  <span style="color: #666;">Subtotal:</span>
                  <span style="font-weight: 600;">${formatCurrency(invoice.subtotal)}</span>
                </div>
                ${invoice.tax > 0 ? `
                  <div class="totals-row">
                    <span style="color: #666;">Tax:</span>
                    <span style="font-weight: 600;">${formatCurrency(invoice.tax)}</span>
                  </div>
                ` : ""}
                <div class="totals-row total">
                  <span>Total:</span>
                  <span>${formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            ${invoice.notes ? `
              <div class="notes">
                <h3>NOTES</h3>
                <p style="font-size: 0.875rem; white-space: pre-wrap;">${invoice.notes}</p>
              </div>
            ` : ""}

            <div class="footer">
              <p>Thank you for your business!</p>
              <p style="margin-top: 0.5rem;">This is a computer-generated invoice.</p>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // Close the window after printing (optional)
      // printWindow.close();
    }, 250);
  };

  const handleSave = async (formData: any) => {
    try {
      const url = editingInvoice ? `/api/invoices/${editingInvoice.id}` : "/api/invoices";
      const method = editingInvoice ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingInvoice ? "Invoice updated successfully" : "Invoice created successfully");
        setIsDialogOpen(false);
        setEditingInvoice(null);
        fetchInvoices();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save invoice");
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice");
    }
  };

  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidAmount = invoices.filter((i) => i.status === "Paid").reduce((sum, invoice) => sum + invoice.total, 0);
  const pendingAmount = invoices.filter((i) => i.status === "Pending").reduce((sum, invoice) => sum + invoice.total, 0);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Paid: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Overdue: "bg-red-100 text-red-800",
      Draft: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Separate column definitions
  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice ID",
      cell: ({ row }) => <div className="font-medium">{row.getValue("invoiceNumber")}</div>,
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => <div>{row.getValue("customer")}</div>,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("dueDate"));
        const today = new Date();
        const isOverdue = date < today && row.original.status !== "Paid";
        return (
          <div className={isOverdue ? "text-red-600 font-medium" : ""}>
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      accessorKey: "total",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.getValue("total") as number;
        return <div className="font-semibold">{formatCurrency(amount)}</div>;
      },
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        const items = row.original.items;
        return <div>{items?.length || 0}</div>;
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
          onPrint={handlePrint}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deleteTitle="Delete Invoice?"
          deleteDescription="This will permanently delete this invoice and all its items. This action cannot be undone."
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
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">All invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">All invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <CardTitle>Invoices</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingInvoice(null)}>
                    <Plus className="h-4 w-4" />
                    Create Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-4xl! max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingInvoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
                  </DialogHeader>
                  <InvoiceForm
                    invoice={editingInvoice}
                    onClose={() => {
                      setIsDialogOpen(false);
                      setEditingInvoice(null);
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
              data={invoices}
              searchKey="customer"
              searchPlaceholder="Search invoices by customer..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceForm({
  invoice,
  onClose,
  onSave,
}: {
  invoice: Invoice | null;
  onClose: () => void;
  onSave: (invoice: any) => void;
}) {
  const [formData, setFormData] = useState<{
    customer: string;
    date: string;
    dueDate: string;
    status: string;
    items: Array<{ description: string; quantity: number; price: number }>;
    notes: string;
    tax: string;
  }>({
    customer: invoice?.customer || "",
    date: invoice?.date ? new Date(invoice.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "",
    status: invoice?.status || "Draft",
    items: invoice?.items || [{ description: "", quantity: 1, price: 0 }],
    notes: invoice?.notes || "",
    tax: invoice?.tax?.toString() || "0",
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, price: 0 }],
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + (parseFloat(formData.tax) || 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      customer: formData.customer,
      date: formData.date,
      dueDate: formData.dueDate,
      status: formData.status,
      items: formData.items.map((item) => ({
        description: item.description,
        quantity: parseFloat(item.quantity as any) || 0,
        price: parseFloat(item.price as any) || 0,
      })),
      notes: formData.notes,
      tax: parseFloat(formData.tax as any) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer">Customer/Client *</Label>
          <Input
            id="customer"
            value={formData.customer}
            onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Invoice Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Invoice Items *</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
        <div className="space-y-2 border rounded-lg p-4">
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  required
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Price (₱)"
                  value={item.price}
                  onChange={(e) => updateItem(index, "price", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="col-span-1 text-sm font-medium text-right">
                {formatCurrency((item.quantity || 0) * (item.price || 0))}
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={formData.items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end space-x-4 pt-2">
          <div className="text-right space-y-1">
            <div className="text-sm text-muted-foreground">Subtotal:</div>
            <div className="text-sm text-muted-foreground">Tax:</div>
            <div className="text-lg font-bold">Total:</div>
          </div>
          <div className="text-right space-y-1 min-w-[120px]">
            <div className="text-sm">{formatCurrency(calculateSubtotal())}</div>
            <div className="text-sm">
              <Input
                type="number"
                step="0.01"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                className="w-24 h-8 text-sm"
                placeholder="0"
              />
            </div>
            <div className="text-lg font-bold">{formatCurrency(calculateTotal())}</div>
          </div>
        </div>
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
        <Button type="submit">Save Invoice</Button>
      </div>
    </form>
  );
}
