"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Role } from "@prisma/client";
import { Loader2, MoreHorizontal, Pencil, Plus, Power } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_LABEL } from "@/lib/roles";
import { createUserSchema, updateUserSchema } from "@/lib/validators/user";
import { cn } from "@/lib/utils";
import { createUser, setUserActive, updateUser } from "./actions";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

const ROLE_OPTIONS = [Role.SELLER, Role.ADMIN, Role.DEV];

const roleSelectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function UsersClient({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<UserRow | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(user: UserRow) {
    setEditing(user);
    setDialogOpen(true);
  }

  async function toggleActive(user: UserRow) {
    setBusyId(user.id);
    const res = await setUserActive(user.id, !user.isActive);
    setBusyId(null);
    if (res.ok) toast.success(user.isActive ? "Usuário desativado." : "Usuário ativado.");
    else toast.error(res.error);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Usuários ({users.length})</CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Novo usuário
        </Button>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.name}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (você)
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === Role.DEV ? "default" : "secondary"}>
                    {ROLE_LABEL[user.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "success" : "muted"}>
                    {user.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={busyId === user.id}>
                        {busyId === user.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="size-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(user)}>
                        <Pencil className="size-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleActive(user)}
                        disabled={user.id === currentUserId && user.isActive}
                        className={cn(user.isActive && "text-destructive focus:text-destructive")}
                      >
                        <Power className="size-4" />
                        {user.isActive ? "Desativar" : "Ativar"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <UserFormDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />
    </Card>
  );
}

type CreateForm = {
  name: string;
  email: string;
  password: string;
  role: Role;
};
type EditForm = {
  name: string;
  role: Role;
  isActive: boolean;
  password?: string;
};

function UserFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: UserRow | null;
}) {
  const isEdit = !!editing;
  const [pending, setPending] = React.useState(false);

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "", role: Role.SELLER },
  });
  const editForm = useForm<EditForm>({
    resolver: zodResolver(updateUserSchema.omit({ id: true })),
    defaultValues: {
      name: editing?.name ?? "",
      role: editing?.role ?? Role.SELLER,
      isActive: editing?.isActive ?? true,
      password: "",
    },
  });

  async function submitCreate(values: CreateForm) {
    setPending(true);
    const res = await createUser(values);
    setPending(false);
    if (res.ok) {
      toast.success("Usuário criado.");
      createForm.reset();
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
  }

  async function submitEdit(values: EditForm) {
    if (!editing) return;
    setPending(true);
    const res = await updateUser({ id: editing.id, ...values });
    setPending(false);
    if (res.ok) {
      toast.success("Alterações salvas.");
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados. Deixe a senha em branco para mantê-la."
              : "Preencha os dados. A senha inicial pode ser trocada depois."}
          </DialogDescription>
        </DialogHeader>

        {isEdit ? (
          <form onSubmit={editForm.handleSubmit(submitEdit)} className="space-y-4">
            <Field label="Nome" error={editForm.formState.errors.name?.message}>
              <Input {...editForm.register("name")} />
            </Field>
            <Field label="E-mail">
              <Input value={editing?.email} disabled readOnly />
            </Field>
            <Field label="Papel">
              <select className={roleSelectClass} {...editForm.register("role")}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Nova senha (opcional)"
              error={editForm.formState.errors.password?.message}
            >
              <Input
                type="password"
                placeholder="Deixe em branco para manter"
                {...editForm.register("password")}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...editForm.register("isActive")} />
              Usuário ativo
            </label>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={createForm.handleSubmit(submitCreate)} className="space-y-4">
            <Field label="Nome" error={createForm.formState.errors.name?.message}>
              <Input {...createForm.register("name")} />
            </Field>
            <Field label="E-mail" error={createForm.formState.errors.email?.message}>
              <Input type="email" {...createForm.register("email")} />
            </Field>
            <Field
              label="Senha inicial"
              error={createForm.formState.errors.password?.message}
            >
              <Input type="password" {...createForm.register("password")} />
            </Field>
            <Field label="Papel">
              <select className={roleSelectClass} {...createForm.register("role")}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
