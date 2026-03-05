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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  DollarSign,
  Key,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  QrCode,
  Radio as RadioIcon,
  Receipt,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserCog,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { BroadcastPriority, Role, TransactionType } from "./backend.d";
import type { Member } from "./backend.d";
import { AuthContextProvider, useAuthContext } from "./hooks/useAuthContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useAboutText,
  useAddFacility,
  useAddTransaction,
  useBroadcasts,
  useCreateBroadcast,
  useCreateMember,
  useDeleteMember,
  useFacilities,
  useFeaturesList,
  useGetContactEmail,
  useGetPasswords,
  useIsAdmin,
  useMembers,
  usePolicies,
  useRemoveFacility,
  useSetContactEmail,
  useSetMemberIdCard,
  useSetPasswords,
  useTransactions,
  useUpdateAboutText,
  useUpdateFeaturesList,
  useUpdateMember,
} from "./hooks/useQueries";
import { FacilitiesPage } from "./pages/FacilitiesPage";
import { LoginPage } from "./pages/LoginPage";
import { MembersPage } from "./pages/MembersPage";
import { MessagesPage } from "./pages/MessagesPage";
import { PoliciesPage } from "./pages/PoliciesPage";
import {
  SelectedOfficeProvider,
  useSelectedOffice,
} from "./utils/SelectedOfficeContext";
import { formatAmount, formatDate } from "./utils/format";
import {
  decodeMemberEmail,
  encodeMemberEmail,
  getClassLabel,
  getMemberClass,
  getMemberXut,
} from "./utils/memberClass";
import {
  isOfficeFacility,
  makeOfficeLocation,
  parseOfficeAddress,
} from "./utils/officeUtils";

// ── AccordionSection ──────────────────────────────────────────────────────────

interface AccordionSectionProps {
  title: string;
  titleColor?: "amber" | "green" | "gray";
  defaultOpen?: boolean;
  children: React.ReactNode;
  ocid: string;
}

function AccordionSection({
  title,
  titleColor = "amber",
  defaultOpen = false,
  children,
  ocid,
}: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const titleClass =
    titleColor === "green"
      ? "text-green-400"
      : titleColor === "gray"
        ? "text-zinc-500"
        : "text-primary";

  const borderClass =
    titleColor === "green"
      ? "border-green-500/60"
      : titleColor === "gray"
        ? "border-zinc-600/40"
        : "border-primary/70";

  return (
    <div
      className={`rounded-none border-l-[3px] bg-[#111111] ${borderClass} overflow-hidden`}
    >
      <button
        data-ocid={ocid}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span
          className={`font-bold text-sm tracking-wide uppercase ${titleClass}`}
        >
          {title}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
        >
          <ChevronDown
            className={`w-4 h-4 ${titleColor === "gray" ? "text-zinc-600" : titleColor === "green" ? "text-green-500" : "text-primary/80"}`}
          />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Activity Feed ─────────────────────────────────────────────────────────────

function ActivityFeed() {
  const { data: transactions, isLoading: loadingTx } = useTransactions();
  const { data: broadcasts, isLoading: loadingBc } = useBroadcasts();

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const recentTx =
    transactions?.filter(
      (t) => Number(t.createdAt) > oneDayAgo && t.memberId !== "__LOCKDOWN__",
    ) ?? [];
  const recentBc =
    broadcasts?.filter(
      (b) => Number(b.createdAt) > oneDayAgo && b.title !== "__LOCKDOWN__",
    ) ?? [];

  type ActivityItem = {
    id: string;
    title: string;
    ts: bigint;
    positive: boolean;
    isBroadcast?: boolean;
  };

  const items: ActivityItem[] = [
    ...recentTx.map((t) => ({
      id: t.id,
      title: t.description,
      ts: t.createdAt,
      positive:
        t.type === TransactionType.donation ||
        t.type === TransactionType.refund,
    })),
    ...recentBc.map((b) => ({
      id: b.id,
      title: b.title,
      ts: b.createdAt,
      positive: true,
      isBroadcast: true,
    })),
  ].sort((a, b) => Number(b.ts - a.ts));

  const isLoading = loadingTx || loadingBc;

  if (isLoading) {
    return (
      <div className="space-y-2" data-ocid="activity.loading_state">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="w-full h-12 rounded bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="text-zinc-500 text-sm py-3"
        data-ocid="activity.empty_state"
      >
        No activity in last 24h
      </div>
    );
  }

  return (
    <div className="space-y-0 divide-y divide-zinc-800/60">
      {items.map((item) => {
        const TrendIcon = item.positive ? TrendingUp : TrendingDown;
        const iconColor = item.positive ? "text-green-400" : "text-red-400";
        const infColor = item.positive ? "text-green-400" : "text-red-400";
        const dateStr = formatDate(item.ts);
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 py-2.5 first:pt-0"
          >
            <TrendIcon className={`w-4 h-4 shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className="text-primary text-sm font-medium truncate leading-tight">
                {item.title}
              </p>
              <p className="text-zinc-500 text-xs mt-0.5">
                {dateStr} · {item.isBroadcast ? "Broadcast" : "Transaction"}
              </p>
            </div>
            <span className={`text-base font-bold shrink-0 ${infColor}`}>
              ∞
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Office Selector ───────────────────────────────────────────────────────────

function AddOfficeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const addFacility = useAddFacility();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addFacility.mutateAsync({
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description.trim(),
        location: makeOfficeLocation(address),
      });
      toast.success("Office added");
      onOpenChange(false);
      setName("");
      setAddress("");
      setDescription("");
    } catch {
      toast.error("Failed to add office");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="office.add.dialog"
        className="sm:max-w-sm bg-[#111111] border-zinc-800 text-white"
      >
        <DialogHeader>
          <DialogTitle className="text-primary font-bold tracking-widest uppercase text-sm">
            Add Office
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Office Name
            </Label>
            <Input
              data-ocid="office.name.input"
              placeholder="HQ, East Wing, Branch..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Address{" "}
              <span className="text-zinc-600 normal-case">(optional)</span>
            </Label>
            <Input
              data-ocid="office.address.input"
              placeholder="123 Main St, City..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Description{" "}
              <span className="text-zinc-600 normal-case">(optional)</span>
            </Label>
            <Textarea
              data-ocid="office.description.textarea"
              placeholder="Brief description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              data-ocid="office.cancel_button"
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              data-ocid="office.submit_button"
              type="submit"
              size="sm"
              disabled={addFacility.isPending || !name.trim()}
              className="bg-primary text-black hover:bg-primary/90"
            >
              {addFacility.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add Office"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditOfficeDialog({
  open,
  onOpenChange,
  office,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  office: { id: string; name: string; location: string; description: string };
}) {
  const addFacility = useAddFacility();
  const removeFacility = useRemoveFacility();
  const currentAddress = parseOfficeAddress(office.location);
  const [name, setName] = useState(office.name);
  const [address, setAddress] = useState(currentAddress);
  const [description, setDescription] = useState(office.description);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      // Delete old + recreate with same ID (backend has no updateFacility)
      await removeFacility.mutateAsync(office.id);
      await addFacility.mutateAsync({
        id: office.id,
        name: name.trim(),
        description: description.trim(),
        location: makeOfficeLocation(address),
      });
      toast.success("Office updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update office");
    }
  }

  const isPending = addFacility.isPending || removeFacility.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="office.edit.dialog"
        className="sm:max-w-sm bg-[#111111] border-zinc-800 text-white"
      >
        <DialogHeader>
          <DialogTitle className="text-primary font-bold tracking-widest uppercase text-sm">
            Edit Office
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Office Name
            </Label>
            <Input
              data-ocid="office.edit.name.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Address
            </Label>
            <Input
              data-ocid="office.edit.address.input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              data-ocid="office.edit.cancel_button"
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              data-ocid="office.edit.save_button"
              type="submit"
              size="sm"
              disabled={isPending || !name.trim()}
              className="bg-primary text-black hover:bg-primary/90"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OfficeSelector({ isAdmin }: { isAdmin: boolean }) {
  const { data: facilities, isLoading } = useFacilities();
  const removeFacility = useRemoveFacility();
  const { selectedOfficeId, setSelectedOfficeId } = useSelectedOffice();
  const [addOpen, setAddOpen] = useState(false);
  const [editOffice, setEditOffice] = useState<{
    id: string;
    name: string;
    location: string;
    description: string;
  } | null>(null);

  const offices = (facilities ?? []).filter(isOfficeFacility);

  async function handleDelete(id: string) {
    try {
      await removeFacility.mutateAsync(id);
      if (selectedOfficeId === id) setSelectedOfficeId(null);
      toast.success("Office removed");
    } catch {
      toast.error("Failed to remove office");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((n) => (
          <Skeleton key={n} className="w-full h-10 rounded bg-zinc-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isAdmin && (
        <Button
          data-ocid="office.add_button"
          size="sm"
          variant="outline"
          className="w-full border-dashed border-primary/40 text-primary/70 hover:bg-primary/5 hover:border-primary/70 gap-1.5 h-8 text-xs"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Office
        </Button>
      )}

      {offices.length === 0 ? (
        <div
          className="text-zinc-600 text-sm py-2 text-center"
          data-ocid="office.empty_state"
        >
          {isAdmin
            ? "No offices yet — create one above"
            : "No offices available"}
        </div>
      ) : (
        <div className="space-y-1">
          {offices.map((office, idx) => {
            const isSelected = selectedOfficeId === office.id;
            const address = parseOfficeAddress(office.location);
            return (
              <div
                key={office.id}
                data-ocid={`office.item.${idx + 1}`}
                className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                  isSelected
                    ? "bg-primary/10 border border-primary/30"
                    : "border border-transparent hover:bg-zinc-800/50"
                }`}
              >
                <button
                  type="button"
                  className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                  onClick={() =>
                    setSelectedOfficeId(isSelected ? null : office.id)
                  }
                >
                  <Building2
                    className={`w-4 h-4 shrink-0 ${isSelected ? "text-primary" : "text-zinc-500"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm font-medium truncate block ${isSelected ? "text-primary" : "text-zinc-300"}`}
                    >
                      {office.name}
                    </span>
                    {address && (
                      <span className="text-xs text-zinc-600 truncate block flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 inline" />
                        {address}
                      </span>
                    )}
                    {!address && office.description && (
                      <span className="text-xs text-zinc-600 truncate block">
                        {office.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-primary/40 text-primary shrink-0"
                    >
                      Selected
                    </Badge>
                  )}
                </button>
                {isAdmin && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      data-ocid={`office.edit_button.${idx + 1}`}
                      onClick={() =>
                        setEditOffice({
                          id: office.id,
                          name: office.name,
                          location: office.location,
                          description: office.description,
                        })
                      }
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors"
                      title="Edit office"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      data-ocid={`office.delete_button.${idx + 1}`}
                      onClick={() => handleDelete(office.id)}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"
                      title="Remove office"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddOfficeDialog open={addOpen} onOpenChange={setAddOpen} />
      {editOffice && (
        <EditOfficeDialog
          open={!!editOffice}
          onOpenChange={(v) => {
            if (!v) setEditOffice(null);
          }}
          office={editOffice}
        />
      )}
    </div>
  );
}

// ── About Section ─────────────────────────────────────────────────────────────

const FALLBACK_ABOUT =
  "Xution is a private members organization management platform built on the Internet Computer. All data is stored on-chain for maximum security and availability.";

function AboutSection({ isAdmin }: { isAdmin: boolean }) {
  const { data: aboutText, isLoading } = useAboutText();
  const updateAboutText = useUpdateAboutText();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const displayText = aboutText || FALLBACK_ABOUT;

  async function handleSave() {
    const text = draft.trim() || FALLBACK_ABOUT;
    try {
      await updateAboutText.mutateAsync(text);
      toast.success("About text saved");
      setEditing(false);
    } catch {
      toast.error("Failed to save about text");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2" data-ocid="about.loading_state">
        <Skeleton className="w-full h-4 rounded bg-zinc-800" />
        <Skeleton className="w-4/5 h-4 rounded bg-zinc-800" />
        <Skeleton className="w-3/5 h-4 rounded bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {editing ? (
        <>
          <Textarea
            data-ocid="about.editor"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="bg-zinc-900 border-zinc-700 text-zinc-200 text-sm leading-relaxed"
          />
          <div className="flex gap-2">
            <Button
              data-ocid="about.save_button"
              size="sm"
              className="bg-primary text-black hover:bg-primary/90 h-7 text-xs"
              onClick={handleSave}
              disabled={updateAboutText.isPending}
            >
              {updateAboutText.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
            <Button
              data-ocid="about.cancel_button"
              size="sm"
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 h-7 text-xs"
              onClick={() => setEditing(false)}
              disabled={updateAboutText.isPending}
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <p className="text-zinc-400 text-sm leading-relaxed flex-1">
            {displayText}
          </p>
          {isAdmin && (
            <button
              data-ocid="about.edit_button"
              type="button"
              onClick={() => {
                setDraft(displayText);
                setEditing(true);
              }}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-800 text-zinc-600 hover:text-primary transition-colors"
              title="Edit about text"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Features Section ──────────────────────────────────────────────────────────

const FALLBACK_FEATURES = [
  "On-chain member management",
  "Secure direct messaging",
  "Facility booking & tracking",
  "Financial transactions",
  "Policy management",
  "Organization broadcasts",
  "QR ID card login",
];

function FeaturesSection({ isAdmin }: { isAdmin: boolean }) {
  const { data: featuresList, isLoading } = useFeaturesList();
  const updateFeaturesList = useUpdateFeaturesList();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);

  const features =
    featuresList && featuresList.length > 0 ? featuresList : FALLBACK_FEATURES;

  async function handleSave() {
    const cleaned = draft.filter((f) => f.trim());
    const toSave = cleaned.length > 0 ? cleaned : FALLBACK_FEATURES;
    try {
      await updateFeaturesList.mutateAsync(toSave);
      toast.success("Features saved");
      setEditing(false);
    } catch {
      toast.error("Failed to save features");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2" data-ocid="features.loading_state">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="w-full h-4 rounded bg-zinc-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {editing ? (
        <>
          <div className="space-y-2">
            {draft.map((f, idx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: editing list index is stable per session
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  data-ocid={`features.item.${idx + 1}`}
                  value={f}
                  onChange={(e) => {
                    const next = [...draft];
                    next[idx] = e.target.value;
                    setDraft(next);
                  }}
                  className="bg-zinc-900 border-zinc-700 text-zinc-200 text-sm h-8"
                />
                <button
                  type="button"
                  onClick={() => setDraft(draft.filter((_, i) => i !== idx))}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-dashed border-zinc-700 text-zinc-500 hover:bg-zinc-800 h-7 text-xs gap-1"
              onClick={() => setDraft([...draft, ""])}
              data-ocid="features.add_button"
            >
              <Plus className="w-3 h-3" /> Add Feature
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              data-ocid="features.save_button"
              size="sm"
              className="bg-primary text-black hover:bg-primary/90 h-7 text-xs"
              onClick={handleSave}
              disabled={updateFeaturesList.isPending}
            >
              {updateFeaturesList.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
            <Button
              data-ocid="features.cancel_button"
              size="sm"
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 h-7 text-xs"
              onClick={() => setEditing(false)}
              disabled={updateFeaturesList.isPending}
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <ul className="space-y-1.5 flex-1">
              {features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-zinc-400"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {isAdmin && (
              <button
                data-ocid="features.edit_button"
                type="button"
                onClick={() => {
                  setDraft([...features]);
                  setEditing(true);
                }}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-800 text-zinc-600 hover:text-primary transition-colors"
                title="Edit features"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-600 pt-1">
            Built with{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </>
      )}
    </div>
  );
}

// ── Broadcast Section ─────────────────────────────────────────────────────────

function BroadcastSection() {
  const { data: members } = useMembers();
  const { currentMemberId } = useAuthContext();
  const createBroadcast = useCreateBroadcast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<BroadcastPriority>(
    BroadcastPriority.normal,
  );

  const authorId = currentMemberId ?? members?.[0]?.id ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      await createBroadcast.mutateAsync({
        id: crypto.randomUUID(),
        title: title.trim(),
        content: content.trim(),
        authorId,
        priority,
      });
      toast.success("Broadcast posted");
      setTitle("");
      setContent("");
      setPriority(BroadcastPriority.normal);
    } catch {
      toast.error("Failed to post broadcast");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <RadioIcon className="w-4 h-4 text-primary" />
        <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono">
          Post Broadcast
        </span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
            Title
          </Label>
          <Input
            data-ocid="broadcast.title.input"
            placeholder="Broadcast title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-zinc-900 border-zinc-700 text-zinc-200"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
            Message
          </Label>
          <Textarea
            data-ocid="broadcast.content.textarea"
            placeholder="Broadcast message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            required
            className="bg-zinc-900 border-zinc-700 text-zinc-200"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
            Priority
          </Label>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as BroadcastPriority)}
          >
            <SelectTrigger
              data-ocid="broadcast.priority.select"
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={BroadcastPriority.normal}>Normal</SelectItem>
              <SelectItem value={BroadcastPriority.high}>High</SelectItem>
              <SelectItem value={BroadcastPriority.urgent}>Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          data-ocid="broadcast.submit_button"
          type="submit"
          disabled={
            createBroadcast.isPending || !title.trim() || !content.trim()
          }
          className="w-full bg-primary text-black hover:bg-primary/90"
        >
          {createBroadcast.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RadioIcon className="mr-2 h-4 w-4" />
          )}
          Post Broadcast
        </Button>
      </form>
    </div>
  );
}

// ── Lockdown Section ──────────────────────────────────────────────────────────

interface LockdownState {
  active: boolean;
  message: string;
  officeIds: string[];
}

function LockdownSection({
  lockdownState,
}: {
  lockdownState: LockdownState | null;
}) {
  const createBroadcast = useCreateBroadcast();
  const { data: facilities } = useFacilities();
  const { currentMemberId } = useAuthContext();
  const { data: members } = useMembers();
  const authorId = currentMemberId ?? members?.[0]?.id ?? "admin";

  const offices = (facilities ?? []).filter(isOfficeFacility);

  const [active, setActive] = useState(lockdownState?.active ?? false);
  const [message, setMessage] = useState(
    lockdownState?.message ?? "Lockdown in effect. Access restricted.",
  );
  const [selectedOfficeIds, setSelectedOfficeIds] = useState<string[]>(
    lockdownState?.officeIds ?? [],
  );

  function toggleOffice(id: string) {
    setSelectedOfficeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSave() {
    const payload: LockdownState = {
      active,
      message,
      officeIds: selectedOfficeIds,
    };
    try {
      await createBroadcast.mutateAsync({
        id: crypto.randomUUID(),
        title: "__LOCKDOWN__",
        content: JSON.stringify(payload),
        authorId,
        priority: BroadcastPriority.urgent,
      });
      toast.success(active ? "Lockdown activated" : "Lockdown deactivated");
    } catch {
      toast.error("Failed to update lockdown");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-red-400" />
          <span className="text-sm font-bold text-red-400 uppercase tracking-wide">
            Lockdown Control
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {active ? "Active" : "Inactive"}
          </span>
          <Switch
            data-ocid="lockdown.toggle"
            checked={active}
            onCheckedChange={setActive}
            className="data-[state=checked]:bg-red-600"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-400 uppercase tracking-wider">
          Lockdown Message
        </Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="bg-zinc-900 border-zinc-700 text-zinc-200 text-sm"
          data-ocid="lockdown.textarea"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-zinc-400 uppercase tracking-wider">
          Affected Offices
        </Label>
        <p className="text-xs text-zinc-600">
          Empty = all offices. Select specific offices to limit scope.
        </p>
        <div className="space-y-1">
          {offices.map((office) => (
            <label
              key={office.id}
              className="flex items-center gap-2 cursor-pointer py-1"
            >
              <input
                type="checkbox"
                checked={selectedOfficeIds.includes(office.id)}
                onChange={() => toggleOffice(office.id)}
                className="w-3.5 h-3.5 accent-red-500"
              />
              <span className="text-sm text-zinc-300">{office.name}</span>
            </label>
          ))}
          {offices.length === 0 && (
            <p className="text-xs text-zinc-600">
              No offices created yet — lockdown will apply globally.
            </p>
          )}
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={createBroadcast.isPending}
        data-ocid="lockdown.submit_button"
        className={`w-full ${active ? "bg-red-600 hover:bg-red-700 text-white" : "bg-zinc-700 hover:bg-zinc-600 text-zinc-200"}`}
      >
        {createBroadcast.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Lock className="mr-2 h-4 w-4" />
        )}
        {active ? "Activate Lockdown" : "Deactivate Lockdown"}
      </Button>
    </div>
  );
}

// ── Transaction type styles ───────────────────────────────────────────────────

const txTypeStyles: Record<TransactionType, string> = {
  [TransactionType.payment]: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  [TransactionType.refund]:
    "bg-green-500/15 text-green-400 border-green-500/30",
  [TransactionType.fee]:
    "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  [TransactionType.donation]: "bg-primary/15 text-primary border-primary/30",
};

// ── Add Transaction Dialog ────────────────────────────────────────────────────

function AddTransactionDialog({
  open,
  onOpenChange,
  defaultMemberId,
  paymentOnly,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultMemberId?: string;
  paymentOnly?: boolean;
}) {
  const addTx = useAddTransaction();
  const { data: members } = useMembers();
  const { data: facilities } = useFacilities();
  const [memberId, setMemberId] = useState(defaultMemberId ?? "");
  const [facilityId, setFacilityId] = useState<string>("none");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TransactionType>(TransactionType.payment);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId || !amount || !description.trim()) return;
    const amountCents = Math.round(Number.parseFloat(amount) * 100);
    if (Number.isNaN(amountCents) || amountCents <= 0) {
      toast.error("Invalid amount");
      return;
    }
    const facilityName =
      facilityId !== "none"
        ? facilities?.find((f) => f.id === facilityId)?.name
        : null;
    const locationLabel = facilityName
      ? `[Facility: ${facilityName}]`
      : "[Other]";
    try {
      await addTx.mutateAsync({
        id: crypto.randomUUID(),
        memberId,
        facilityId: facilityId === "none" ? null : facilityId,
        amount: BigInt(amountCents),
        description: `${locationLabel} ${description.trim()}`,
        type: paymentOnly ? TransactionType.payment : type,
      });
      toast.success("Transaction recorded");
      onOpenChange(false);
      setMemberId(defaultMemberId ?? "");
      setFacilityId("none");
      setAmount("");
      setDescription("");
      setType(TransactionType.payment);
    } catch {
      toast.error("Failed to add transaction");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="tx.add.dialog"
        className="sm:max-w-md bg-[#111111] border-zinc-800 text-white"
      >
        <DialogHeader>
          <DialogTitle className="text-primary font-bold tracking-widest uppercase text-sm">
            {paymentOnly ? "Add Payment" : "Add Transaction"}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">
            {paymentOnly
              ? "Record a payment for yourself."
              : "Record a new financial transaction."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!defaultMemberId && (
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">
                Member
              </Label>
              <Select value={memberId} onValueChange={setMemberId} required>
                <SelectTrigger
                  data-ocid="tx.member.select"
                  className="bg-zinc-900 border-zinc-700 text-zinc-200"
                >
                  <SelectValue placeholder="Select member..." />
                </SelectTrigger>
                <SelectContent>
                  {members?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Facility{" "}
              <span className="text-zinc-600 normal-case">(optional)</span>
            </Label>
            <Select value={facilityId} onValueChange={setFacilityId}>
              <SelectTrigger
                data-ocid="tx.facility.select"
                className="bg-zinc-900 border-zinc-700 text-zinc-200"
              >
                <SelectValue placeholder="None (Other)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Other)</SelectItem>
                {facilities
                  ?.filter((f) => !isOfficeFacility(f))
                  .map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">
                Amount ($)
              </Label>
              <Input
                data-ocid="tx.amount.input"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-700 text-zinc-200"
              />
            </div>
            {!paymentOnly && (
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 uppercase tracking-wider">
                  Type
                </Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as TransactionType)}
                >
                  <SelectTrigger
                    data-ocid="tx.type.select"
                    className="bg-zinc-900 border-zinc-700 text-zinc-200"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TransactionType.payment}>
                      Payment
                    </SelectItem>
                    <SelectItem value={TransactionType.refund}>
                      Refund
                    </SelectItem>
                    <SelectItem value={TransactionType.fee}>Fee</SelectItem>
                    <SelectItem value={TransactionType.donation}>
                      Donation
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Description
            </Label>
            <Input
              data-ocid="tx.description.input"
              placeholder="Monthly membership dues..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              data-ocid="tx.cancel_button"
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              data-ocid="tx.submit_button"
              type="submit"
              size="sm"
              disabled={
                addTx.isPending ||
                (!defaultMemberId && !memberId) ||
                !description.trim() ||
                !amount
              }
              className="bg-primary text-black hover:bg-primary/90"
            >
              {addTx.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Record"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── My Transactions Section ───────────────────────────────────────────────────

function MyTransactionsSection({
  currentMemberId,
}: { currentMemberId: string | null }) {
  const { data: transactions, isLoading } = useTransactions();
  const { data: facilities } = useFacilities();
  const [addOpen, setAddOpen] = useState(false);

  const facilityMap = Object.fromEntries(
    (facilities ?? []).map((f) => [f.id, f.name]),
  );

  const sorted = (() => {
    if (!transactions) return [];
    const list = currentMemberId
      ? transactions.filter((tx) => tx.memberId === currentMemberId)
      : [...transactions];
    return list.sort((a, b) => Number(b.createdAt - a.createdAt));
  })();

  if (isLoading) {
    return (
      <div className="space-y-2" data-ocid="mytx.loading_state">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="w-full h-10 rounded bg-zinc-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {currentMemberId && (
        <Button
          data-ocid="mytx.add_button"
          size="sm"
          variant="outline"
          className="border-dashed border-primary/40 text-primary/70 hover:bg-primary/5 gap-1.5 h-8 text-xs"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Payment
        </Button>
      )}

      {!currentMemberId && (
        <div className="flex items-start gap-2 rounded bg-zinc-800/60 border border-zinc-700/40 px-3 py-2">
          <Receipt className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
          <p className="text-xs text-zinc-500 leading-relaxed">
            Log in via QR ID card to see and add personal transactions.
          </p>
        </div>
      )}

      {sorted.length === 0 ? (
        <div
          className="flex flex-col items-center gap-2 py-6 text-zinc-600"
          data-ocid="mytx.empty_state"
        >
          <Receipt className="w-8 h-8 opacity-40" />
          <p className="text-sm">No transactions yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <Table data-ocid="mytx.table">
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">
                  Date
                </TableHead>
                <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">
                  Description
                </TableHead>
                <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">
                  Location
                </TableHead>
                <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">
                  Type
                </TableHead>
                <TableHead className="text-zinc-500 text-xs uppercase tracking-wider text-right">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((tx, idx) => {
                const loc = tx.facilityId
                  ? (facilityMap[tx.facilityId] ?? "Unknown Facility")
                  : "Other";
                return (
                  <TableRow
                    key={tx.id}
                    data-ocid={`mytx.item.${idx + 1}`}
                    className="border-zinc-800/60 hover:bg-zinc-800/30 transition-colors"
                  >
                    <TableCell className="text-zinc-400 text-xs whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                    <TableCell className="text-zinc-300 text-sm max-w-[140px] truncate">
                      {tx.description}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-xs">
                      {loc}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${txTypeStyles[tx.type]}`}
                      >
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium text-zinc-200">
                      {formatAmount(tx.amount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {currentMemberId && (
        <AddTransactionDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          defaultMemberId={currentMemberId}
          paymentOnly
        />
      )}
    </div>
  );
}

// ── Global Transactions ───────────────────────────────────────────────────────

function GlobalTransactionsSection() {
  const { data: transactions, isLoading } = useTransactions();
  const { data: members } = useMembers();
  const { data: facilities } = useFacilities();
  const [addOpen, setAddOpen] = useState(false);
  const [filterOffice, setFilterOffice] = useState<string>("all");

  const memberMap = Object.fromEntries(
    (members ?? []).map((m) => [m.id, m.name]),
  );
  const facilityMap = Object.fromEntries(
    (facilities ?? []).map((f) => [f.id, f]),
  );
  const offices = (facilities ?? []).filter(isOfficeFacility);

  const sorted = (() => {
    if (!transactions) return [];
    let list = [...transactions];
    if (filterOffice !== "all") {
      // Filter by transactions whose facility belongs to the selected office
      list = list.filter((tx) => {
        if (!tx.facilityId) return filterOffice === "none";
        const fac = facilityMap[tx.facilityId];
        return fac?.location === `office:${filterOffice}`;
      });
    }
    return list.sort((a, b) => Number(b.createdAt - a.createdAt));
  })();

  if (isLoading) {
    return (
      <div className="space-y-2" data-ocid="globaltx.loading_state">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="w-full h-10 rounded bg-zinc-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={filterOffice} onValueChange={setFilterOffice}>
            <SelectTrigger
              data-ocid="globaltx.filter.select"
              className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-300 w-40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="none">No Location (Other)</SelectItem>
              {offices.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-zinc-600">
            {sorted.length} record{sorted.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button
          data-ocid="globaltx.add_button"
          size="sm"
          onClick={() => setAddOpen(true)}
          className="bg-primary text-black hover:bg-primary/90 h-7 text-xs gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Transaction
        </Button>
      </div>

      <AddTransactionDialog open={addOpen} onOpenChange={setAddOpen} />

      {sorted.length === 0 ? (
        <div
          className="flex flex-col items-center gap-2 py-6 text-zinc-600"
          data-ocid="globaltx.empty_state"
        >
          <Receipt className="w-8 h-8 opacity-40" />
          <p className="text-sm">No transactions recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <Table data-ocid="globaltx.table">
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">
                  Member
                </TableHead>
                <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">
                  Location
                </TableHead>
                <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">
                  Description
                </TableHead>
                <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">
                  Type
                </TableHead>
                <TableHead className="text-zinc-500 text-xs uppercase tracking-wider text-right">
                  Amount
                </TableHead>
                <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((tx, idx) => {
                const fac = tx.facilityId ? facilityMap[tx.facilityId] : null;
                const loc = fac ? fac.name : "Other";
                return (
                  <TableRow
                    key={tx.id}
                    data-ocid={`globaltx.item.${idx + 1}`}
                    className="border-zinc-800/60 hover:bg-zinc-800/30 transition-colors"
                  >
                    <TableCell className="font-medium text-zinc-200 text-sm">
                      {memberMap[tx.memberId] ?? tx.memberId}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-xs">
                      {loc}
                    </TableCell>
                    <TableCell className="text-zinc-300 text-sm max-w-[120px] truncate">
                      {tx.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize ${txTypeStyles[tx.type]}`}
                      >
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium text-zinc-200">
                      {formatAmount(tx.amount)}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-xs whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── Add Funds ─────────────────────────────────────────────────────────────────

function AddFundsSection() {
  const addTx = useAddTransaction();
  const { data: members } = useMembers();
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"add" | "remove">("add");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId || !amount) return;
    const amountCents = Math.round(Number.parseFloat(amount) * 100);
    if (Number.isNaN(amountCents) || amountCents <= 0) {
      toast.error("Invalid amount");
      return;
    }
    const isRemove = mode === "remove";
    const defaultNote = isRemove
      ? "Funds removed by admin"
      : "Funds added by admin";
    try {
      await addTx.mutateAsync({
        id: crypto.randomUUID(),
        memberId,
        facilityId: null,
        amount: BigInt(amountCents),
        description: `[Other] ${description.trim() || defaultNote}`,
        type: isRemove ? TransactionType.payment : TransactionType.donation,
      });
      toast.success(isRemove ? "Funds removed" : "Funds added");
      setMemberId("");
      setAmount("");
      setDescription("");
    } catch {
      toast.error(isRemove ? "Failed to remove funds" : "Failed to add funds");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-green-400" />
        <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono">
          Manage Funds
        </span>
      </div>
      {/* Mode toggle */}
      <div className="flex gap-1 bg-zinc-900 rounded p-1">
        <button
          type="button"
          data-ocid="funds.add.toggle"
          onClick={() => setMode("add")}
          className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
            mode === "add"
              ? "bg-green-700 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Add Funds
        </button>
        <button
          type="button"
          data-ocid="funds.remove.toggle"
          onClick={() => setMode("remove")}
          className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
            mode === "remove"
              ? "bg-red-700 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Remove Funds
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
            Member
          </Label>
          <Select value={memberId} onValueChange={setMemberId} required>
            <SelectTrigger
              data-ocid="funds.member.select"
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            >
              <SelectValue placeholder="Select member..." />
            </SelectTrigger>
            <SelectContent>
              {members?.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
            Amount ($)
          </Label>
          <Input
            data-ocid="funds.amount.input"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="bg-zinc-900 border-zinc-700 text-zinc-200"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
            Note <span className="text-zinc-600 normal-case">(optional)</span>
          </Label>
          <Input
            data-ocid="funds.description.input"
            placeholder="Reason..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-zinc-900 border-zinc-700 text-zinc-200"
          />
        </div>
        <Button
          data-ocid="funds.submit_button"
          type="submit"
          disabled={addTx.isPending || !memberId || !amount}
          className={`w-full text-white ${
            mode === "remove"
              ? "bg-red-700 hover:bg-red-600"
              : "bg-green-700 hover:bg-green-600"
          }`}
        >
          {addTx.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DollarSign className="mr-2 h-4 w-4" />
          )}
          {mode === "remove" ? "Remove Funds" : "Add Funds"}
        </Button>
      </form>
    </div>
  );
}

// ── Member Management (in settings) ──────────────────────────────────────────

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
      <DialogContent
        data-ocid="settings.members.add.dialog"
        className="sm:max-w-md bg-[#111111] border-zinc-800 text-white"
      >
        <DialogHeader>
          <DialogTitle className="text-primary font-bold tracking-widest uppercase text-sm">
            {isEditing ? "Edit Member" : "Add Member"}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">
            {isEditing
              ? "Update member information."
              : "Add a new member to the organization."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Username
            </Label>
            <Input
              data-ocid="settings.members.name.input"
              placeholder="JaneDoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Class
            </Label>
            <select
              value={memberClass}
              onChange={(e) => setMemberClass(Number(e.target.value))}
              className="w-full h-9 px-3 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm"
              data-ocid="settings.members.class.select"
            >
              {[1, 2, 3, 4, 5, 6].map((c) => (
                <option key={c} value={c}>
                  Class {c}
                  {c >= 6 ? " (Admin)" : c === 5 ? " (Senior)" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-600">
              Class 6 = Admin. Only Class 6 can promote/demote members.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              QR Card{" "}
              <span className="text-zinc-600 normal-case">
                (auto-fills XUT#)
              </span>
            </Label>
            <input
              ref={qrInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleQrUpload}
              data-ocid="settings.members.qr_card.upload_button"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => qrInputRef.current?.click()}
              disabled={qrScanning}
              className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 gap-2"
            >
              {qrScanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4" />
              )}
              {qrScanning ? "Scanning..." : "Scan QR Card"}
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              XUT Number
            </Label>
            <Input
              data-ocid="settings.members.xut.input"
              placeholder="XUT-001"
              value={xutNumber}
              onChange={(e) => setXutNumber(e.target.value)}
              className="font-mono bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="settings.members.cancel_button"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              data-ocid="settings.members.submit_button"
              type="submit"
              disabled={isPending}
              className="bg-primary text-black hover:bg-primary/90"
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

function MemberManagementSection() {
  const { data: members, isLoading } = useMembers();
  const deleteMember = useDeleteMember();
  const [addOpen, setAddOpen] = useState(false);
  const [editMember, setEditMember] = useState<Member | undefined>();
  const [search, setSearch] = useState("");

  const PROTECTED_NAMES = ["unity", "syndelious"];

  async function handleDelete(member: Member) {
    if (PROTECTED_NAMES.includes(member.name.toLowerCase())) {
      toast.error(`${member.name} cannot be deleted`);
      return;
    }
    try {
      await deleteMember.mutateAsync(member.id);
      toast.success("Member deleted");
    } catch {
      toast.error("Failed to delete member");
    }
  }

  const filtered = (members ?? []).filter((m) =>
    search.trim() ? m.name.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="space-y-3">
      <Button
        data-ocid="settings.members.add_button"
        size="sm"
        variant="outline"
        className="border-dashed border-primary/40 text-primary/70 hover:bg-primary/5 gap-1.5 h-8 text-xs"
        onClick={() => setAddOpen(true)}
      >
        <Plus className="w-3.5 h-3.5" />
        Add Member
      </Button>

      {/* Search */}
      <div className="relative">
        <X className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
        <input
          data-ocid="settings.members.search_input"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-8 pl-8 pr-3 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm"
        />
      </div>

      <MemberFormDialog open={addOpen} onOpenChange={setAddOpen} />
      {editMember && (
        <MemberFormDialog
          open={!!editMember}
          onOpenChange={(v) => {
            if (!v) setEditMember(undefined);
          }}
          editMember={editMember}
        />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="w-full h-10 bg-zinc-800" />
          ))}
        </div>
      ) : !members || members.length === 0 ? (
        <div
          className="text-zinc-600 text-sm py-4 text-center"
          data-ocid="settings.members.empty_state"
        >
          No members yet.
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((member, idx) => {
            const cls = getMemberClass(member);
            const xut = getMemberXut(member);
            const isProtected = PROTECTED_NAMES.includes(
              member.name.toLowerCase(),
            );
            return (
              <div
                key={member.id}
                data-ocid={`settings.members.item.${idx + 1}`}
                className="flex items-center gap-2 px-3 py-2 rounded bg-zinc-900/60 border border-zinc-800/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-200 font-medium truncate">
                      {member.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-zinc-700 text-zinc-500 shrink-0"
                    >
                      Class {cls}
                    </Badge>
                    {isProtected && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-primary/40 text-primary shrink-0"
                      >
                        Protected
                      </Badge>
                    )}
                  </div>
                  {xut && (
                    <span className="text-xs font-mono text-zinc-600">
                      {xut}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    data-ocid={`settings.members.edit_button.${idx + 1}`}
                    onClick={() => setEditMember(member)}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors"
                    title="Edit member"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {!isProtected ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          data-ocid={`settings.members.delete_button.${idx + 1}`}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"
                          title="Delete member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#111111] border-zinc-800 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-zinc-100">
                            Delete Member
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-zinc-500">
                            Remove {member.name}? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            data-ocid="settings.members.cancel_button"
                            className="border-zinc-700 text-zinc-300"
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            data-ocid="settings.members.confirm_button"
                            onClick={() => handleDelete(member)}
                            className="bg-red-600 text-white hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <div className="w-7 h-7" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Password Management ───────────────────────────────────────────────────────

function PasswordManagementSection() {
  const { data: passwords, isLoading } = useGetPasswords();
  const setPasswords = useSetPasswords();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  const loadedP1 = passwords?.[0] ?? "";
  const loadedP2 = passwords?.[1] ?? "";

  async function handleSaveP1() {
    try {
      await setPasswords.mutateAsync({ p1: p1 || loadedP1, p2: loadedP2 });
      toast.success("Password 1 updated");
      setP1("");
    } catch {
      toast.error("Failed to update password");
    }
  }

  async function handleSaveP2() {
    try {
      await setPasswords.mutateAsync({ p1: loadedP1, p2: p2 || loadedP2 });
      toast.success("Password 2 updated");
      setP2("");
    } catch {
      toast.error("Failed to update password");
    }
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="w-full h-10 bg-zinc-800" />
          <Skeleton className="w-full h-10 bg-zinc-800" />
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
              PASSWORD 1
            </Label>
            <div className="flex gap-2">
              <Input
                data-ocid="settings.password1.input"
                type="text"
                placeholder={
                  loadedP1 ? `Current: ${loadedP1}` : "Enter password 1"
                }
                value={p1}
                onChange={(e) => setP1(e.target.value)}
                className="font-mono bg-zinc-900 border-zinc-700 text-zinc-200"
              />
              <Button
                data-ocid="settings.password1.save_button"
                size="icon"
                variant="outline"
                onClick={handleSaveP1}
                disabled={setPasswords.isPending || !p1.trim()}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                {setPasswords.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
              PASSWORD 2
            </Label>
            <div className="flex gap-2">
              <Input
                data-ocid="settings.password2.input"
                type="text"
                placeholder={
                  loadedP2 ? `Current: ${loadedP2}` : "Enter password 2"
                }
                value={p2}
                onChange={(e) => setP2(e.target.value)}
                className="font-mono bg-zinc-900 border-zinc-700 text-zinc-200"
              />
              <Button
                data-ocid="settings.password2.save_button"
                size="icon"
                variant="outline"
                onClick={handleSaveP2}
                disabled={setPasswords.isPending || !p2.trim()}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                {setPasswords.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-zinc-600">
            These passwords grant access to Xution. Default: "bacon" and
            "leviathan".
          </p>
        </>
      )}
    </div>
  );
}

// ── Settings Sheet ────────────────────────────────────────────────────────────

function ContactEmailSection({ isAdmin }: { isAdmin: boolean }) {
  const { data: chainEmail, isLoading } = useGetContactEmail();
  const setContactEmailMutation = useSetContactEmail();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);

  const currentEmail = chainEmail ?? "Gameloverv@gmail.com";

  async function handleSave() {
    if (!draft.trim()) return;
    try {
      await setContactEmailMutation.mutateAsync(draft.trim());
      toast.success("Contact email updated");
      setEditing(false);
      setDraft("");
    } catch {
      toast.error("Failed to update contact email");
    }
  }

  if (isLoading) {
    return <Skeleton className="w-full h-10 bg-zinc-800" />;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
        Contact Command Email
      </p>
      {isAdmin ? (
        <>
          {editing ? (
            <div className="space-y-2">
              <Input
                data-ocid="settings.contact.input"
                type="email"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={currentEmail}
                className="bg-zinc-900 border-zinc-700 text-zinc-200"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-primary text-black hover:bg-primary/90 h-7 text-xs"
                  onClick={handleSave}
                  disabled={setContactEmailMutation.isPending || !draft.trim()}
                  data-ocid="settings.contact.save_button"
                >
                  {setContactEmailMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-7 text-xs"
                  onClick={() => {
                    setEditing(false);
                    setDraft("");
                  }}
                  data-ocid="settings.contact.cancel_button"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-zinc-300 text-sm flex-1 truncate">
                {currentEmail}
              </span>
              <button
                type="button"
                data-ocid="settings.contact.edit_button"
                onClick={() => {
                  setDraft(currentEmail);
                  setEditing(true);
                }}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-800 text-zinc-600 hover:text-primary"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-zinc-300 text-sm">{currentEmail}</p>
      )}
      <p className="text-xs text-zinc-600">
        The "Contact Command" button will open an email to this address.
        {!isAdmin && " Only admins can change this."}
      </p>
    </div>
  );
}

function SettingsSheetContent({
  isAdmin,
  lockdownState,
}: {
  isAdmin: boolean;
  lockdownState: LockdownState | null;
}) {
  const [activeTab, setActiveTab] = useState<
    | "contact"
    | "passwords"
    | "members"
    | "transactions"
    | "funds"
    | "lockdown"
    | "broadcasts"
  >("contact");

  const tabs = [
    { id: "contact" as const, label: "Contact", icon: Mail },
    ...(isAdmin
      ? [
          { id: "passwords" as const, label: "Passwords", icon: Key },
          { id: "members" as const, label: "Members", icon: UserCog },
          { id: "transactions" as const, label: "Transactions", icon: Receipt },
          { id: "funds" as const, label: "Funds", icon: DollarSign },
          { id: "broadcasts" as const, label: "Broadcasts", icon: RadioIcon },
          { id: "lockdown" as const, label: "Lockdown", icon: Lock },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab row */}
      <div className="border-b border-zinc-800 px-2 py-2 flex gap-1 flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            data-ocid={`settings.${id}.tab`}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === id
                ? "bg-primary/15 text-primary"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {activeTab === "contact" && <ContactEmailSection isAdmin={isAdmin} />}
          {activeTab === "passwords" && isAdmin && (
            <PasswordManagementSection />
          )}
          {activeTab === "members" && isAdmin && <MemberManagementSection />}
          {activeTab === "transactions" && isAdmin && (
            <GlobalTransactionsSection />
          )}
          {activeTab === "funds" && isAdmin && <AddFundsSection />}
          {activeTab === "broadcasts" && isAdmin && <BroadcastSection />}
          {activeTab === "lockdown" && isAdmin && (
            <LockdownSection lockdownState={lockdownState} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Main App Content ──────────────────────────────────────────────────────────

function AppContent() {
  const { isAuthenticated, isRestoring, logout, currentMemberId } =
    useAuthContext();
  const { data: isAdmin } = useIsAdmin();
  const { data: broadcasts } = useBroadcasts();
  const { data: members } = useMembers();
  const { data: transactions } = useTransactions();
  const { data: contactEmailData } = useGetContactEmail();
  const { selectedOfficeId } = useSelectedOffice();

  const [dmSheetOpen, setDmSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const contactEmail = contactEmailData ?? "Gameloverv@gmail.com";

  // Determine viewer's class level
  const viewerClass = (() => {
    if (isAdmin) return 6;
    if (currentMemberId && members) {
      const member = members.find((m) => m.id === currentMemberId);
      if (member) return getMemberClass(member);
    }
    return 1;
  })();

  // Lockdown detection
  const lockdownBroadcast = broadcasts?.find((b) => b.title === "__LOCKDOWN__");
  const lockdownState = lockdownBroadcast
    ? (() => {
        try {
          return JSON.parse(lockdownBroadcast.content) as LockdownState;
        } catch {
          return null;
        }
      })()
    : null;
  const isLockedDown =
    !isAdmin &&
    lockdownState?.active === true &&
    (lockdownState.officeIds.length === 0 ||
      lockdownState.officeIds.includes(selectedOfficeId ?? ""));

  if (isRestoring) {
    return (
      <div
        data-ocid="app.loading_state"
        className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-zinc-400 text-sm tracking-wide">
            Restoring session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col pb-[72px]">
        {/* Fixed top header */}
        <header className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-zinc-900 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-2xl tracking-[0.2em] uppercase text-primary font-display">
              XUTION
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 shadow-[0_0_6px_rgba(34,197,94,0.7)]" />
            {isLockedDown && (
              <Badge
                variant="outline"
                className="text-[10px] border-red-500/50 text-red-400 gap-1"
              >
                <Lock className="w-2.5 h-2.5" />
                LOCKDOWN
              </Badge>
            )}
          </div>
          <Button
            data-ocid="header.logout_button"
            variant="outline"
            size="sm"
            onClick={logout}
            className="border-primary/60 text-primary hover:bg-primary/10 hover:border-primary text-xs tracking-wide gap-1.5 h-8"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </Button>
        </header>

        {/* Lockdown banner */}
        {isLockedDown && lockdownState && (
          <div className="bg-red-900/20 border-b border-red-500/30 px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300 flex-1">
              <span className="font-bold">LOCKDOWN:</span>{" "}
              {lockdownState.message}
            </p>
          </div>
        )}

        {/* Scrollable accordion main */}
        <main className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {/* Member ID card + debit card — shown when logged in as a member */}
          {currentMemberId &&
            (() => {
              const currentMember = members?.find(
                (m) => m.id === currentMemberId,
              );
              if (!currentMember) return null;
              const isSpecial = ["unity", "syndelious"].includes(
                currentMember.name.toLowerCase(),
              );
              // Compute fund balance
              const balance = (() => {
                if (isSpecial) return null; // ∞
                const memberTxs = (transactions ?? []).filter(
                  (tx) =>
                    tx.memberId === currentMemberId &&
                    tx.memberId !== "__LOCKDOWN__",
                );
                let sum = 0;
                for (const tx of memberTxs) {
                  const amt = Number(tx.amount) / 100;
                  if (tx.type === "donation" || tx.type === "refund") {
                    sum += amt;
                  } else {
                    sum -= amt;
                  }
                }
                return sum;
              })();
              const cls = getMemberClass(currentMember);
              const xut = getMemberXut(currentMember);
              return (
                <div className="flex flex-col gap-2 pb-1">
                  {/* Physical ID card */}
                  <div
                    className="relative rounded overflow-hidden border border-zinc-700/60 bg-[#0d0d0d] flex items-center gap-3 p-3"
                    style={{
                      background:
                        "linear-gradient(135deg, #0d0d0d 0%, #1a1200 100%)",
                    }}
                  >
                    {currentMember.idCardImage ? (
                      <img
                        src={currentMember.idCardImage}
                        alt="ID Card"
                        className="w-14 h-10 object-cover rounded border border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-10 rounded border border-zinc-700 bg-zinc-900 flex items-center justify-center shrink-0">
                        <span className="text-zinc-600 text-xs font-mono">
                          ID
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-primary font-bold tracking-widest uppercase text-xs font-mono">
                        XUTION MEMBER
                      </p>
                      <p className="text-zinc-200 font-semibold text-sm truncate">
                        {currentMember.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-zinc-500 text-[10px] font-mono">
                          Class {cls}
                        </span>
                        {xut && (
                          <span className="text-zinc-600 text-[10px] font-mono">
                            {xut}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-1.5 right-2 opacity-20">
                      <span className="text-primary font-black text-[10px] tracking-[0.3em] uppercase">
                        XUTION
                      </span>
                    </div>
                  </div>

                  {/* Gold debit card */}
                  <div
                    className="relative rounded overflow-hidden p-3 flex items-center justify-between"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.55 0.14 75) 0%, oklch(0.45 0.16 60) 40%, oklch(0.60 0.18 80) 100%)",
                    }}
                  >
                    <div>
                      <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-black/70">
                        XUTION FUND BALANCE
                      </p>
                      <p className="text-black font-black text-xl font-mono">
                        {balance === null
                          ? "∞"
                          : new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 2,
                            }).format(Math.max(0, balance))}
                      </p>
                      <p className="text-black/70 text-xs font-medium mt-0.5">
                        {currentMember.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-black font-black tracking-[0.25em] text-sm">
                        XUTION
                      </p>
                      <div className="mt-1 flex gap-0.5 justify-end">
                        <div className="w-4 h-4 rounded-full bg-black/20" />
                        <div className="w-4 h-4 rounded-full bg-black/30 -ml-2" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Activity Feed — class 6 / admin only */}
          {isAdmin && (
            <AccordionSection
              title="Activity Feed (Last 24h)"
              titleColor="green"
              defaultOpen={true}
              ocid="accordion.activity_feed.toggle"
            >
              <ActivityFeed />
            </AccordionSection>
          )}

          <AccordionSection
            title="Office Selector"
            titleColor="gray"
            ocid="accordion.office_selector.toggle"
          >
            <OfficeSelector isAdmin={isAdmin ?? false} />
          </AccordionSection>

          <AccordionSection
            title="Members & Favourites"
            ocid="accordion.members.toggle"
          >
            <MembersPage viewerClass={viewerClass} />
          </AccordionSection>

          <AccordionSection
            title="Facilities"
            ocid="accordion.facilities.toggle"
          >
            <FacilitiesPage
              isAdmin={isAdmin ?? false}
              viewerClass={viewerClass}
              isLockedDown={isLockedDown}
              currentMemberId={currentMemberId}
            />
          </AccordionSection>

          <AccordionSection
            title="My Transactions"
            ocid="accordion.mytx.toggle"
          >
            <MyTransactionsSection currentMemberId={currentMemberId} />
          </AccordionSection>

          {isAdmin && (
            <AccordionSection
              title="Global Transactions"
              titleColor="green"
              ocid="accordion.globaltx.toggle"
            >
              <GlobalTransactionsSection />
            </AccordionSection>
          )}

          <AccordionSection title="About Xution" ocid="accordion.about.toggle">
            <AboutSection isAdmin={isAdmin ?? false} />
          </AccordionSection>

          <AccordionSection
            title="Features & Credits"
            ocid="accordion.features.toggle"
          >
            <FeaturesSection isAdmin={isAdmin ?? false} />
          </AccordionSection>

          <AccordionSection title="Policies" ocid="accordion.policies.toggle">
            <PoliciesPage isAdmin={isAdmin ?? false} />
          </AccordionSection>
        </main>
      </div>

      {/* Fixed bottom bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-sm border-t border-zinc-900 px-4 py-2.5 flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-zinc-600 truncate">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400 transition-colors"
            >
              Built with ♥ using caffeine.ai
            </a>
          </p>
        </div>

        <button
          data-ocid="bottombar.dm_button"
          type="button"
          onClick={() => setDmSheetOpen(true)}
          className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:border-zinc-700 transition-colors shrink-0"
          title="Messages"
        >
          <MessageSquare className="w-4 h-4 text-zinc-400" />
        </button>

        <button
          data-ocid="bottombar.settings_button"
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:border-zinc-700 transition-colors shrink-0"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-zinc-400" />
        </button>

        <Button
          data-ocid="bottombar.contact_command_button"
          className="bg-primary text-black hover:bg-primary/90 h-9 px-4 rounded-full font-bold text-xs tracking-wide gap-1.5 shrink-0 shadow-[0_0_16px_oklch(0.78_0.17_75/0.3)]"
          onClick={() => window.open(`mailto:${contactEmail}`, "_blank")}
        >
          <Mail className="w-3.5 h-3.5" />
          Contact Command
        </Button>
      </footer>

      {/* DM Sheet */}
      <Sheet open={dmSheetOpen} onOpenChange={setDmSheetOpen}>
        <SheetContent
          data-ocid="messages.sheet"
          side="right"
          className="w-full sm:w-[600px] sm:max-w-[600px] bg-[#0d0d0d] border-zinc-800 p-0"
        >
          <SheetHeader className="px-5 py-4 border-b border-zinc-800">
            <SheetTitle className="text-primary font-display tracking-widest uppercase text-sm">
              Messages
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-64px)]">
            <div className="p-4">
              <MessagesPage />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Settings Sheet */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          data-ocid="settings.sheet"
          side="right"
          className="w-full sm:w-[500px] sm:max-w-[500px] bg-[#0d0d0d] border-zinc-800 p-0 flex flex-col"
        >
          <SheetHeader className="px-5 py-4 border-b border-zinc-800 shrink-0">
            <SheetTitle className="text-primary font-display tracking-widest uppercase text-sm flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <SettingsSheetContent
              isAdmin={isAdmin ?? false}
              lockdownState={lockdownState}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <AuthContextProvider>
      <SelectedOfficeProvider>
        <AppContent />
      </SelectedOfficeProvider>
    </AuthContextProvider>
  );
}
