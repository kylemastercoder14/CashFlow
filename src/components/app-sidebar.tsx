"use client";

import * as React from "react";
import {
  IconDashboard,
  IconWallet,
  IconReceipt,
  IconTrendingUp,
  IconCash,
  IconFileInvoice,
  IconHistory,
  IconCoin,
  IconReport,
  IconCategory,
  IconPig,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { NavUser } from "./nav-user";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Expenses",
      url: "/expenses",
      icon: IconReceipt,
    },
    {
      title: "Revenue",
      url: "/revenue",
      icon: IconTrendingUp,
    },
    {
      title: "Cash Flow",
      url: "/cash-flow",
      icon: IconCash,
    },
    {
      title: "Invoices",
      url: "/invoices",
      icon: IconFileInvoice,
    },
    {
      title: "Transactions",
      url: "/transactions",
      icon: IconHistory,
    },
    {
      title: "Budget",
      url: "/budget",
      icon: IconCoin,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: IconReport,
    },
    {
      title: "Categories",
      url: "/categories",
      icon: IconCategory,
    },
    {
      title: "Savings",
      url: "/savings",
      icon: IconPig,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/dashboard">
                <IconWallet className="size-5!" />
                <span className="text-base font-semibold">CashFlow.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            email: session?.user.email,
            name: session?.user.name,
            image: session?.user.image,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
