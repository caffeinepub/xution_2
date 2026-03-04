import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  ImageOff,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  Trash2,
  Upload,
  UserX,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { type Member, Role, Status } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateMember,
  useDeleteMember,
  useIsAdmin,
  useMembers,
  useSetMemberIdCard,
  useUpdateMember,
} from "../hooks/useQueries";
import { formatDate, truncatePrincipal } from "../utils/format";
import {
  decodeMemberEmail,
  encodeMemberEmail,
  getClassLabel,
  getMemberClass,
  getMemberXut,
} from "../utils/memberClass";

const statusStyles: Record<Status, string> = {
  [Status.active]: "bg-success/15 text-success border-success/30",
  [Status.inactive]: "bg-muted text-muted-foreground border-border",
  [Status.suspended]:
    "bg-destructive/15 text-destructive border-destructive/30",
};

const CLASS_COLORS: Record<number, string> = {
  1: "bg-zinc-700/50 text-zinc-300 border-zinc-600/40",
  2: "bg-blue-900/30 text-blue-300 border-blue-700/40",
  3: "bg-green-900/30 text-green-300 border-green-700/40",
  4: "bg-yellow-900/30 text-yellow-300 border-yellow-700/40",
  5: "bg-orange-900/30 text-orange-300 border-orange-700/40",
  6: "bg-primary/15 text-primary border-primary/30",
};

// ── QR decode helper ─────────────────────────────────────────────────────────

async function extractXutFromQr(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    interface BarcodeResult {
      rawValue: string;
    }
    interface BarcodeDetectorInstance {
      detect(image: ImageBitmap): Promise<BarcodeResult[]>;
    }
    interface BarcodeDetectorConstructor {
      new (options: { formats: string[] }): BarcodeDetectorInstance;
    }
    const BarcodeDetectorCtor = (globalThis as Record<string, unknown>)
      .BarcodeDetector as BarcodeDetectorConstructor | undefined;

    let qrText: string | null = null;
    if (BarcodeDetectorCtor) {
      const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
      const codes = await detector.detect(bitmap);
      if (codes.length > 0) {
        qrText = codes[0].rawValue.trim();
      }
    }
    bitmap.close();
    return qrText;
  } catch {
    return null;
  }
}

// ── Member Form Dialog ────────────────────────────────────────────────────────

function MemberFormDialog({
  open,
  onOpenChange,
  editMember,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editMember?: Member;
}) {
  const { identity } = useInternetIdentity();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();

  const decoded = editMember ? decodeMemberEmail(editMember.email) : null;

  const [username, setUsername] = useState(editMember?.name ?? "");
  const [memberClass, setMemberClass] = useState<number>(decoded?.class_ ?? 1);
  const [xutNumber, setXutNumber] = useState(decoded?.xutNumber ?? "");
  const [qrScanning, setQrScanning] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editMember;
  const isPending = createMember.isPending || updateMember.isPending;

  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrScanning(true);
    try {
      const text = await extractXutFromQr(file);
      if (text) {
        setXutNumber(text);
        toast.success(`XUT number extracted: ${text}`);
      } else {
        toast.error("No QR code found in image");
      }
    } catch {
      toast.error("Failed to read QR code");
    } finally {
      setQrScanning(false);
      if (qrInputRef.current) qrInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;

    const email = encodeMemberEmail(memberClass, xutNumber.trim());
    const role = memberClass >= 5 ? Role.admin : Role.member;

    try {
      if (isEditing) {
        await updateMember.mutateAsync({
          id: editMember.id,
          name: username,
          email,
          role,
        });
        toast.success("Member updated");
      } else {
        const principal = identity?.getPrincipal();
        if (!principal) {
          toast.error("Not authenticated");
          return;
        }
        await createMember.mutateAsync({
          id: crypto.randomUUID(),
          name: username,
          email,
          role,
          principal,
        });
        toast.success("Member added");
      }
      onOpenChange(false);
    } catch {
      toast.error(
        isEditing ? "Failed to update member" : "Failed to add member",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="members.add.dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Member" : "Add Member"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update member information."
              : "Add a new member to the organization."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="member-username">Username</Label>
            <Input
              id="member-username"
              data-ocid="members.name.input"
              placeholder="JaneDoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Class */}
          <div className="space-y-1.5">
            <Label>Class</Label>
            <Select
              value={String(memberClass)}
              onValueChange={(v) => setMemberClass(Number(v))}
            >
              <SelectTrigger data-ocid="members.class.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((c) => (
                  <SelectItem key={c} value={String(c)}>
                    Class {c}
                    {c >= 5 ? " (Admin)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Class 5–6 have admin privileges
            </p>
          </div>

          {/* QR Card upload */}
          <div className="space-y-1.5">
            <Label>QR Card (optional)</Label>
            <div className="flex gap-2 items-center">
              <input
                ref={qrInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleQrUpload}
                data-ocid="members.qr_card.upload_button"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => qrInputRef.current?.click()}
                disabled={qrScanning}
                className="gap-2"
              >
                {qrScanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                {qrScanning ? "Scanning..." : "Scan QR Card"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Auto-fills XUT number
              </p>
            </div>
          </div>

          {/* XUT Number */}
          <div className="space-y-1.5">
            <Label htmlFor="member-xut">XUT Number</Label>
            <Input
              id="member-xut"
              data-ocid="members.xut.input"
              placeholder="XUT-001"
              value={xutNumber}
              onChange={(e) => setXutNumber(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Automatically read from QR card, or enter manually
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="members.cancel_button"
            >
              Cancel
            </Button>
            <Button
              data-ocid="members.submit_button"
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── ID Card Dialog ────────────────────────────────────────────────────────────

function IdCardDialog({ member }: { member: Member }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setMemberIdCard = useSetMemberIdCard();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await setMemberIdCard.mutateAsync({
        memberId: member.id,
        imageDataUrl: dataUrl,
      });
      toast.success("ID card uploaded");
    } catch {
      toast.error("Failed to upload ID card");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-ocid="members.id_card.open_modal_button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          title="View/upload ID card"
        >
          <CreditCard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="members.id_card.dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ID Card — {member.name}</DialogTitle>
          <DialogDescription>
            View or upload the member's QR ID card image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {member.idCardImage ? (
            <div className="rounded-lg overflow-hidden border border-border/50">
              <img
                src={member.idCardImage}
                alt={`${member.name}'s ID card`}
                className="w-full h-auto max-h-64 object-contain bg-black/20"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 rounded-lg border border-dashed border-border/50 text-muted-foreground">
              <ImageOff className="w-8 h-8 opacity-30" />
              <p className="text-sm">No ID card uploaded yet</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={handleFileChange}
            data-ocid="members.id_card.upload_button"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="members.id_card.close_button"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              data-ocid="members.id_card.save_button"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {member.idCardImage ? "Replace Card" : "Upload Card"}
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Members Page ─────────────────────────────────────────────────────────────

export function MembersPage() {
  const { data: members, isLoading } = useMembers();
  const { data: isAdmin } = useIsAdmin();
  const deleteMember = useDeleteMember();
  const [addOpen, setAddOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | undefined>();

  async function handleDelete(id: string) {
    try {
      await deleteMember.mutateAsync(id);
      toast.success("Member deleted");
    } catch {
      toast.error("Failed to delete member");
    }
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
            Members
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {members?.length ?? 0} member{members?.length !== 1 ? "s" : ""} in
            organization
          </p>
        </div>
        {isAdmin && (
          <Button
            data-ocid="members.add_button"
            onClick={() => setAddOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      <MemberFormDialog open={addOpen} onOpenChange={setAddOpen} />
      <MemberFormDialog
        open={!!editMember}
        onOpenChange={(v) => {
          if (!v) setEditMember(undefined);
        }}
        editMember={editMember}
      />

      <div className="surface-elevated rounded-xl border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="w-full h-12 rounded-lg" />
            ))}
          </div>
        ) : !members || members.length === 0 ? (
          <div
            className="py-14 flex flex-col items-center gap-3 text-muted-foreground"
            data-ocid="members.empty_state"
          >
            <UserX className="w-10 h-10 opacity-30" />
            <p className="text-sm">
              No members yet.{isAdmin ? " Add your first member above." : ""}
            </p>
          </div>
        ) : (
          <Table data-ocid="members.table">
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  Username
                </TableHead>
                <TableHead className="text-muted-foreground">Class</TableHead>
                <TableHead className="text-muted-foreground">XUT #</TableHead>
                <TableHead className="text-muted-foreground">
                  Principal
                </TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">ID Card</TableHead>
                <TableHead className="text-muted-foreground">Joined</TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member, idx) => {
                const cls = getMemberClass(member);
                const xut = getMemberXut(member);
                const clsColor = CLASS_COLORS[cls] ?? CLASS_COLORS[1];
                return (
                  <motion.tr
                    key={member.id}
                    data-ocid={`members.item.${idx + 1}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-border/30 hover:bg-accent/30 transition-colors"
                  >
                    <TableCell className="font-medium text-foreground">
                      {member.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${clsColor}`}
                      >
                        {getClassLabel(cls)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {xut || <span className="opacity-40">—</span>}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {truncatePrincipal(member.principal.toString())}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusStyles[member.status]}
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.idCardImage ? (
                        <img
                          src={member.idCardImage}
                          alt="ID card thumbnail"
                          className="w-10 h-6 object-cover rounded border border-border/50"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">
                          No ID
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(member.joinedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IdCardDialog member={member} />
                        {isAdmin && (
                          <Button
                            data-ocid={`members.edit_button.${idx + 1}`}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setEditMember(member)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                data-ocid={`members.delete_button.${idx + 1}`}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Member
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {member.name}?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-ocid="members.cancel_button">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  data-ocid="members.confirm_button"
                                  onClick={() => handleDelete(member.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
