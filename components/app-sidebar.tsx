"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { LayoutDashboard, Users, History, Settings, Mail, FileText, Send, MailCheck, BarChart, LineChart, Tags } from "lucide-react"

export function AppSidebar({ user, ...props }: any) {
  const navItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      title: "Clientes",
      url: "/clientes",
      icon: <Users className="size-4" />,
    },
    {
      title: "Templates",
      url: "/templates",
      icon: <FileText className="size-4" />,
    },
    {
      title: "Tipos de Factura",
      url: "/tipos-factura",
      icon: <Tags className="size-4" />,
    },
    {
      title: "Enviar Mails",
      url: "/enviar-mails",
      icon: <MailCheck className="size-4" />,
    },
    {
      title: "Reenvío Manual",
      url: "/mails-manuales",
      icon: <Send className="size-4" />,
      disabled: true,
    },
    {
      title: "Reportes",
      url: "/reportes",
      icon: <BarChart className="size-4" />,
      disabled: true,
    },
    {
      title: "Análisis",
      url: "/analisis",
      icon: <LineChart className="size-4" />,
      disabled: true,
    },
    {
      title: "Historial de Acciones",
      url: "/historial",
      icon: <History className="size-4" />,
    },
    {
      title: "Usuarios",
      url: "/usuarios",
      icon: <Users className="size-4" />,
      adminOnly: true,
    },
    {
      title: "Configuración",
      url: "/configuracion",
      icon: <Settings className="size-4" />,
    },
  ];

  const filteredNav = navItems.filter(item => !item.adminOnly || user?.role === "ADMIN");

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Mail className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">GestorCorreosTC</span>
                <span className="truncate text-xs text-muted-foreground">v1.0.0</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
