/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { ColumnActions } from "@/components/data-table-column-actions";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, CreditCard, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { detectPaymentProvider, formatCardNumber } from "@/lib/payment-detector";
import { Loading } from "@/components/ui/loading";

interface PaymentMethod {
  id: string;
  type: string;
  accountNumber: string;
  accountName: string;
  cvc: string | null;
  expiryDate: string | null;
  isDefault: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BillingPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/payment-methods");
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data);
      } else {
        toast.error("Failed to fetch payment methods");
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Failed to fetch payment methods");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paymentMethod: PaymentMethod) => {
    try {
      const response = await fetch(`/api/payment-methods/${paymentMethod.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Payment method deleted successfully");
        fetchPaymentMethods();
      } else {
        toast.error("Failed to delete payment method");
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error("Failed to delete payment method");
    }
  };

  const handleEdit = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setIsDialogOpen(true);
  };

  const handleSave = async (formData: any) => {
    try {
      const url = editingPaymentMethod
        ? `/api/payment-methods/${editingPaymentMethod.id}`
        : "/api/payment-methods";
      const method = editingPaymentMethod ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingPaymentMethod
            ? "Payment method updated successfully"
            : "Payment method created successfully"
        );
        setIsDialogOpen(false);
        setEditingPaymentMethod(null);
        fetchPaymentMethods();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save payment method");
      }
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast.error("Failed to save payment method");
    }
  };

  const creditCardCount = paymentMethods.filter((pm) => pm.type === "Credit Card").length;
  const eWalletCount = paymentMethods.filter((pm) =>
    ["GCash", "PayPal", "Maya", "GrabPay"].includes(pm.type)
  ).length;

  const columns: ColumnDef<PaymentMethod>[] = [
    {
      accessorKey: "isDefault",
      header: "Default",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.getValue("isDefault") as boolean && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Default
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("type")}</Badge>
      ),
    },
    {
      accessorKey: "accountName",
      header: "Account Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("accountName")}</div>,
    },
    {
      accessorKey: "accountNumber",
      header: "Account Number",
      cell: ({ row }) => {
        const accountNumber = row.getValue("accountNumber") as string;
        // Mask account number for security (show last 4 digits)
        const masked = accountNumber.length > 4
          ? "****" + accountNumber.slice(-4)
          : "****";
        return <div className="text-muted-foreground font-mono">{masked}</div>;
      },
    },
    {
      accessorKey: "expiryDate",
      header: "Expiry Date",
      cell: ({ row }) => {
        const date = row.getValue("expiryDate") as string | null;
        return (
          <div className="text-sm">
            {date ? format(new Date(date), "MM/yyyy") : "-"}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <ColumnActions
          row={row.original}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deleteTitle="Delete Payment Method?"
          deleteDescription="This will permanently delete this payment method. You won't be able to use it for future transactions."
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
            <CardTitle className="text-sm font-medium">Total Payment Methods</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentMethods.length}</div>
            <p className="text-xs text-muted-foreground">All payment methods</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{creditCardCount}</div>
            <p className="text-xs text-muted-foreground">Card payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">E-Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{eWalletCount}</div>
            <p className="text-xs text-muted-foreground">Digital wallets</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <CardTitle>Payment Methods</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingPaymentMethod(null)}>
                  <Plus className="h-4 w-4" />
                  Add Payment Method
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingPaymentMethod ? "Edit Payment Method" : "Add New Payment Method"}
                  </DialogTitle>
                </DialogHeader>
                <PaymentMethodForm
                  paymentMethod={editingPaymentMethod}
                  onClose={() => {
                    setIsDialogOpen(false);
                    setEditingPaymentMethod(null);
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
              data={paymentMethods}
              searchKey="accountName"
              searchPlaceholder="Search payment methods..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentMethodForm({
  paymentMethod,
  onClose,
  onSave,
}: {
  paymentMethod: PaymentMethod | null;
  onClose: () => void;
  onSave: (formData: any) => void;
}) {
  const [formData, setFormData] = useState({
    type: paymentMethod?.type || "Credit Card",
    accountNumber: paymentMethod?.accountNumber || "",
    accountName: paymentMethod?.accountName || "",
    cvc: paymentMethod?.cvc || "",
    expiryDate: paymentMethod?.expiryDate
      ? new Date(paymentMethod.expiryDate).toISOString().slice(0, 7)
      : "",
    isDefault: paymentMethod?.isDefault || false,
    notes: paymentMethod?.notes || "",
  });
  const [detectedProvider, setDetectedProvider] = useState<string | null>(null);
  const [showProviderSuggestion, setShowProviderSuggestion] = useState(false);

  const isCreditCard = formData.type === "Credit Card";
  const paymentTypes = [
    "Credit Card",
    "GCash",
    "PayPal",
    "Maya",
    "GrabPay",
    "Bank Account",
    "Cash",
    "Other",
  ];

  // Detect provider when account number changes
  useEffect(() => {
    if (!paymentMethod && formData.accountNumber.length >= 4) {
      const detection = detectPaymentProvider(formData.accountNumber, formData.type);
      if (detection) {
        // Show suggestion if detected type is different from current type
        if (detection.type !== formData.type) {
          setDetectedProvider(detection.provider);
          setShowProviderSuggestion(true);
        } else if (detection.provider !== "Unknown" && detection.provider !== formData.type) {
          // Show provider name even if type matches (e.g., Visa, Mastercard)
          setDetectedProvider(detection.provider);
          setShowProviderSuggestion(false);
        } else {
          setDetectedProvider(null);
          setShowProviderSuggestion(false);
        }
      } else {
        setDetectedProvider(null);
        setShowProviderSuggestion(false);
      }
    } else {
      setDetectedProvider(null);
      setShowProviderSuggestion(false);
    }
  }, [formData.accountNumber, formData.type, paymentMethod]);

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Format credit card numbers with spaces
    if (formData.type === "Credit Card" || formData.type === "Other") {
      value = formatCardNumber(value);
    }

    setFormData({ ...formData, accountNumber: value });
  };

  const acceptProviderSuggestion = () => {
    if (detectedProvider) {
      const detection = detectPaymentProvider(formData.accountNumber, formData.type);
      if (detection) {
        setFormData({ ...formData, type: detection.type });
        setShowProviderSuggestion(false);
        setDetectedProvider(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      cvc: isCreditCard ? formData.cvc : null,
      expiryDate: isCreditCard && formData.expiryDate ? formData.expiryDate + "-01" : null,
      notes: formData.notes || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Payment Method Type *</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {paymentTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="accountName">Account Name *</Label>
        <Input
          id="accountName"
          value={formData.accountName}
          onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
          required
          placeholder="John Doe"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="accountNumber">Account Number *</Label>
        <div className="space-y-2">
          <Input
            id="accountNumber"
            value={formData.accountNumber}
            onChange={handleAccountNumberChange}
            required
            placeholder={isCreditCard ? "1234 5678 9012 3456" : "09XX XXX XXXX"}
            maxLength={isCreditCard ? 19 : 20}
          />
          {showProviderSuggestion && detectedProvider && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex-1 text-sm text-blue-800">
                <strong>Detected:</strong> {detectedProvider}
                {formData.type === "Credit Card" ? (
                  <span className="ml-1">(suggested provider)</span>
                ) : (
                  <span className="ml-1">(suggested type: {detectedProvider})</span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={acceptProviderSuggestion}
                className="h-7 text-xs"
              >
                Use {detectedProvider}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowProviderSuggestion(false)}
                className="h-7 w-7 p-0"
              >
                ×
              </Button>
            </div>
          )}
          {formData.type === "Credit Card" && formData.accountNumber.replace(/\D/g, "").length >= 4 && (
            <div className="text-xs text-muted-foreground">
              {detectedProvider && detectedProvider !== "Unknown" ? (
                <span className="text-blue-600 font-medium">✓ Detected: {detectedProvider}</span>
              ) : formData.accountNumber.replace(/\D/g, "").length >= 13 ? (
                <span className="text-amber-600">Card number detected, but provider unknown</span>
              ) : (
                <span>Enter more digits to detect card type</span>
              )}
            </div>
          )}
        </div>
      </div>
      {isCreditCard && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                type="text"
                value={formData.cvc}
                onChange={(e) => setFormData({ ...formData, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                placeholder="123"
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="month"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>
        </>
      )}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about this payment method..."
          rows={3}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
          Set as default payment method
        </Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save Payment Method</Button>
      </div>
    </form>
  );
}

