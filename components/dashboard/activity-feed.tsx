import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClientFormattedDate } from "@/components/ui/client-formatted-date";

interface Document {
  id: string;
  fileName: string;
  status: string;
  processedAt: Date;
  client: {
    name: true;
  } | any;
}

export function ActivityFeed({ documents }: { documents: Document[] }) {
  return (
    <div className="rounded-md border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Archivo</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No hay actividad reciente.
              </TableCell>
            </TableRow>
          ) : (
            documents.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium max-w-[200px] truncate" title={item.fileName}>
                  {item.fileName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.client?.name || "N/A"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={item.status === "PROCESSED" ? "default" : "destructive"}
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-xs">
                  <ClientFormattedDate
                    date={item.processedAt}
                    options={{
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
