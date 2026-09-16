import {
  LayoutDashboard,
  ListTodo,
  Briefcase,
  Workflow,
  Bell,
  BarChart3,
  Building2,
  Layers,
  UserPlus,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** command-permission required to see the item (admin sees all) */
  permission?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const WORK_NAV: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/tasks", label: "My Tasks", icon: ListTodo },
  { to: "/projects", label: "Projects", icon: Briefcase },
  { to: "/workflows", label: "Workflows", icon: Workflow },
];

export const INSIGHTS_NAV: NavItem[] = [
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

export const MANAGE_NAV: NavItem[] = [
  { to: "/admin/brands", label: "Brands", icon: Building2, permission: "admin_manage_brands" },
  { to: "/admin/departments", label: "Departments", icon: Layers, permission: "admin_manage_departments" },
  { to: "/admin/employees", label: "Employees", icon: UserPlus, permission: "admin_manage_employees" },
  { to: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck, permission: "admin_assign_permissions" },
];

export const NAV_GROUPS = [
  { label: "Work", items: WORK_NAV },
  { label: "Insights", items: INSIGHTS_NAV },
  { label: "Manage", items: MANAGE_NAV },
] satisfies NavGroup[];