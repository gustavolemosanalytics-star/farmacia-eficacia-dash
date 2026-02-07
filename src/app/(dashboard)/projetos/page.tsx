'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageFilters } from '@/components/ui/PageFilters';
import { FolderKanban, Plus, MoreVertical, Calendar, User, ArrowRight, ExternalLink } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface Project {
    id: string;
    name: string;
    description: string;
    status: 'Em andamento' | 'Concluído' | 'Planejamento';
    date: string;
    owner: string;
    category: string;
}

const initialProjects: Project[] = [
    {
        id: '1',
        name: 'Expansão Sudeste 2026',
        description: 'Análise de viabilidade e métricas de marketing para novas lojas físicas no Sudeste.',
        status: 'Em andamento',
        date: '15 Jan 2026',
        owner: 'Gustavo Lemos',
        category: 'Expansão'
    },
    {
        id: '2',
        name: 'Otimização de ROAS - Google Ads',
        description: 'Projeto focado em reduzir o CAC e aumentar a eficiência das campanhas de PMax.',
        status: 'Planejamento',
        date: '10 Jan 2026',
        owner: 'Equipe Marketing',
        category: 'Performance'
    },
    {
        id: '3',
        name: 'Migração GA4 -> Server Side',
        description: 'Implementação técnica de rastreamento no lado do servidor para maior precisão de dados.',
        status: 'Concluído',
        date: '05 Dez 2025',
        owner: 'Data Engineering',
        category: 'Dados'
    }
];

export default function ProjetosPage() {
    const [projects, setProjects] = useState<Project[]>(initialProjects);

    const getStatusColor = (status: Project['status']) => {
        switch (status) {
            case 'Em andamento': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'Concluído': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'Planejamento': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
        }
    };

    return (
        <div className="space-y-6">
            <PageFilters
                title="Projetos"
                description="Gerencie seus projetos analíticos e dashboards personalizados."
            >
                <Button className="gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 border-none">
                    <Plus className="h-4 w-4" />
                    Novo Projeto
                </Button>
            </PageFilters>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Card key={project.id} className="group overflow-hidden border-border bg-card hover:border-red-500/30 transition-all hover:shadow-lg hover:shadow-red-500/5">
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <Badge variant="outline" className={getStatusColor(project.status)}>
                                        {project.status}
                                    </Badge>
                                    <CardTitle className="text-xl group-hover:text-red-500 transition-colors">
                                        {project.name}
                                    </CardTitle>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Editar</DropdownMenuItem>
                                        <DropdownMenuItem>Duplicar</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-500">Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                                {project.description}
                            </p>

                            <div className="mt-6 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>Criado em {project.date}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>Resp: {project.owner}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0 border-t border-border/50 bg-zinc-50/50 dark:bg-zinc-900/20 px-6 py-4">
                            <Button variant="ghost" className="w-full justify-between gap-2 text-sm hover:bg-transparent hover:text-red-500 px-0 group/btn">
                                <span>Ver Detalhes</span>
                                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}

                {/* Create New Card (Empty State placeholder) */}
                <button className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border p-12 hover:border-red-500/50 hover:bg-red-500/5 transition-all group">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-red-500 group-hover:text-white transition-colors">
                        <Plus className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">Criar Novo Projeto</p>
                        <p className="text-xs text-muted-foreground mt-1">Combine métricas e crie visões exclusivas</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
