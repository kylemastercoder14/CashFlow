"use client";

import React from "react";
import { formatCurrency } from "@/lib/currency";

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

interface InvoicePrintProps {
  invoice: Invoice;
}

export function InvoicePrint({ invoice }: InvoicePrintProps) {
  return (
    <div className="p-8 max-w-4xl mx-auto bg-white" id="invoice-print">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">INVOICE</h1>
            <p className="text-muted-foreground">Invoice #{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Date Issued</p>
            <p className="font-medium">{new Date(invoice.date).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}</p>
          </div>
        </div>
      </div>

      {/* Company Info & Customer Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold mb-2 text-sm text-muted-foreground">FROM</h3>
          <p className="font-bold text-lg">CashFlow</p>
          <p className="text-sm text-muted-foreground">Financial Management System</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2 text-sm text-muted-foreground">BILL TO</h3>
          <p className="font-medium">{invoice.customer}</p>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Invoice Number</p>
            <p className="font-medium">{invoice.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 font-semibold">Description</th>
              <th className="text-center py-3 px-4 font-semibold">Quantity</th>
              <th className="text-right py-3 px-4 font-semibold">Price</th>
              <th className="text-right py-3 px-4 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id || index} className="border-b border-gray-200">
                <td className="py-3 px-4">{item.description}</td>
                <td className="text-center py-3 px-4">{item.quantity}</td>
                <td className="text-right py-3 px-4">{formatCurrency(item.price)}</td>
                <td className="text-right py-3 px-4 font-medium">
                  {formatCurrency(item.quantity * item.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.tax > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-muted-foreground">Tax:</span>
              <span className="font-medium">{formatCurrency(invoice.tax)}</span>
            </div>
          )}
          <div className="flex justify-between py-3 mt-2 border-t-2 border-gray-300">
            <span className="font-bold text-lg">Total:</span>
            <span className="font-bold text-lg">{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-sm text-muted-foreground">NOTES</h3>
          <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-muted-foreground">
        <p>Thank you for your business!</p>
        <p className="mt-2">This is a computer-generated invoice.</p>
      </div>
    </div>
  );
}

