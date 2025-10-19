import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="animate-spin mb-4">
        {/* Usando text-primary para a cor do ícone, conforme o sistema de temas */}
        <Loader2 className="w-12 h-12 text-primary" />
      </div>
      {/* Usando text-muted-foreground para o texto secundário */}
      <p className="text-muted-foreground text-lg">Carregando...</p>
    </div>
  );
}