import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Signup Page (Placeholder)
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Signup is not implemented yet in this build.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Back to Login
        </Link>
      </div>
    </main>
  );
}
