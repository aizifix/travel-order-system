"use client";

import { Copy, Eye, EyeOff, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { UserRole } from "@/src/server/auth/types";
import { useToast } from "@/src/components/ui/toast-provider";

export type UserLookupOption = Readonly<{
  id: number;
  name: string;
}>;

export type UserCreationLookups = Readonly<{
  divisions: readonly UserLookupOption[];
  designations: readonly UserLookupOption[];
  employmentStatuses: readonly UserLookupOption[];
}>;

type AddUserModalProps = Readonly<{
  lookups: UserCreationLookups;
  onClose: () => void;
  onCreated: () => void;
}>;

type ApiErrorResponse = Readonly<{
  error?: string;
}>;

const PASSWORD_LOWER = "abcdefghijkmnopqrstuvwxyz";
const PASSWORD_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const PASSWORD_NUMBERS = "23456789";
const PASSWORD_SYMBOLS = "!@#$%^&*()-_=+";
const PASSWORD_ALL =
  PASSWORD_LOWER + PASSWORD_UPPER + PASSWORD_NUMBERS + PASSWORD_SYMBOLS;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function secureRandomIndex(maxExclusive: number): number {
  if (maxExclusive <= 0) {
    return 0;
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const maxUint32 = 0x100000000;
    const limit = maxUint32 - (maxUint32 % maxExclusive);
    const random = new Uint32Array(1);
    let value = 0;
    do {
      crypto.getRandomValues(random);
      value = random[0] ?? 0;
    } while (value >= limit);
    return value % maxExclusive;
  }

  return Math.floor(Math.random() * maxExclusive);
}

function pickRandomChar(pool: string): string {
  return pool.charAt(secureRandomIndex(pool.length));
}

function shuffle<T>(items: T[]): T[] {
  const values = [...items];
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = secureRandomIndex(i + 1);
    [values[i], values[j]] = [values[j] as T, values[i] as T];
  }
  return values;
}

function generateStrongPassword(length = 14): string {
  const targetLength = Math.max(12, length);
  const chars = [
    pickRandomChar(PASSWORD_LOWER),
    pickRandomChar(PASSWORD_UPPER),
    pickRandomChar(PASSWORD_NUMBERS),
    pickRandomChar(PASSWORD_SYMBOLS),
  ];

  while (chars.length < targetLength) {
    chars.push(pickRandomChar(PASSWORD_ALL));
  }

  return shuffle(chars).join("");
}

export function AddUserModal({ lookups, onClose, onCreated }: AddUserModalProps) {
  const { showToast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("regular");
  const [isActive, setIsActive] = useState(true);
  const [positionName, setPositionName] = useState("");
  const [divisionId, setDivisionId] = useState(() =>
    String(lookups.divisions[0]?.id ?? ""),
  );
  const [designationId, setDesignationId] = useState(() =>
    String(lookups.designations[0]?.id ?? ""),
  );
  const [employmentStatusId, setEmploymentStatusId] = useState(() =>
    String(lookups.employmentStatuses[0]?.id ?? ""),
  );
  const [password, setPassword] = useState(() => generateStrongPassword());
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const hasLookupData =
    lookups.divisions.length > 0 &&
    lookups.designations.length > 0 &&
    lookups.employmentStatuses.length > 0;

  const handleGeneratePassword = () => {
    setPassword(generateStrongPassword());
  };

  const handleCopyPassword = async () => {
    if (!password) {
      return;
    }

    try {
      await navigator.clipboard.writeText(password);
      showToast({
        type: "success",
        title: "Password copied",
      });
    } catch {
      showToast({
        type: "error",
        title: "Copy failed",
        description: "Please copy the password manually.",
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("First name and last name are required.");
      return;
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }

    if (!password || password.length < 12) {
      setErrorMessage("Password must be at least 12 characters.");
      return;
    }

    if (!positionName.trim()) {
      setErrorMessage("Position is required.");
      return;
    }

    if (!divisionId || !designationId || !employmentStatusId) {
      setErrorMessage("Please complete all required dropdown fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          isActive,
          positionName: positionName.trim(),
          divisionId: Number(divisionId),
          designationId: Number(designationId),
          employmentStatusId: Number(employmentStatusId),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
        const message = payload?.error ?? "Failed to create user.";
        setErrorMessage(message);
        showToast({
          type: "error",
          title: "Unable to create user",
          description: message,
        });
        return;
      }

      showToast({
        type: "success",
        title: "User created",
        description: "The account can now be used to log in.",
      });
      onCreated();
    } catch {
      const message = "Unable to create user right now. Please try again.";
      setErrorMessage(message);
      showToast({
        type: "error",
        title: "Request failed",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[70] bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8">
        <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#dfe1ed] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between border-b border-[#dfe1ed] px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-[#1a1d1f]">Add User</h2>
              <p className="text-sm text-[#5d6780]">
                Create a new account with required role and profile details.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5d6780] transition hover:bg-[#f3f5fa] hover:text-[#1a1d1f]"
              aria-label="Close add user modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {errorMessage ? (
                <div className="mb-4 rounded-lg border border-[#ffcece] bg-[#fff3f3] px-3 py-2 text-sm text-[#a33a3a]">
                  {errorMessage}
                </div>
              ) : null}

              {!hasLookupData ? (
                <div className="rounded-lg border border-[#ffe4b5] bg-[#fff9ed] px-3 py-2 text-sm text-[#8a5b00]">
                  Missing lookup options. Ensure divisions, designations, and employment statuses are seeded.
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#4a5266]">First Name</span>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="h-10 w-full rounded-lg border border-[#dfe1ed] px-3 text-sm text-[#2f3339] focus:border-[#3B9F41] focus:outline-none focus:ring-1 focus:ring-[#3B9F41]"
                    maxLength={100}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#4a5266]">Last Name</span>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="h-10 w-full rounded-lg border border-[#dfe1ed] px-3 text-sm text-[#2f3339] focus:border-[#3B9F41] focus:outline-none focus:ring-1 focus:ring-[#3B9F41]"
                    maxLength={100}
                    required
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-[#4a5266]">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-10 w-full rounded-lg border border-[#dfe1ed] px-3 text-sm text-[#2f3339] focus:border-[#3B9F41] focus:outline-none focus:ring-1 focus:ring-[#3B9F41]"
                    maxLength={255}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#4a5266]">Role</span>
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value as UserRole)}
                    className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] focus:border-[#3B9F41] focus:outline-none focus:ring-1 focus:ring-[#3B9F41]"
                  >
                    <option value="admin">Admin</option>
                    <option value="approver">Approver</option>
                    <option value="regular">Regular</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#4a5266]">Status</span>
                  <select
                    value={isActive ? "active" : "inactive"}
                    onChange={(event) => setIsActive(event.target.value === "active")}
                    className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] focus:border-[#3B9F41] focus:outline-none focus:ring-1 focus:ring-[#3B9F41]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Division"
                  value={divisionId}
                  onChange={setDivisionId}
                  options={lookups.divisions}
                />
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#4a5266]">Position</span>
                  <input
                    type="text"
                    value={positionName}
                    onChange={(event) => setPositionName(event.target.value)}
                    className="h-10 w-full rounded-lg border border-[#dfe1ed] px-3 text-sm text-[#2f3339] focus:border-[#3B9F41] focus:outline-none focus:ring-1 focus:ring-[#3B9F41]"
                    maxLength={150}
                    placeholder="e.g. Administrative Officer V"
                    required
                  />
                </label>
                <SelectField
                  label="Designation"
                  value={designationId}
                  onChange={setDesignationId}
                  options={lookups.designations}
                />
                <SelectField
                  label="Employment Status"
                  value={employmentStatusId}
                  onChange={setEmploymentStatusId}
                  options={lookups.employmentStatuses}
                />
              </div>

              <div className="mt-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#4a5266]">Password</span>
                  <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                      <input
                        type={isPasswordVisible ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="h-10 w-full rounded-lg border border-[#dfe1ed] px-3 pr-10 text-sm text-[#2f3339] focus:border-[#3B9F41] focus:outline-none focus:ring-1 focus:ring-[#3B9F41]"
                        minLength={12}
                        maxLength={128}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setIsPasswordVisible((current) => !current)}
                        className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#5d6780] transition hover:bg-[#f3f5fa]"
                        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                      >
                        {isPasswordVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="inline-flex h-10 items-center gap-1 rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm font-medium text-[#5d6780] transition hover:bg-[#f3f5fa]"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Generate
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="inline-flex h-10 items-center gap-1 rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm font-medium text-[#5d6780] transition hover:bg-[#f3f5fa]"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                  </div>
                </label>
                <p className="mt-2 text-xs text-[#7d8598]">
                  Use at least 12 characters with uppercase, lowercase, number, and symbol.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#dfe1ed] px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#dfe1ed] bg-white px-4 text-sm font-medium text-[#5d6780] transition hover:bg-[#f3f5fa]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasLookupData || isSubmitting}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#3B9F41] px-4 text-sm font-semibold text-white transition hover:bg-[#359436] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body,
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly UserLookupOption[];
}>) {
  const hasOptions = options.length > 0;

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#4a5266]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-[#dfe1ed] bg-white px-3 text-sm text-[#2f3339] focus:border-[#3B9F41] focus:outline-none focus:ring-1 focus:ring-[#3B9F41]"
        required
        disabled={!hasOptions}
      >
        {!hasOptions ? (
          <option value="">No options available</option>
        ) : (
          options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))
        )}
      </select>
    </label>
  );
}
