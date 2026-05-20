"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function CredentialsForm() {
  const [isEditing, setIsEditing] = useState(false);
  const [clientId, setClientId] = useState("********-****-****-****-************");
  const [tenantId, setTenantId] = useState("********-****-****-****-************");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Credenciales actualizadas correctamente.");
    setIsEditing(false);
    setLoading(false);
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-1 text-xs font-mono text-muted-foreground bg-muted/50 p-3 rounded-md border border-border">
          <p>Client ID: {clientId}</p>
          <p>Tenant ID: {tenantId}</p>
        </div>
        <Button className="w-full" onClick={() => setIsEditing(true)}>Actualizar Credenciales</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="clientId">Client ID</Label>
        <Input 
          id="clientId" 
          value={clientId} 
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Ingrese su Client ID"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tenantId">Tenant ID</Label>
        <Input 
          id="tenantId" 
          value={tenantId} 
          onChange={(e) => setTenantId(e.target.value)}
          placeholder="Ingrese su Tenant ID"
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="w-full" onClick={() => setIsEditing(false)} disabled={loading}>
          Cancelar
        </Button>
        <Button className="w-full" onClick={handleSave} disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
