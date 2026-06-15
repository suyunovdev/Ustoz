export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="mt-4 text-sm text-muted-foreground">Yuklanmoqda...</p>
    </div>
  );
}
