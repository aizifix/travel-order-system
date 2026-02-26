import type { RowDataPacket } from "mysql2";
import { compare, hash } from "bcryptjs";
import { getDbPool } from "@/src/server/db/mysql";
import type { AuthUser, UserRole } from "@/src/server/auth/types";

type UserRow = RowDataPacket & {
  user_id: number;
  user_firstName: string;
  user_lastName: string;
  user_email: string;
  user_password: string;
  user_role: UserRole;
  user_isActive: 0 | 1;
};

const PLACEHOLDER_HASH_MARKER = "placeholder.hash.replace";
const DEFAULT_DEV_PASSWORD = "changeme";

function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

function mapAuthUser(row: UserRow): AuthUser {
  return {
    id: row.user_id,
    firstName: row.user_firstName,
    lastName: row.user_lastName,
    email: row.user_email,
    role: row.user_role,
    isActive: row.user_isActive === 1,
  };
}

async function findUserRowByEmail(email: string): Promise<UserRow | null> {
  const pool = getDbPool();
  const normalizedEmail = email.trim().toLowerCase();
  const [rows] = await pool.execute<UserRow[]>(
    `
      SELECT
        user_id,
        user_firstName,
        user_lastName,
        user_email,
        user_password,
        user_role,
        user_isActive
      FROM users
      WHERE user_email = ?
      LIMIT 1
    `,
    [normalizedEmail],
  );

  return rows[0] ?? null;
}

async function findUserRowById(userId: number): Promise<UserRow | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<UserRow[]>(
    `
      SELECT
        user_id,
        user_firstName,
        user_lastName,
        user_email,
        user_password,
        user_role,
        user_isActive
      FROM users
      WHERE user_id = ?
      LIMIT 1
    `,
    [userId],
  );

  return rows[0] ?? null;
}

async function updateUserPassword(userId: number, nextHash: string): Promise<void> {
  const pool = getDbPool();
  await pool.execute("UPDATE users SET user_password = ? WHERE user_id = ?", [
    nextHash,
    userId,
  ]);
}

async function verifyPasswordAndUpgradeIfNeeded(
  row: UserRow,
  plainPassword: string,
): Promise<boolean> {
  const stored = row.user_password ?? "";

  if (stored.includes(PLACEHOLDER_HASH_MARKER)) {
    if (plainPassword !== DEFAULT_DEV_PASSWORD) {
      return false;
    }

    // Upgrade the seeded placeholder hash to a real bcrypt hash on first local login.
    const upgradedHash = await hash(plainPassword, 10);
    await updateUserPassword(row.user_id, upgradedHash);
    return true;
  }

  if (isBcryptHash(stored)) {
    try {
      return await compare(plainPassword, stored);
    } catch {
      return false;
    }
  }

  // Dev fallback if local data was inserted without hashing.
  if (stored === plainPassword) {
    const upgradedHash = await hash(plainPassword, 10);
    await updateUserPassword(row.user_id, upgradedHash);
    return true;
  }

  return false;
}

export async function authenticateUser(email: string, password: string): Promise<{
  ok: true;
  user: AuthUser;
} | {
  ok: false;
  reason: "invalid_credentials" | "inactive";
}> {
  const row = await findUserRowByEmail(email);

  if (!row) {
    return { ok: false, reason: "invalid_credentials" };
  }

  if (row.user_isActive !== 1) {
    return { ok: false, reason: "inactive" };
  }

  const isValidPassword = await verifyPasswordAndUpgradeIfNeeded(row, password);
  if (!isValidPassword) {
    return { ok: false, reason: "invalid_credentials" };
  }

  return {
    ok: true,
    user: mapAuthUser(row),
  };
}

export async function getAuthUserById(userId: number): Promise<AuthUser | null> {
  const row = await findUserRowById(userId);
  if (!row || row.user_isActive !== 1) {
    return null;
  }
  return mapAuthUser(row);
}

export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "approver":
      return "/approver/dashboard";
    case "regular":
      return "/regular/dashboard";
    default:
      return "/login";
  }
}

