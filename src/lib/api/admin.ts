import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { SystemRole } from "../database.types";

// ─── Brands ──────────────────────────────────────────────────────────────────
export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("*").order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (brand: { id: string; name: string; initials: string; color: string }) => {
      const { data, error } = await supabase.from("brands").insert(brand).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brands"] }),
  });
}

// ─── Departments ─────────────────────────────────────────────────────────────
export function useDepartments(brandId?: string) {
  return useQuery({
    queryKey: ["departments", brandId],
    queryFn: async () => {
      if (brandId) {
        const { data: brandDepts, error: bdErr } = await supabase
          .from("department_brands")
          .select("department_id")
          .eq("brand_id", brandId);
        if (bdErr) throw bdErr;

        const deptIds = brandDepts.map((bd) => bd.department_id);
        if (deptIds.length === 0) return [];

        const { data, error } = await supabase
          .from("departments")
          .select("*")
          .in("id", deptIds)
          .order("name");
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      brandIds,
    }: {
      name: string;
      brandIds: string[];
    }) => {
      const id = name.toLowerCase().replace(/\s+/g, "_");
      const { data, error } = await supabase
        .from("departments")
        .insert({ id, name })
        .select()
        .single();
      if (error) throw error;

      if (brandIds.length > 0) {
        await supabase
          .from("department_brands")
          .insert(brandIds.map((brand_id) => ({ department_id: data.id, brand_id })));
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });
}

// ─── Profiles / Users ────────────────────────────────────────────────────────
export function useProfiles(brandId?: string) {
  return useQuery({
    queryKey: ["profiles", brandId],
    queryFn: async () => {
      if (brandId) {
        const { data: brandProfiles, error: bpErr } = await supabase
          .from("profile_brands")
          .select("profile_id")
          .eq("brand_id", brandId);
        if (bpErr) throw bpErr;

        const profileIds = brandProfiles.map((bp) => bp.profile_id);
        if (profileIds.length === 0) return [];

        const { data, error } = await supabase
          .from("profiles")
          .select("*, departments(id, name)")
          .in("id", profileIds)
          .order("name");
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*, departments(id, name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        name?: string;
        role?: SystemRole;
        department_id?: string;
        avatar_color?: string;
        brandIds?: string[];
      };
    }) => {
      const { brandIds, ...profileUpdates } = updates;
      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await supabase.from("profiles").update(profileUpdates).eq("id", id);
        if (error) throw error;
      }
      if (brandIds !== undefined) {
        await supabase.from("profile_brands").delete().eq("profile_id", id);
        if (brandIds.length > 0) {
          await supabase
            .from("profile_brands")
            .insert(brandIds.map((brand_id) => ({ profile_id: id, brand_id })));
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      email,
      name,
      password,
      role,
      departmentId,
      brandIds,
    }: {
      email: string;
      name: string;
      password: string;
      role: SystemRole;
      departmentId: string;
      brandIds: string[];
    }) => {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;
      if (!accessToken) throw new Error("Not authenticated");

      const { inviteEmployee } = await import("@/lib/server-functions");
      const result = await inviteEmployee({
        data: { accessToken, email, name, password, role, departmentId, brandIds },
      });
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}

// ─── Projects ────────────────────────────────────────────────────────────────
export function useProjects(brandId?: string) {
  return useQuery({
    queryKey: ["projects", brandId],
    queryFn: async () => {
      let q = supabase
        .from("projects")
        .select("*, brands(id, name, initials, color)")
        .order("created_at", { ascending: false });
      if (brandId) q = q.eq("brand_id", brandId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, brands(id, name, initials, color)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (project: {
      name: string;
      description?: string;
      brand_id: string;
    }) => {
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...project, created_by: session.session!.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; description?: string; status?: "active" | "archived" };
    }) => {
      const { error } = await supabase.from("projects").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

// ─── Reports / Analytics ─────────────────────────────────────────────────────
export function useReportStats(brandId?: string) {
  return useQuery({
    queryKey: ["reports", brandId],
    queryFn: async () => {
      let q = supabase.from("tasks").select("status, department_id, assigned_to, due_date");
      if (brandId) q = q.eq("brand_id", brandId);
      const { data, error } = await q;
      if (error) throw error;

      const now = new Date();
      return {
        total: data.length,
        completed: data.filter((t) => t.status === "completed").length,
        pending: data.filter((t) => !["completed", "rejected"].includes(t.status)).length,
        overdue: data.filter(
          (t) => t.due_date && new Date(t.due_date) < now && t.status !== "completed",
        ).length,
        waitingReview: data.filter((t) => t.status === "waiting_review").length,
        byDepartment: data.reduce(
          (acc, t) => {
            const dept = t.department_id ?? "unknown";
            acc[dept] = acc[dept] ?? { total: 0, completed: 0 };
            acc[dept].total++;
            if (t.status === "completed") acc[dept].completed++;
            return acc;
          },
          {} as Record<string, { total: number; completed: number }>,
        ),
      };
    },
  });
}
