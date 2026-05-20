import { Globe, Activity, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { CredentialsForm } from "@/components/configuracion/credentials-form";

export default async function ConfigurationPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Configuración
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm mt-1">
            Administra las preferencias del sistema e integraciones principales.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Microsoft Integration */}
        <Card className="border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-100">
              <Globe className="h-5 w-5 text-blue-500" />
              Integración Microsoft 365
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-1">
              Configura las credenciales de Azure AD para conectar OneDrive y Outlook.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin ? (
              <CredentialsForm />
            ) : (
              <div className="flex flex-col gap-1 text-[11px] font-mono text-zinc-500 bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-250/50 dark:border-zinc-850/50">
                <p>Client ID: Acceso restringido</p>
                <p>Tenant ID: Acceso restringido</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Section: System Audit */}
        {isAdmin && (
          <Card className="md:col-span-1 border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-100">
                <Activity className="h-5 w-5 text-emerald-500" />
                Auditoría y Logs (Admin)
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 mt-1">
                Registro detallado de acciones realizadas por los usuarios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/20">
                <p className="text-zinc-700 dark:text-zinc-300">Nivel de Log: <strong className="font-bold text-zinc-900 dark:text-zinc-100">Debug</strong></p>
                <p className="mt-2 text-xs text-zinc-450">Retención de registros: 90 días.</p>
                <Button variant="outline" className="mt-4 w-full rounded-xl font-semibold">
                  Descargar Reporte
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Section: Key Management */}
        {isAdmin && (
          <Card className="md:col-span-2 border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 shadow-sm rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-100">
                <Key className="h-5 w-5 text-zinc-500" />
                Gestión de Claves y Secretos
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 mt-1">
                Mantenimiento de credenciales de seguridad del sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/20">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Rotación Automática</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Renueva los secretos de Azure cada 30 días.</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-lg font-semibold">Configurar</Button>
               </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
