'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navegacaoItems, gruposLabels } from '@/lib/mockData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MockDataBadge } from '@/components/ui/MockDataBadge';
import {
    LayoutDashboard,
    Brain,
    Users,
    Target,
    Search,
    Filter,
    Package,
    Heart,
    Mail,
    Share2,
    DollarSign,
    Truck,
    Database,
    TrendingUp,
    Zap,
    Menu,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    Brain,
    Users,
    Target,
    Search,
    Filter,
    Package,
    Heart,
    Mail,
    Share2,
    DollarSign,
    Truck,
    Database,
    TrendingUp,
};

const gruposOrdem = ['ceo', 'marketing', 'cro', 'crm', 'operacao', 'dados'] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();

    const itemsPorGrupo = gruposOrdem.reduce((acc, grupo) => {
        acc[grupo] = navegacaoItems.filter((item) => item.grupo === grupo);
        return acc;
    }, {} as Record<string, typeof navegacaoItems>);

    return (
        <ScrollArea className="h-full">
            <nav className="space-y-6 p-4">
                {gruposOrdem.map((grupo) => (
                    <div key={grupo}>
                        <h2 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                            {gruposLabels[grupo]}
                        </h2>
                        <ul className="space-y-1">
                            {itemsPorGrupo[grupo].map((item) => {
                                const Icon = iconMap[item.icone] || LayoutDashboard;
                                const isActive = pathname === item.href;

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={onNavigate}
                                            className={cn(
                                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                                                isActive
                                                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                                                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white'
                                            )}
                                        >
                                            <Icon className="h-4 w-4 flex-shrink-0" />
                                            <span className="flex-1 truncate">{item.titulo}</span>
                                            {item.isMockData && (
                                                <MockDataBadge variant="sidebar" />
                                            )}
                                            {item.badge && (
                                                <Badge
                                                    variant={item.badge === '!' ? 'destructive' : 'secondary'}
                                                    className="h-5 min-w-5 justify-center text-[10px]"
                                                >
                                                    {item.badge}
                                                </Badge>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}

                {/* Legend */}
                <div className="px-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                        <MockDataBadge variant="sidebar" />
                        <span>Developed by DeltaViz</span>
                    </div>
                </div>
            </nav>
        </ScrollArea>
    );
}

function SidebarHeader() {
    return (
        <div className="flex h-16 items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
                <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
                <h1 className="text-lg font-bold text-zinc-900 dark:text-white">Plataforma BI</h1>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-500">Farmácia Eficácia</p>
            </div>
        </div>
    );
}

// Mobile Sidebar (Drawer)
export function MobileSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 text-zinc-600 dark:text-zinc-400">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0">
                <SidebarHeader />
                <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}

// Desktop Sidebar (Fixed)
export function DesktopSidebar() {
    return (
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 lg:block">
            <SidebarHeader />
            <div className="h-[calc(100vh-4rem)]">
                <SidebarContent />
            </div>
        </aside>
    );
}

// Combined Sidebar Component
export function Sidebar() {
    return (
        <>
            <DesktopSidebar />
        </>
    );
}
