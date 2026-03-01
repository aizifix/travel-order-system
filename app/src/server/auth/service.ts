import type { ResultSetHeader, RowDataPacket } from "mysql2";
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

type UserWithDivisionRow = RowDataPacket & {
  user_id: number;
  user_firstName: string;
  user_lastName: string;
  user_email: string;
  user_role: UserRole;
  user_isActive: 0 | 1;
  division_id: number | null;
  division_name: string | null;
  position_name: string | null;
};

export async function getUserWithDivision(userId: number): Promise<{
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  division: string | null;
  position: string | null;
} | null> {
  const pool = getDbPool();
  const [rows] = await pool.execute<UserWithDivisionRow[]>(
    `
      SELECT
        u.user_id,
        u.user_firstName,
        u.user_lastName,
        u.user_email,
        u.user_role,
        u.user_isActive,
        u.division_id,
        d.division_name,
        p.position_name
      FROM users u
      LEFT JOIN divisions d ON u.division_id = d.division_id
      LEFT JOIN positions p ON u.position_id = p.position_id
      WHERE u.user_id = ?
      LIMIT 1
    `,
    [userId],
  );

  const row = rows[0];
  if (!row || row.user_isActive !== 1) {
    return null;
  }

  return {
    id: row.user_id,
    firstName: row.user_firstName,
    lastName: row.user_lastName,
    email: row.user_email,
    role: row.user_role,
    isActive: row.user_isActive === 1,
    division: row.division_name,
    position: row.position_name,
  };
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

export type UserFilter = Readonly<{
  search?: string;
  role?: UserRole | "all";
  isActive?: boolean | "all";
  page?: number;
  limit?: number;
}>;

export type UserListItem = Readonly<{
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  division: string | null;
  position: string | null;
  designation: string | null;
  createdAt: Date;
}>;

export type UserListResult = Readonly<{
  users: readonly UserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;

type UserListRow = RowDataPacket & {
  user_id: number;
  user_firstName: string;
  user_lastName: string;
  user_email: string;
  user_role: UserRole;
  user_isActive: 0 | 1;
  division_name: string | null;
  position_name: string | null;
  designation_name: string | null;
  created_at: Date;
};

export async function getUsers(filter?: UserFilter): Promise<UserListResult> {
  const pool = getDbPool();

  const page = Math.max(1, filter?.page ?? 1);
  const limit = Math.min(100, Math.max(1, filter?.limit ?? 10));
  const offset = (page - 1) * limit;

  let whereClause = "WHERE 1=1";
  const params: (string | number)[] = [];

  if (filter?.search) {
    whereClause += ` AND (
      u.user_firstName LIKE ?
      OR u.user_lastName LIKE ?
      OR u.user_email LIKE ?
    )`;
    const searchPattern = `%${filter.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (filter?.role && filter.role !== "all") {
    whereClause += " AND u.user_role = ?";
    params.push(filter.role);
  }

  if (filter?.isActive !== undefined && filter.isActive !== "all") {
    whereClause += " AND u.user_isActive = ?";
    params.push(filter.isActive ? 1 : 0);
  }

  // Get total count
  const [countResult] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM users u ${whereClause}`,
    params,
  );
  const total = (countResult[0]?.total ?? 0) as number;

  // Get paginated data
  const [rows] = await pool.execute<UserListRow[]>(
    `
      SELECT
        u.user_id,
        u.user_firstName,
        u.user_lastName,
        u.user_email,
        u.user_role,
        u.user_isActive,
        d.division_name,
        p.position_name,
        des.designation_name,
        u.created_at
      FROM users u
      LEFT JOIN divisions d ON u.division_id = d.division_id
      LEFT JOIN positions p ON u.position_id = p.position_id
      LEFT JOIN designations des ON u.designation_id = des.designation_id
      ${whereClause}
      ORDER BY u.user_id DESC
      LIMIT ? OFFSET ?
    `,
    [...params, limit, offset],
  );

  const users = rows.map((row) => ({
    id: row.user_id,
    firstName: row.user_firstName,
    lastName: row.user_lastName,
    email: row.user_email,
    role: row.user_role,
    isActive: row.user_isActive === 1,
    division: row.division_name,
    position: row.position_name,
    designation: row.designation_name,
    createdAt: row.created_at,
  }));

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

type UserLookupOption = Readonly<{
  id: number;
  name: string;
}>;

export type UserCreationLookups = Readonly<{
  divisions: readonly UserLookupOption[];
  designations: readonly UserLookupOption[];
  employmentStatuses: readonly UserLookupOption[];
}>;

type UserLookupOptionRow = RowDataPacket & {
  id: number;
  name: string;
};

export async function getUserCreationLookups(): Promise<UserCreationLookups> {
  const pool = getDbPool();

  const [divisionRows, designationRows, employmentStatusRows] = await Promise.all([
    pool.execute<UserLookupOptionRow[]>(
      `
        SELECT division_id AS id, division_name AS name
        FROM divisions
        WHERE is_active = 1
        ORDER BY division_name ASC
      `,
    ),
    pool.execute<UserLookupOptionRow[]>(
      `
        SELECT designation_id AS id, designation_name AS name
        FROM designations
        WHERE is_active = 1
        ORDER BY designation_name ASC
      `,
    ),
    pool.execute<UserLookupOptionRow[]>(
      `
        SELECT employment_status_id AS id, employment_status_name AS name
        FROM employment_statuses
        WHERE is_active = 1
        ORDER BY employment_status_name ASC
      `,
    ),
  ]);

  return {
    divisions: divisionRows[0],
    designations: designationRows[0],
    employmentStatuses: employmentStatusRows[0],
  };
}

export type CreateUserInput = Readonly<{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  divisionId: number;
  positionName: string;
  designationId: number;
  employmentStatusId: number;
}>;

export type CreateUserResult = Readonly<
  | {
      ok: true;
      userId: number;
    }
  | {
      ok: false;
      reason: "validation" | "email_exists" | "lookup_not_found";
      message: string;
    }
>;

type ExistingUserRow = RowDataPacket & {
  user_id: number;
};

type LookupCheckRow = RowDataPacket & {
  hasDivision: 0 | 1;
  hasDesignation: 0 | 1;
  hasEmploymentStatus: 0 | 1;
};

type PositionRow = RowDataPacket & {
  position_id: number;
  is_active: 0 | 1;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_LOWERCASE_PATTERN = /[a-z]/;
const PASSWORD_UPPERCASE_PATTERN = /[A-Z]/;
const PASSWORD_NUMBER_PATTERN = /\d/;
const PASSWORD_SYMBOL_PATTERN = /[^A-Za-z0-9]/;
const ALLOWED_USER_ROLES: readonly UserRole[] = ["admin", "approver", "regular"];

function hasDuplicateEntryError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  return (error as { code?: string }).code === "ER_DUP_ENTRY";
}

async function resolvePositionId(
  pool: ReturnType<typeof getDbPool>,
  rawPositionName: string,
): Promise<number> {
  const positionName = rawPositionName.trim().replace(/\s+/g, " ");

  const [existingRows] = await pool.execute<PositionRow[]>(
    `
      SELECT position_id, is_active
      FROM positions
      WHERE position_name = ?
      LIMIT 1
    `,
    [positionName],
  );

  const existingRow = existingRows[0];
  if (existingRow) {
    if (existingRow.is_active !== 1) {
      await pool.execute(
        `
          UPDATE positions
          SET is_active = 1
          WHERE position_id = ?
        `,
        [existingRow.position_id],
      );
    }
    return existingRow.position_id;
  }

  try {
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `
        INSERT INTO positions (position_name, is_active)
        VALUES (?, 1)
      `,
      [positionName],
    );
    return insertResult.insertId;
  } catch (error) {
    if (!hasDuplicateEntryError(error)) {
      throw error;
    }

    const [conflictRows] = await pool.execute<PositionRow[]>(
      `
        SELECT position_id, is_active
        FROM positions
        WHERE position_name = ?
        LIMIT 1
      `,
      [positionName],
    );
    const conflictRow = conflictRows[0];
    if (!conflictRow) {
      throw error;
    }
    if (conflictRow.is_active !== 1) {
      await pool.execute(
        `
          UPDATE positions
          SET is_active = 1
          WHERE position_id = ?
        `,
        [conflictRow.position_id],
      );
    }
    return conflictRow.position_id;
  }
}

export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const positionName = input.positionName.trim().replace(/\s+/g, " ");

  if (!firstName || firstName.length > 100) {
    return {
      ok: false,
      reason: "validation",
      message: "First name is required and must be at most 100 characters.",
    };
  }

  if (!lastName || lastName.length > 100) {
    return {
      ok: false,
      reason: "validation",
      message: "Last name is required and must be at most 100 characters.",
    };
  }

  if (!email || email.length > 255 || !EMAIL_PATTERN.test(email)) {
    return {
      ok: false,
      reason: "validation",
      message: "A valid email address is required.",
    };
  }

  if (
    password.length < 12 ||
    password.length > 128 ||
    !PASSWORD_LOWERCASE_PATTERN.test(password) ||
    !PASSWORD_UPPERCASE_PATTERN.test(password) ||
    !PASSWORD_NUMBER_PATTERN.test(password) ||
    !PASSWORD_SYMBOL_PATTERN.test(password)
  ) {
    return {
      ok: false,
      reason: "validation",
      message:
        "Password must be 12-128 characters and include uppercase, lowercase, number, and symbol.",
    };
  }

  if (!ALLOWED_USER_ROLES.includes(input.role)) {
    return {
      ok: false,
      reason: "validation",
      message: "Invalid user role.",
    };
  }

  if (
    !Number.isInteger(input.divisionId) ||
    input.divisionId <= 0 ||
    !Number.isInteger(input.designationId) ||
    input.designationId <= 0 ||
    !Number.isInteger(input.employmentStatusId) ||
    input.employmentStatusId <= 0
  ) {
    return {
      ok: false,
      reason: "validation",
      message: "Division, designation, and employment status are required.",
    };
  }

  if (!positionName || positionName.length > 150) {
    return {
      ok: false,
      reason: "validation",
      message: "Position is required and must be at most 150 characters.",
    };
  }

  const pool = getDbPool();
  const [[existingUsers], [lookupChecks]] = await Promise.all([
    pool.execute<ExistingUserRow[]>(
      `
        SELECT user_id
        FROM users
        WHERE user_email = ?
        LIMIT 1
      `,
      [email],
    ),
    pool.execute<LookupCheckRow[]>(
      `
        SELECT
          EXISTS(SELECT 1 FROM divisions WHERE division_id = ? AND is_active = 1) AS hasDivision,
          EXISTS(SELECT 1 FROM designations WHERE designation_id = ? AND is_active = 1) AS hasDesignation,
          EXISTS(SELECT 1 FROM employment_statuses WHERE employment_status_id = ? AND is_active = 1) AS hasEmploymentStatus
      `,
      [
        input.divisionId,
        input.designationId,
        input.employmentStatusId,
      ],
    ),
  ]);

  if (existingUsers.length > 0) {
    return {
      ok: false,
      reason: "email_exists",
      message: "A user with this email already exists.",
    };
  }

  const lookupCheck = lookupChecks[0];
  if (
    !lookupCheck ||
    lookupCheck.hasDivision !== 1 ||
    lookupCheck.hasDesignation !== 1 ||
    lookupCheck.hasEmploymentStatus !== 1
  ) {
    return {
      ok: false,
      reason: "lookup_not_found",
      message:
        "One or more selected dropdown values are invalid or inactive. Refresh and try again.",
    };
  }

  const positionId = await resolvePositionId(pool, positionName);
  const passwordHash = await hash(password, 12);

  try {
    const [insertResult] = await pool.execute<ResultSetHeader>(
      `
        INSERT INTO users (
          user_firstName,
          user_lastName,
          user_email,
          user_password,
          user_role,
          user_isActive,
          division_id,
          position_id,
          designation_id,
          employment_status_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        firstName,
        lastName,
        email,
        passwordHash,
        input.role,
        input.isActive ? 1 : 0,
        input.divisionId,
        positionId,
        input.designationId,
        input.employmentStatusId,
      ],
    );

    return {
      ok: true,
      userId: insertResult.insertId,
    };
  } catch (error) {
    if (hasDuplicateEntryError(error)) {
      return {
        ok: false,
        reason: "email_exists",
        message: "A user with this email already exists.",
      };
    }
    throw error;
  }
}
