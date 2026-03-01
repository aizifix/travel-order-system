export type UserRole = "admin" | "approver" | "regular";

export type AuthUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export type SessionPayload = {
  userId: number;
  role: UserRole;
  email: string;
  displayName: string;
  exp: number;
};

