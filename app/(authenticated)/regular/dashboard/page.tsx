import { requireRole } from "@/src/server/auth/guards";

export default async function RegularDashboardPage() {
  const session = await requireRole("regular");

  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Regular User Dashboard (Placeholder)
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Signed in as {session.email}. Regular-user pages are not implemented yet.
        </p>
        <form action="/api/auth/logout" method="post" className="mt-4">
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Logout
          </button>
        </form>
      </div>
    </main>
  );
}
