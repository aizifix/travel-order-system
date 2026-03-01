export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#D8E8D8] to-[#C8D8C8]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <p className="text-sm text-white/80">Loading...</p>
      </div>
    </div>
  );
}
