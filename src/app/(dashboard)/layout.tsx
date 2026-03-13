import { Sidebar, MobileSidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Sidebar />
            <main className="flex-1 lg:pl-64">
                {/* Mobile Header - only shows menu trigger */}
                <div className="lg:hidden sticky top-0 z-30 flex h-12 items-center border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 px-4 backdrop-blur">
                    <MobileSidebar />
                </div>
                <div className="p-4 lg:p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
