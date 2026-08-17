import Navbar from "@/components/Navbar";
import StatusBar from "@/components/StatusBar";

export default function AppPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-on-surface pb-10">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">{children}</main>
      <StatusBar />
    </div>
  );
}
