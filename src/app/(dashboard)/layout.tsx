import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AlertBanner } from '@/components/layout/AlertBanner';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Sidebar />
            <main className="flex-1 lg:pl-64">
                <AlertBanner />
                <Header />
                <div className="p-4 lg:p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
