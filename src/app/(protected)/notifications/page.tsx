/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
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
import { Plus, Bell, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loading } from "@/components/ui/loading";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  reminderDate: string | null;
  relatedId: string | null;
  relatedType: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [filterRead, setFilterRead] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [filterType, filterRead]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== "all") {
        params.append("type", filterType);
      }
      if (filterRead !== "all") {
        params.append("isRead", filterRead);
      }
      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        toast.error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notification: Notification) => {
    try {
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Notification deleted successfully");
        fetchNotifications();
      } else {
        toast.error("Failed to delete notification");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setIsDialogOpen(true);
  };

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      if (response.ok) {
        toast.success("Notification marked as read");
        fetchNotifications();
      } else {
        toast.error("Failed to update notification");
      }
    } catch (error) {
      console.error("Error updating notification:", error);
      toast.error("Failed to update notification");
    }
  };

  const handleSave = async (formData: any) => {
    try {
      const url = editingNotification ? `/api/notifications/${editingNotification.id}` : "/api/notifications";
      const method = editingNotification ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingNotification ? "Notification updated successfully" : "Notification created successfully");
        setIsDialogOpen(false);
        setEditingNotification(null);
        fetchNotifications();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save notification");
      }
    } catch (error) {
      console.error("Error saving notification:", error);
      toast.error("Failed to save notification");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;

  const columns: ColumnDef<Notification>[] = [
    {
      accessorKey: "isRead",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.getValue("isRead") ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Circle className="h-4 w-4 text-blue-600" />
          )}
          <span className="text-sm">{row.getValue("isRead") ? "Read" : "Unread"}</span>
        </div>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => (
        <div className="text-muted-foreground max-w-md truncate">{row.getValue("message")}</div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        const typeColors: Record<string, string> = {
          "Invoice Due": "bg-red-100 text-red-800",
          "Budget Warning": "bg-yellow-100 text-yellow-800",
          "Payment Reminder": "bg-blue-100 text-blue-800",
          "Recurring Expense": "bg-purple-100 text-purple-800",
          "Custom": "bg-gray-100 text-gray-800",
        };
        return (
          <Badge className={typeColors[type] || "bg-gray-100 text-gray-800"}>{type}</Badge>
        );
      },
    },
    {
      accessorKey: "reminderDate",
      header: "Reminder Date",
      cell: ({ row }) => {
        const date = row.getValue("reminderDate") as string | null;
        return (
          <div className="text-sm">
            {date ? format(new Date(date), "MMM dd, yyyy HH:mm") : "-"}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {!row.original.isRead && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarkAsRead(row.original)}
            >
              Mark Read
            </Button>
          )}
          <ColumnActions
            row={row.original}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deleteTitle="Delete Notification?"
            deleteDescription="This will permanently delete this notification."
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">All notifications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{readCount}</div>
            <p className="text-xs text-muted-foreground">Already viewed</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <CardTitle>Notifications</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterRead} onValueChange={setFilterRead}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="false">Unread</SelectItem>
                  <SelectItem value="true">Read</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Invoice Due">Invoice Due</SelectItem>
                  <SelectItem value="Budget Warning">Budget Warning</SelectItem>
                  <SelectItem value="Payment Reminder">Payment Reminder</SelectItem>
                  <SelectItem value="Recurring Expense">Recurring Expense</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingNotification(null)}>
                    <Plus className="h-4 w-4" />
                    Add Notification
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingNotification ? "Edit Notification" : "Create New Notification"}</DialogTitle>
                  </DialogHeader>
                  <NotificationForm
                    notification={editingNotification}
                    onClose={() => {
                      setIsDialogOpen(false);
                      setEditingNotification(null);
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
            <DataTable columns={columns} data={notifications} searchKey="title" searchPlaceholder="Search notifications..." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationForm({
  notification,
  onClose,
  onSave,
}: {
  notification: Notification | null;
  onClose: () => void;
  onSave: (formData: any) => void;
}) {
  const [formData, setFormData] = useState({
    title: notification?.title || "",
    message: notification?.message || "",
    type: notification?.type || "Custom",
    reminderDate: notification?.reminderDate ? new Date(notification.reminderDate).toISOString().slice(0, 16) : "",
    relatedId: notification?.relatedId || "",
    relatedType: notification?.relatedType || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      reminderDate: formData.reminderDate || null,
      relatedId: formData.relatedId || null,
      relatedType: formData.relatedType || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          required
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Invoice Due">Invoice Due</SelectItem>
            <SelectItem value="Budget Warning">Budget Warning</SelectItem>
            <SelectItem value="Payment Reminder">Payment Reminder</SelectItem>
            <SelectItem value="Recurring Expense">Recurring Expense</SelectItem>
            <SelectItem value="Custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reminderDate">Reminder Date & Time</Label>
        <Input
          id="reminderDate"
          type="datetime-local"
          value={formData.reminderDate}
          onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="relatedType">Related Type</Label>
          <Select
            value={formData.relatedType}
            onValueChange={(value) => setFormData({ ...formData, relatedType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Invoice">Invoice</SelectItem>
              <SelectItem value="Expense">Expense</SelectItem>
              <SelectItem value="Budget">Budget</SelectItem>
              <SelectItem value="Revenue">Revenue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="relatedId">Related ID</Label>
          <Input
            id="relatedId"
            value={formData.relatedId}
            onChange={(e) => setFormData({ ...formData, relatedId: e.target.value })}
            placeholder="Optional"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save Notification</Button>
      </div>
    </form>
  );
}

