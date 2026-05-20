import { Globe, Activity, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { CredentialsForm } from "@/components/configuracion/credentials-form";

export default async function ConfigurationPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Configuración</h1>
        <p className="text-muted-foreground">
          Administra las preferencias del sistema e integraciones principales.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Microsoft Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Integración Microsoft 365
            </CardTitle>
            <CardDescription>
              Configura las credenciales de Azure AD para conectar OneDrive y Outlook.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin ? (
              <CredentialsForm />
            ) : (
              <div className="flex flex-col gap-1 text-xs font-mono text-muted-foreground bg-muted/50 p-3 rounded-md border border-border">
                <p>Client ID: Acceso restringido</p>
                <p>Tenant ID: Acceso restringido</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Section: System Audit */}
        {isAdmin && (
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Auditoría y Logs (Admin)
              </CardTitle>
              <CardDescription>
                Registro detallado de acciones realizadas por los usuarios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm p-4 rounded-lg border bg-muted/20">
                <p>Nivel de Log: <strong>Debug</strong></p>
                <p className="mt-2 text-xs opacity-80">Retención de registros: 90 días.</p>
                <Button variant="outline" className="mt-4 w-full">
                  Descargar Reporte
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Section: Key Management */}
        {isAdmin && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-muted-foreground" />
                Gestión de Claves y Secretos
              </CardTitle>
              <CardDescription>
                Mantenimiento de credenciales de seguridad del sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Rotación Automática</p>
                    <p className="text-xs text-muted-foreground">Renueva los secretos de Azure cada 30 días.</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
               </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
