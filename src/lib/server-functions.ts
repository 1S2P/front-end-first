import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

async function getUserPermissionIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userClient: any,
  userId: string,
) {
  const { data } = await userClient
    .from("profile_permissions")
    .select("permission_id")
    .eq("profile_id", userId);
  return new Set(((data ?? []) as { permission_id: string }[]).map((p) => p.permission_id));
}

export const setProfilePermissions = createServerFn({ method: "POST" as const })
  .validator(
    (data: { accessToken: string; profileId: string; permissionIds: string[] }) => data,
  )
  .handler(async ({ data }) => {
    const userClient = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${data.accessToken}` } } },
    );

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: callerProfile } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = callerProfile?.role === "admin";
    const perms = await getUserPermissionIds(userClient, user.id);
    if (!isAdmin && !perms.has("admin_assign_permissions")) {
      throw new Error("Forbidden: you do not have permission to assign permissions");
    }

    const adminClient = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error: deleteError } = await adminClient
      .from("profile_permissions")
      .delete()
      .eq("profile_id", data.profileId);
    if (deleteError) throw new Error(deleteError.message || "Failed to update permissions");

    if (data.permissionIds.length > 0) {
      const { error: insertError } = await adminClient.from("profile_permissions").insert(
        data.permissionIds.map((permission_id) => ({
          profile_id: data.profileId,
          permission_id,
        })),
      );
      if (insertError) throw new Error(insertError.message || "Failed to update permissions");
    }

    return { profileId: data.profileId };
  });

export const inviteEmployee = createServerFn({ method: "POST" as const })
  .validator(
    (data: {
      accessToken: string;
      email: string;
      name: string;
      password: string;
      role: string;
      departmentId: string;
      brandIds: string[];
    }) => data,
  )
  .handler(async ({ data }) => {
    const userClient = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${data.accessToken}` } } },
    );

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";
    const perms = await getUserPermissionIds(userClient, user.id);
    if (!isAdmin && !perms.has("admin_manage_employees")) throw new Error("Forbidden");

    const adminClient = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name },
    });
    if (createError) throw new Error(createError.message || "Failed to create user account");

    const userId = userData.user.id;

    const initials = data.name
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        name: data.name,
        role: data.role,
        department_id: data.departmentId,
        initials,
      })
      .eq("id", userId);
    if (profileError) throw new Error(profileError.message || "Failed to update profile");

    if (data.brandIds.length > 0) {
      const { error: brandError } = await adminClient.from("profile_brands").insert(
        data.brandIds.map((brand_id) => ({
          profile_id: userId,
          brand_id,
        })),
      );
      if (brandError) throw new Error(brandError.message || "Failed to assign brands");
    }

    return { id: userId };
  });

export const uploadTaskAttachment = createServerFn({ method: "POST" as const })
  .validator(
    (data: {
      accessToken: string;
      taskId: string;
      fileName: string;
      contentType: string;
      content: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const userClient = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${data.accessToken}` } } },
    );

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: task } = await userClient
      .from("tasks")
      .select("id, assigned_to, department_id")
      .eq("id", data.taskId)
      .single();
    if (!task) throw new Error("Task not found");

    const { data: profile } = await userClient
      .from("profiles")
      .select("role, department_id")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";
    const perms = await getUserPermissionIds(userClient, user.id);
    const sameDept = profile?.department_id === task.department_id;
    const canUpload =
      task.assigned_to === user.id ||
      isAdmin ||
      (sameDept && (perms.has("tasks_upload_files") || perms.has("dashboard_department_tasks")));
    if (!canUpload) {
      throw new Error("Forbidden: you do not have access to this task");
    }

    const adminClient = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const path = `tasks/${data.taskId}/${Date.now()}-${data.fileName}`;
    const buffer = Buffer.from(data.content, "base64");

    const { error: uploadError } = await adminClient.storage
      .from("task-attachments")
      .upload(path, buffer, {
        contentType: data.contentType || "application/octet-stream",
      });
    if (uploadError) throw new Error(uploadError.message || "Failed to upload file");

    const ext = data.fileName.split(".").pop()?.toLowerCase() ?? "";
    const type = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)
      ? "image"
      : ["mp4", "mov", "avi", "webm"].includes(ext)
        ? "video"
        : ["pdf", "doc", "docx", "xls", "xlsx"].includes(ext)
          ? "document"
          : "other";

    const { error: dbError } = await adminClient.from("task_attachments").insert({
      task_id: data.taskId,
      name: data.fileName,
      type,
      size: `${(buffer.byteLength / 1024).toFixed(0)} KB`,
      storage_path: path,
      uploaded_by: user.id,
    });
    if (dbError) throw new Error(dbError.message || "Failed to save attachment");

    const { error: actError } = await adminClient.from("task_activities").insert({
      task_id: data.taskId,
      action: "files_uploaded",
      user_id: user.id,
      description: `Uploaded ${data.fileName}`,
    });
    if (actError) throw new Error(actError.message || "Failed to log activity");

    return { path };
  });

export const getTaskAttachmentSignedUrls = createServerFn({ method: "POST" as const })
  .validator((data: { accessToken: string; taskId: string }) => data)
  .handler(async ({ data }) => {
    const userClient = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${data.accessToken}` } } },
    );

    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: task } = await userClient
      .from("tasks")
      .select("id, assigned_to, department_id")
      .eq("id", data.taskId)
      .single();
    if (!task) throw new Error("Task not found");

    const { data: profile } = await userClient
      .from("profiles")
      .select("role, department_id")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin";
    const perms = await getUserPermissionIds(userClient, user.id);
    const sameDept = profile?.department_id === task.department_id;
    const canView =
      task.assigned_to === user.id ||
      isAdmin ||
      (sameDept && (perms.has("tasks_upload_files") || perms.has("dashboard_department_tasks")));
    if (!canView) {
      throw new Error("Forbidden: you do not have access to this task");
    }

    const adminClient = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: attachments, error: listError } = await adminClient
      .from("task_attachments")
      .select("id, name, type, size, storage_path")
      .eq("task_id", data.taskId);
    if (listError) throw new Error(listError.message || "Failed to load attachments");

    const result = [];
    for (const attachment of attachments ?? []) {
      const { data: signed, error: signError } = await adminClient.storage
        .from("task-attachments")
        .createSignedUrl(attachment.storage_path, 3600);
      if (signError) throw new Error(signError.message || "Failed to sign attachment URL");
      result.push({
        id: attachment.id,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        url: signed?.signedUrl,
      });
    }

    return result;
  });
