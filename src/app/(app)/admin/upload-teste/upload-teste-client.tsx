"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUploader } from "@/components/upload/image-uploader";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/reveal";
import type { UploadResult } from "@/lib/validators/image";
import { deleteImage, persistImage, replaceImage } from "./actions";

export type ImageRow = {
  id: string;
  url: string;
  publicId: string;
  createdAt: string;
};

export function UploadTesteClient({ images }: { images: ImageRow[] }) {
  const router = useRouter();

  async function handleCreate(result: UploadResult) {
    const res = await persistImage(result);
    if (res.ok) router.refresh();
    else toast.error(res.error);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Enviar imagem</CardTitle>
          <CardDescription>
            Envia ao Cloudinary (upload assinado) e grava só a URL + public_id.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader onUploaded={handleCreate} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Imagens salvas ({images.length})
        </h2>
        {images.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma imagem ainda. Envie a primeira ao lado.
            </CardContent>
          </Card>
        ) : (
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((img) => (
              <StaggerItem key={img.id}>
                <ImageCard image={img} onChanged={() => router.refresh()} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}

function ImageCard({
  image,
  onChanged,
}: {
  image: ImageRow;
  onChanged: () => void;
}) {
  const [replaceOpen, setReplaceOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function handleReplace(result: UploadResult) {
    const res = await replaceImage(image.id, result);
    if (res.ok) {
      toast.success("Imagem substituída. A anterior foi removida do Cloudinary.");
      setReplaceOpen(false);
      onChanged();
    } else {
      toast.error(res.error);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await deleteImage(image.id);
    setDeleting(false);
    if (res.ok) {
      toast.success("Imagem excluída do banco e do Cloudinary.");
      setDeleteOpen(false);
      onChanged();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-muted">
        <Image
          src={image.url}
          alt={image.publicId}
          fill
          sizes="(max-width: 640px) 100vw, 320px"
          className="object-cover"
        />
      </div>
      <CardContent className="space-y-3 p-4">
        <p className="truncate text-xs text-muted-foreground" title={image.publicId}>
          {image.publicId}
        </p>
        <div className="flex gap-2">
          {/* Substituir */}
          <Dialog open={replaceOpen} onOpenChange={setReplaceOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <RefreshCw className="size-4" />
                Substituir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Substituir imagem</DialogTitle>
                <DialogDescription>
                  A nova é enviada primeiro; só depois de gravar, a antiga é
                  apagada do Cloudinary.
                </DialogDescription>
              </DialogHeader>
              <ImageUploader onUploaded={handleReplace} label="Enviar nova imagem" />
            </DialogContent>
          </Dialog>

          {/* Excluir */}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Excluir imagem?</DialogTitle>
                <DialogDescription>
                  O registro e o arquivo no Cloudinary serão removidos. Ação
                  irreversível.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting && <Loader2 className="size-4 animate-spin" />}
                  Excluir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
