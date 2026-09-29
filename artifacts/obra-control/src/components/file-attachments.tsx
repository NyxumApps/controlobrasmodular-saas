import { useRef, useState } from "react";
import { Download, Eye, FileText, Image, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore, type Attachment } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, toApiError } from "@/lib/api";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export function FileAttachments({ incidentId, contractId, compact = false }: { incidentId?: string; contractId?: string; compact?: boolean }) {
  const { state, actions } = useStore();
  const { toast } = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const files = state.attachments.filter(file => incidentId ? file.incidentId === incidentId : file.contractId === contractId);

  const upload = async (file?: File) => {
    if (!file) return;
    if (!ALLOWED.has(file.type)) {
      toast({ title: "Tipo no permitido", description: "Usa JPG, PNG, WEBP o PDF." }); return;
    }
    if (file.size > MAX_SIZE) {
      toast({ title: "Archivo demasiado grande", description: "El tamaño máximo es 10 MB." }); return;
    }
    setUploading(true);
    try {
      await actions.uploadAttachment(file, { incidentId, contractId });
      toast({ title: "Archivo guardado", description: file.name });
    } catch (error) {
      toast({ title: "No se pudo cargar", description: error instanceof Error ? error.message : "Intenta nuevamente." });
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  // The API needs the session token, so files are fetched and handed to the
  // browser as a temporary local URL instead of linking to the API directly.
  const open = async (file: Attachment, download: boolean) => {
    const preview = download ? null : window.open("", "_blank");
    try {
      const response = await apiFetch(`/api/attachments/${file.id}/content`, { signal: AbortSignal.timeout(120_000) });
      const url = URL.createObjectURL(await response.blob());
      if (preview) preview.location.href = url;
      else {
        const link = document.createElement("a");
        link.href = url;
        link.download = file.fileName;
        link.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      preview?.close();
      const failure = toApiError(error);
      toast({ title: "No se pudo abrir el archivo", description: failure.message });
    }
  };

  const remove = async (file: Attachment) => {
    try {
      await actions.deleteAttachment(file.id);
      toast({ title: "Archivo eliminado" });
    } catch (error) {
      toast({ title: "No se pudo eliminar", description: error instanceof Error ? error.message : "Revisa tus permisos." });
    }
  };

  return (
    <div className="space-y-2">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={event => void upload(event.target.files?.[0])} />
      <Button type="button" size="sm" variant="outline" className="gap-2 border-dashed" disabled={uploading} onClick={() => input.current?.click()}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? "Cargando…" : compact ? "Adjuntar" : "Adjuntar foto o PDF"}
      </Button>
      {files.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {files.map(file => (
            <div key={file.id} className="flex min-w-0 items-center gap-2 rounded-md border bg-background p-2 text-xs">
              {file.contentType.startsWith("image/") ? <Image className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
              <span className="min-w-0 flex-1 truncate" title={file.fileName}>{file.fileName}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void open(file, false)} title="Vista previa"><Eye className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void open(file, true)} title="Descargar"><Download className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => void remove(file)} title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>
      )}
      {compact && files.length === 0 && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Paperclip className="h-3 w-3" /> Sin archivos</span>}
    </div>
  );
}