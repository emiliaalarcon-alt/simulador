import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-black text-primary mb-4">404</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Pagina no encontrada</h1>
        <p className="text-muted-foreground mb-6">Esta pagina no existe o fue movida.</p>
        <Link href="/">
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            Ir al simulador
          </Button>
        </Link>
      </div>
    </div>
  );
}
