import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

interface PagePlaceholderProps {
    titulo: string;
    descricao: string;
}

export function PagePlaceholder({ titulo, descricao }: PagePlaceholderProps) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="border-zinc-800 bg-zinc-900/50 max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
                        <Construction className="h-6 w-6 text-yellow-500" />
                    </div>
                    <CardTitle className="text-xl text-white">{titulo}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-zinc-400">{descricao}</p>
                    <p className="mt-4 text-xs text-zinc-500">
                        Esta página será implementada em breve.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
