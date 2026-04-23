import AdminLayout from "@/components/AdminLayout";
import { useGetCarrerasStats, useAdminListCarreras, usePublishChanges, getAdminListCarrerasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BookOpen, Building2, MapPin, Globe, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetCarrerasStats();
  const { data: carreras } = useAdminListCarreras({ page: 1, limit: 5 });
  const publish = usePublishChanges();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handlePublish = () => {
    publish.mutate(undefined, {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getAdminListCarrerasQueryKey() });
          toast({ title: "Cambios publicados", description: data.message });
        },
        onError: () => {
          toast({ title: "Error", description: "No se pudo publicar", variant: "destructive" });
        },
      }
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Panel de administracion</p>
          </div>
          <Button
            onClick={handlePublish}
            disabled={publish.isPending}
            className="gap-2"
            data-testid="button-publish"
          >
            <Upload className="w-4 h-4" />
            {publish.isPending ? "Publicando..." : "Publicar cambios"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { icon: BookOpen, label: "Carreras", value: stats?.totalCarreras, color: "text-blue-600 bg-blue-50" },
            { icon: Building2, label: "Universidades", value: stats?.totalUniversidades, color: "text-blue-600 bg-blue-50" },
            { icon: MapPin, label: "Regiones", value: stats?.totalRegiones, color: "text-green-600 bg-green-50" },
            { icon: Globe, label: "Areas", value: stats?.totalAreas, color: "text-orange-600 bg-orange-50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-card-border rounded-2xl p-4" data-testid={`stat-${stat.label.toLowerCase()}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {statsLoading ? "..." : stat.value ?? 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Areas breakdown */}
        {stats && stats.carrerasPorArea.length > 0 && (
          <div className="bg-card border border-card-border rounded-2xl p-5 mb-6">
            <h2 className="font-bold text-foreground mb-4">Carreras por area</h2>
            <div className="space-y-3">
              {stats.carrerasPorArea.map((item) => {
                const pct = stats.totalCarreras > 0 ? (item.count / stats.totalCarreras) * 100 : 0;
                return (
                  <div key={item.area} data-testid={`area-bar-${item.area.replace(/\s/g, "-").toLowerCase()}`}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-foreground">{item.area}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent carreras */}
        <div className="bg-card border border-card-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Carreras recientes</h2>
            <Link href="/admin/carreras" className="text-sm text-primary font-medium hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {carreras?.carreras.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground">{c.universidad}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.publicado ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                  {c.publicado ? "Publicada" : "Borrador"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
