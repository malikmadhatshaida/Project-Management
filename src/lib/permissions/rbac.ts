import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/db/prisma";

export async function requireAuth() {
  const auth = await getCurrentUser();
  if (!auth) {
    redirect("/login");
  }
  return auth;
}

export async function requirePermission(permissionCode: string) {
  const auth = await requireAuth();

  // Super admin or company admin bypasses granular checks
  if (auth.user.isSuperAdmin || auth.membership.roleName === "COMPANY_ADMIN") {
    return auth;
  }

  if (!auth.permissions.includes(permissionCode)) {
    throw new Error(`Unauthorized: Missing required permission ${permissionCode}`);
  }

  return auth;
}

export function hasPermission(
  userPermissions: string[],
  roleName: string,
  permissionCode: string,
  isSuperAdmin = false
): boolean {
  if (isSuperAdmin || roleName === "COMPANY_ADMIN") {
    return true;
  }
  return userPermissions.includes(permissionCode);
}

export async function checkServerPermission(
  userId: string,
  companyId: string,
  permissionCode: string
): Promise<boolean> {
  const member = await prisma.companyMember.findUnique({
    where: {
      companyId_userId: { companyId, userId },
    },
    include: {
      user: true,
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!member) return false;
  if (member.user.isSuperAdmin || member.role.name === "COMPANY_ADMIN") return true;

  return member.role.permissions.some((rp) => rp.permission.code === permissionCode);
}
