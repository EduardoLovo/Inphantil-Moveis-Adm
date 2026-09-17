"use client";

import * as React from "react";
import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createUploadSignature } from "@/app/actions/upload";
import {
  ACCEPTED_IMAGE_TYPES,
  imageFileSchema,
  uploadResultSchema,
  type UploadResult,
} from "@/lib/validators/image";

/**
 * Uploader reutilizável (drag & drop + preview).
 * Fluxo: valida no cliente → pede assinatura (Server Action) → envia ao
 * Cloudinary → devolve {url, publicId, ...} para o `onUploaded` persistir.
 */
export function ImageUploader({
  onUploaded,
  label = "Enviar imagem",
  disabled,
}: {
  onUploaded: (result: UploadResult) => void | Promise<void>;
  label?: string;
  disabled?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);

  async function handleFile(file: File) {
    const parsed = imageFileSchema.safeParse(file);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Arquivo inválido.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setBusy(true);

    try {
      const sig = await createUploadSignature();

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: "POST", body: form },
      );

      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.error?.message ?? "Falha no upload.");
      }

      const data = await res.json();
      const result = uploadResultSchema.parse({
        publicId: data.public_id,
        url: data.secure_url,
        bytes: data.bytes,
        format: data.format,
      });

      await onUploaded(result);
      toast.success("Imagem enviada.");
    } catch (err) {
      setPreview(null);
      toast.error(
        err instanceof Error ? err.message : "Não foi possível enviar.",
      );
    } finally {
      setBusy(false);
      URL.revokeObjectURL(localUrl);
    }
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled || busy}
        onClick={() => !busy && !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !busy && !disabled) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (disabled || busy) return;
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={cn(
          "relative grid min-h-44 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-input bg-muted/30 p-6 text-center transition-colors",
          dragging && "border-primary bg-primary/5",
          (disabled || busy) && "cursor-not-allowed opacity-60",
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Pré-visualização"
            className="max-h-40 rounded-lg object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadCloud className="size-8" />
            <p className="text-sm font-medium">
              Arraste uma imagem ou clique para selecionar
            </p>
            <p className="text-xs">JPG, PNG, WEBP ou AVIF · até 5 MB</p>
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 grid place-items-center rounded-xl bg-background/60 backdrop-blur-sm">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="size-4" />
        {label}
      </Button>
    </div>
  );
}
