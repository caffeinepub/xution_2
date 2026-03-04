import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  ChevronDown,
  Key,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  Radio,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { BroadcastPriority, TransactionType } from "./backend.d";
import { useAuthContext } from "./hooks/useAuthContext";
import {
  useAddFacility,
  useBroadcasts,
  useCreateBroadcast,
  useFacilities,
  useGetPasswords,
  useIsAdmin,
  useMembers,
  useRemoveFacility,
  useSetPasswords,
  useTransactions,
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
import { formatDate } from "./utils/format";
import { isOfficeFacility, officeFacilityLocation } from "./utils/officeUtils";

// ── AccordionSection ─────────────────────────────────────────────────────────

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
      {/* Header */}
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

      {/* Body */}
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
    transactions?.filter((t) => Number(t.createdAt) > oneDayAgo) ?? [];
  const recentBc =
    broadcasts?.filter((b) => Number(b.createdAt) > oneDayAgo) ?? [];

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
              <p className="text-zinc-500 text-xs mt-0.5">{dateStr} · Auto</p>
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

// ── Office Selector ──────────────────────────────────────────────────────────

function AddOfficeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const addFacility = useAddFacility();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addFacility.mutateAsync({
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description.trim(),
        location: officeFacilityLocation(),
      });
      toast.success("Office added");
      onOpenChange(false);
      setName("");
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
          <DialogTitle className="text-primary font-display tracking-widest uppercase text-sm">
            Add Office
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="office-name"
              className="text-xs text-zinc-400 uppercase tracking-wider"
            >
              Office Name
            </Label>
            <Input
              id="office-name"
              data-ocid="office.name.input"
              placeholder="HQ, East Wing, Branch..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="office-description"
              className="text-xs text-zinc-400 uppercase tracking-wider"
            >
              Description{" "}
              <span className="text-zinc-600 normal-case">(optional)</span>
            </Label>
            <Textarea
              id="office-description"
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

function OfficeSelector() {
  const { data: facilities, isLoading } = useFacilities();
  const { data: isAdmin } = useIsAdmin();
  const removeFacility = useRemoveFacility();
  const { selectedOfficeId, setSelectedOfficeId } = useSelectedOffice();
  const [addOpen, setAddOpen] = useState(false);

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
                    {office.description && (
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
                  <button
                    type="button"
                    data-ocid={`office.delete_button.${idx + 1}`}
                    onClick={() => handleDelete(office.id)}
                    className="w-7 h-7 shrink-0 flex items-center justify-center rounded hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"
                    title="Remove office"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddOfficeDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

// ── About Section (editable) ─────────────────────────────────────────────────

const DEFAULT_ABOUT =
  "Xution is a private members organization management platform built on the Internet Computer. All data is stored on-chain for maximum security and availability.";

function AboutSection({ isAdmin }: { isAdmin: boolean }) {
  const [editing, setEditing] = useState(false);
  const [about, setAbout] = useState(DEFAULT_ABOUT);
  const [draft, setDraft] = useState(about);

  function handleSave() {
    setAbout(draft.trim() || DEFAULT_ABOUT);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(about);
    setEditing(false);
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
            >
              Save
            </Button>
            <Button
              data-ocid="about.cancel_button"
              size="sm"
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 h-7 text-xs"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <p className="text-zinc-400 text-sm leading-relaxed flex-1">
            {about}
          </p>
          {isAdmin && (
            <button
              data-ocid="about.edit_button"
              type="button"
              onClick={() => {
                setDraft(about);
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

// ── Features Section (editable) ──────────────────────────────────────────────

const DEFAULT_FEATURES = [
  "On-chain member management",
  "Secure direct messaging",
  "Facility booking & tracking",
  "Financial transactions",
  "Policy management",
  "Organization broadcasts",
  "QR ID card login",
];

function FeaturesSection({ isAdmin }: { isAdmin: boolean }) {
  const [editing, setEditing] = useState(false);
  const [features, setFeatures] = useState<string[]>(DEFAULT_FEATURES);
  const [draft, setDraft] = useState<string[]>(features);

  function handleSave() {
    const cleaned = draft.filter((f) => f.trim());
    setFeatures(cleaned.length > 0 ? cleaned : DEFAULT_FEATURES);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(features);
    setEditing(false);
  }

  return (
    <div className="space-y-3">
      {editing ? (
        <>
          <div className="space-y-2">
            {draft.map((f, idx) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: editing list, index is stable per session
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
            >
              Save
            </Button>
            <Button
              data-ocid="features.cancel_button"
              size="sm"
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 h-7 text-xs"
              onClick={handleCancel}
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
                  setDraft(features);
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
            These passwords allow access to the Xution platform. Default
            passwords are "bacon" and "leviathan".
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
    if (!title.trim() || !content.trim() || !authorId) return;
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
        <Radio className="w-4 h-4 text-primary" />
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
            createBroadcast.isPending ||
            !title.trim() ||
            !content.trim() ||
            !authorId
          }
          className="w-full bg-primary text-black hover:bg-primary/90"
        >
          {createBroadcast.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Radio className="mr-2 h-4 w-4" />
          )}
          Post Broadcast
        </Button>
      </form>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

function AppContent() {
  const { isAuthenticated, isRestoring, logout } = useAuthContext();
  const { data: isAdmin } = useIsAdmin();

  const [dmSheetOpen, setDmSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      {/* Root: pure black, full height */}
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col pb-[72px]">
        {/* ── Fixed top header ────────────────────────────────────── */}
        <header className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-zinc-900 flex items-center justify-between px-4 py-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-2xl tracking-[0.2em] uppercase text-primary font-display">
              XUTION
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 shadow-[0_0_6px_rgba(34,197,94,0.7)]" />
          </div>
          {/* Logout */}
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

        {/* ── Scrollable accordion main ───────────────────────────── */}
        <main className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {/* Activity Feed */}
          <AccordionSection
            title="Activity Feed (Last 24h)"
            titleColor="green"
            defaultOpen={true}
            ocid="accordion.activity_feed.toggle"
          >
            <ActivityFeed />
          </AccordionSection>

          {/* Office Selector */}
          <AccordionSection
            title="Office Selector"
            titleColor="gray"
            ocid="accordion.office_selector.toggle"
          >
            <OfficeSelector />
          </AccordionSection>

          {/* Members & Favourites */}
          <AccordionSection
            title="Members & Favourites"
            ocid="accordion.members.toggle"
          >
            <div className="-mx-4 -mb-4">
              <MembersPage />
            </div>
          </AccordionSection>

          {/* Facilities */}
          <AccordionSection
            title="Facilities"
            ocid="accordion.facilities.toggle"
          >
            <div className="-mx-4 -mb-4">
              <FacilitiesPage />
            </div>
          </AccordionSection>

          {/* About Xution */}
          <AccordionSection title="About Xution" ocid="accordion.about.toggle">
            <AboutSection isAdmin={isAdmin ?? false} />
          </AccordionSection>

          {/* Features & Credits */}
          <AccordionSection
            title="Features & Credits"
            ocid="accordion.features.toggle"
          >
            <FeaturesSection isAdmin={isAdmin ?? false} />
          </AccordionSection>

          {/* Policies */}
          <AccordionSection title="Policies" ocid="accordion.policies.toggle">
            <div className="-mx-4 -mb-4">
              <PoliciesPage />
            </div>
          </AccordionSection>
        </main>
      </div>

      {/* ── Fixed bottom bar ────────────────────────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-sm border-t border-zinc-900 px-4 py-2.5 flex items-center gap-2">
        {/* Copyright */}
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

        {/* Icon buttons */}
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

        {/* Contact Command pill */}
        <Button
          data-ocid="bottombar.contact_command_button"
          className="bg-primary text-black hover:bg-primary/90 h-9 px-4 rounded-full font-bold text-xs tracking-wide gap-1.5 shrink-0 shadow-[0_0_16px_oklch(0.78_0.17_75/0.3)]"
          onClick={() => window.open("mailto:Gameloverv@gmail.com", "_blank")}
        >
          <Mail className="w-3.5 h-3.5" />
          Contact Command
        </Button>
      </footer>

      {/* ── DM Sheet ───────────────────────────────────────────── */}
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

      {/* ── Settings Dialog ────────────────────────────────────── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent
          data-ocid="settings.dialog"
          className="bg-[#111111] border-zinc-800 text-white max-w-md max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-primary font-display tracking-widest uppercase text-sm flex items-center gap-2">
              <Key className="w-4 h-4" />
              Admin Settings
            </DialogTitle>
          </DialogHeader>

          {isAdmin ? (
            <div className="space-y-6">
              <PasswordManagementSection />
              <div className="border-t border-zinc-800 pt-4">
                <BroadcastSection />
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-2">
              <Settings className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-zinc-400 text-sm">Admin access required</p>
              <p className="text-zinc-600 text-xs">
                Only Class 6 administrators can manage settings.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <SelectedOfficeProvider>
      <AppContent />
    </SelectedOfficeProvider>
  );
}
