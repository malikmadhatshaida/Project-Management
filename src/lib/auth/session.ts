import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

const AUTH_SECRET = process.env.AUTH_SECRET || "project_management_super_secret_jwt_key_2026_production_grade";
const COOKIE_NAME = "pm_auth_token";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  companyId: string;
  roleName: string;
  roleId: string;
  isSuperAdmin?: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, AUTH_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        where: session.companyId ? { companyId: session.companyId } : undefined,
        include: {
          company: true,
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
          department: true,
          team: true,
        },
      },
    },
  });

  if (!user || user.memberships.length === 0) {
    return null;
  }

  const membership = user.memberships[0];
  const permissions = membership.role.permissions.map((rp) => rp.permission.code);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      jobTitle: user.jobTitle,
      phone: user.phone,
      bio: user.bio,
      skills: user.skills,
      isSuperAdmin: user.isSuperAdmin,
    },
    membership: {
      id: membership.id,
      companyId: membership.companyId,
      roleName: membership.role.name,
      roleDisplayName: membership.role.displayName,
      department: membership.department,
      team: membership.team,
      status: membership.status,
    },
    company: membership.company,
    permissions,
  };
}
