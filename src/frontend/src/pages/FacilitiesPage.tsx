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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  Image,
  Loader2,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FacilityStatus, TransactionType } from "../backend.d";
import type { Facility } from "../backend.d";
import { useAuthContext } from "../hooks/useAuthContext";
import {
  useAddFacility,
  useAddTransaction,
  useFacilities,
  useIsAdmin,
  useRemoveFacility,
} from "../hooks/useQueries";
import { useSelectedOffice } from "../utils/SelectedOfficeContext";
import {
  type FacilityItem,
  type SectorLogEntry,
  loadItems,
  loadLogs,
  saveItems,
  saveLogs,
} from "../utils/facilityMeta";
import { facilityForOfficeLocation } from "../utils/officeUtils";

// ── Add Facility Dialog ───────────────────────────────────────────────────────

function AddFacilityDialog({
  open,
  onOpenChange,
  officeId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  officeId: string;
}) {
  const addFacility = useAddFacility();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    // Encode image in description as JSON meta
    const meta = imageDataUrl ? `\n__FACILITYIMG__::${imageDataUrl}` : "";
    try {
      await addFacility.mutateAsync({
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description.trim() + meta,
        location: facilityForOfficeLocation(officeId),
      });
      toast.success("Facility added");
      onOpenChange(false);
      setName("");
      setDescription("");
      setImageDataUrl("");
    } catch {
      toast.error("Failed to add facility");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="facilities.add.dialog"
        className="sm:max-w-md bg-[#111111] border-zinc-800 text-white"
      >
        <DialogHeader>
          <DialogTitle className="text-primary text-sm font-bold uppercase tracking-widest">
            Add Facility
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">
            Register a new facility for this office.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Facility Name
            </Label>
            <Input
              data-ocid="facilities.name.input"
              placeholder="Cafeteria, Gym, Storage..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Description{" "}
              <span className="text-zinc-600 normal-case">(optional)</span>
            </Label>
            <Textarea
              data-ocid="facilities.description.textarea"
              placeholder="Brief description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Image{" "}
              <span className="text-zinc-600 normal-case">(optional)</span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            {imageDataUrl ? (
              <div className="relative">
                <img
                  src={imageDataUrl}
                  alt="Facility preview"
                  className="w-full h-24 object-cover rounded border border-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => setImageDataUrl("")}
                  className="absolute top-1 right-1 w-6 h-6 rounded bg-black/60 text-white flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-dashed border-zinc-700 text-zinc-500 hover:bg-zinc-800 gap-1.5"
                data-ocid="facilities.upload_button"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Image
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="facilities.cancel_button"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              data-ocid="facilities.submit_button"
              type="submit"
              disabled={addFacility.isPending || !name.trim()}
              className="bg-primary text-black hover:bg-primary/90"
            >
              {addFacility.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Facility
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Item Dialog ───────────────────────────────────────────────────────────────

function ItemDialog({
  open,
  onOpenChange,
  facilityId,
  editItem,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  facilityId: string;
  editItem?: FacilityItem;
  onSave: (items: FacilityItem[]) => void;
}) {
  const [name, setName] = useState(editItem?.name ?? "");
  const [description, setDescription] = useState(editItem?.description ?? "");
  const [price, setPrice] = useState(String(editItem?.price ?? ""));
  const [stock, setStock] = useState(String(editItem?.stock ?? ""));
  const [supply, setSupply] = useState(String(editItem?.supply ?? ""));
  const [imageDataUrl, setImageDataUrl] = useState(
    editItem?.imageDataUrl ?? "",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const existing = loadItems(facilityId);
    const newItem: FacilityItem = {
      id: editItem?.id ?? crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      imageDataUrl: imageDataUrl || undefined,
      price: Number(price) || 0,
      stock: Number(stock) || 0,
      supply: Number(supply) || 0,
    };
    const updated = editItem
      ? existing.map((it) => (it.id === editItem.id ? newItem : it))
      : [...existing, newItem];
    saveItems(facilityId, updated);
    onSave(updated);
    toast.success(editItem ? "Item updated" : "Item added");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="facilities.item.dialog"
        className="sm:max-w-md bg-[#111111] border-zinc-800 text-white"
      >
        <DialogHeader>
          <DialogTitle className="text-primary text-sm font-bold uppercase tracking-widest">
            {editItem ? "Edit Item" : "Add Item"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Name
            </Label>
            <Input
              data-ocid="facilities.item.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Coffee, Equipment..."
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
              placeholder="Item details..."
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">
                Price ($)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="bg-zinc-900 border-zinc-700 text-zinc-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">
                Stock
              </Label>
              <Input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="bg-zinc-900 border-zinc-700 text-zinc-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400 uppercase tracking-wider">
                Supply
              </Label>
              <Input
                type="number"
                min="0"
                value={supply}
                onChange={(e) => setSupply(e.target.value)}
                placeholder="0"
                className="bg-zinc-900 border-zinc-700 text-zinc-200"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Image{" "}
              <span className="text-zinc-600 normal-case">(optional)</span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            {imageDataUrl ? (
              <div className="relative w-24 h-16">
                <img
                  src={imageDataUrl}
                  alt="Item preview"
                  className="w-full h-full object-cover rounded border border-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => setImageDataUrl("")}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-dashed border-zinc-700 text-zinc-500 hover:bg-zinc-800 gap-1.5"
              >
                <Image className="w-3.5 h-3.5" />
                Upload Image
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              data-ocid="facilities.item.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              className="bg-primary text-black hover:bg-primary/90"
              data-ocid="facilities.item.submit_button"
            >
              {editItem ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Sector Log Post Dialog ────────────────────────────────────────────────────

function SectorLogPostDialog({
  open,
  onOpenChange,
  facilityId,
  authorId,
  authorName,
  viewerClass,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  facilityId: string;
  authorId: string;
  authorName: string;
  viewerClass: number;
  onSave: (logs: SectorLogEntry[]) => void;
}) {
  const [content, setContent] = useState("");
  const [classLevel, setClassLevel] = useState(viewerClass);
  const [mediaDataUrl, setMediaDataUrl] = useState<string>("");
  const [mediaType, setMediaType] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMediaDataUrl(reader.result as string);
      setMediaType(file.type);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const existing = loadLogs(facilityId);
    const entry: SectorLogEntry = {
      id: crypto.randomUUID(),
      content: content.trim(),
      mediaDataUrl: mediaDataUrl || undefined,
      mediaType: mediaType || undefined,
      authorId,
      authorName,
      classLevel,
      createdAt: Date.now(),
    };
    const updated = [...existing, entry];
    saveLogs(facilityId, updated);
    onSave(updated);
    toast.success("Sector log entry posted");
    onOpenChange(false);
    setContent("");
    setMediaDataUrl("");
    setMediaType("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="facilities.sectorlog.dialog"
        className="sm:max-w-md bg-[#111111] border-zinc-800 text-white"
      >
        <DialogHeader>
          <DialogTitle className="text-primary text-sm font-bold uppercase tracking-widest">
            Post to Sector Log
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">
            Log a message visible to members at or above the selected class.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Message
            </Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              required
              placeholder="Sector update..."
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
              data-ocid="facilities.sectorlog.textarea"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Visibility Class Level
            </Label>
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(Number(e.target.value))}
              className="w-full h-9 px-3 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm"
              data-ocid="facilities.sectorlog.select"
            >
              {[1, 2, 3, 4, 5, 6].map((c) => (
                <option key={c} value={c}>
                  Class {c}+ can see this
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-600">
              Members below Class {classLevel} will see [REDACTED]
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">
              Attachment{" "}
              <span className="text-zinc-600 normal-case">
                (image/video/audio, optional)
              </span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              className="hidden"
              onChange={handleFileUpload}
              data-ocid="facilities.sectorlog.upload_button"
            />
            {mediaDataUrl ? (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="truncate">Attachment ready ({mediaType})</span>
                <button
                  type="button"
                  onClick={() => {
                    setMediaDataUrl("");
                    setMediaType("");
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-dashed border-zinc-700 text-zinc-500 hover:bg-zinc-800 gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Attach Media
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              data-ocid="facilities.sectorlog.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!content.trim()}
              className="bg-primary text-black hover:bg-primary/90"
              data-ocid="facilities.sectorlog.submit_button"
            >
              Post
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Facility Card ─────────────────────────────────────────────────────────────

function FacilityCard({
  facility,
  index,
  isAdmin,
  viewerClass,
  isLockedDown,
  currentMemberId,
}: {
  facility: Facility;
  index: number;
  isAdmin: boolean;
  viewerClass: number;
  isLockedDown: boolean;
  currentMemberId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<FacilityItem[]>(() =>
    loadItems(facility.id),
  );
  const [logs, setLogs] = useState<SectorLogEntry[]>(() =>
    loadLogs(facility.id),
  );
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItem, setEditItem] = useState<FacilityItem | undefined>();
  const [sectorLogOpen, setSectorLogOpen] = useState(false);
  const addTransaction = useAddTransaction();
  const removeFacility = useRemoveFacility();

  // Parse display description vs facility image
  const rawDesc = facility.description ?? "";
  const [displayDesc, facilityImage] = (() => {
    const imgIdx = rawDesc.indexOf("\n__FACILITYIMG__::");
    if (imgIdx !== -1) {
      return [rawDesc.slice(0, imgIdx), rawDesc.slice(imgIdx + 17)];
    }
    return [rawDesc, ""];
  })();

  async function handleBuy(item: FacilityItem) {
    if (!currentMemberId) {
      toast.error("Log in with your QR ID card to purchase items");
      return;
    }
    if (isLockedDown) {
      toast.error("Purchasing is disabled during lockdown");
      return;
    }
    const isSoldOut = item.stock <= 0 || item.supply <= 0;
    if (isSoldOut) {
      toast.error("Item is sold out");
      return;
    }
    const amountCents = Math.round(item.price * 100);
    try {
      await addTransaction.mutateAsync({
        id: crypto.randomUUID(),
        memberId: currentMemberId,
        facilityId: facility.id,
        amount: BigInt(amountCents),
        description: `Purchased: ${item.name}`,
        type: TransactionType.payment,
      });
      // Update local stock
      const updated = items.map((it) =>
        it.id === item.id ? { ...it, stock: Math.max(0, it.stock - 1) } : it,
      );
      saveItems(facility.id, updated);
      setItems(updated);
      toast.success(`Purchased ${item.name}`);
    } catch {
      toast.error("Purchase failed");
    }
  }

  async function handleDeleteItem(itemId: string) {
    const updated = items.filter((it) => it.id !== itemId);
    saveItems(facility.id, updated);
    setItems(updated);
    toast.success("Item removed");
  }

  async function handleDeleteFacility() {
    try {
      await removeFacility.mutateAsync(facility.id);
      toast.success("Facility removed");
    } catch {
      toast.error("Failed to remove facility");
    }
  }

  const canPostLog = viewerClass >= 5;
  const authorName = "Member";

  return (
    <motion.div
      data-ocid={`facilities.item.${index + 1}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-none border-l-[3px] border-primary/50 bg-[#111111] overflow-hidden"
    >
      {/* Header */}
      <button
        type="button"
        className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {facilityImage ? (
            <img
              src={facilityImage}
              alt={facility.name}
              className="w-8 h-8 rounded object-cover shrink-0 border border-zinc-700"
            />
          ) : (
            <Building2 className="w-4 h-4 text-primary shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <span className="font-medium text-zinc-200 text-sm block truncate">
              {facility.name}
            </span>
            {displayDesc && (
              <span className="text-xs text-zinc-600 block truncate">
                {displayDesc}
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-600 shrink-0">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.22 }}
        >
          <ChevronDown className="w-4 h-4 text-zinc-600" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="border-t border-zinc-800/60 px-4 pb-4 pt-3 space-y-4">
              {/* Lockdown warning */}
              {isLockedDown && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Lockdown active — purchasing disabled
                </div>
              )}

              {/* ── Items section ──────────────────────────────────── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-primary/70" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Items
                    </span>
                  </div>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs border-dashed border-primary/40 text-primary/70 hover:bg-primary/5 gap-1"
                      onClick={() => setAddItemOpen(true)}
                      data-ocid="facilities.item.add_button"
                    >
                      <Plus className="w-3 h-3" />
                      Add Item
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-48">
                  {items.length === 0 ? (
                    <div
                      className="text-zinc-600 text-xs py-4 text-center"
                      data-ocid="facilities.items.empty_state"
                    >
                      No items yet{isAdmin ? " — add one above" : ""}
                    </div>
                  ) : (
                    <div className="space-y-1.5 pr-2">
                      {items.map((item) => {
                        const soldOut = item.stock <= 0 || item.supply <= 0;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-2.5 p-2 rounded bg-zinc-900/60 border border-zinc-800/50"
                          >
                            {item.imageDataUrl && (
                              <img
                                src={item.imageDataUrl}
                                alt={item.name}
                                className="w-8 h-8 rounded object-cover shrink-0 border border-zinc-700"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-zinc-200 font-medium truncate">
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="text-xs text-zinc-600 truncate">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-mono text-primary">
                                  ${item.price.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-zinc-600">
                                  Stock:{item.stock} Supply:{item.supply}
                                </span>
                                {soldOut && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] text-red-400 border-red-500/30 h-4 px-1"
                                  >
                                    SOLD OUT
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!soldOut && !isLockedDown && (
                                <Button
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-primary text-black hover:bg-primary/90 gap-1"
                                  onClick={() => handleBuy(item)}
                                  disabled={addTransaction.isPending}
                                  data-ocid="facilities.item.button"
                                >
                                  <ShoppingCart className="w-3 h-3" />
                                  Buy
                                </Button>
                              )}
                              {isAdmin && (
                                <>
                                  <button
                                    type="button"
                                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300"
                                    onClick={() => setEditItem(item)}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/10 text-zinc-600 hover:text-red-400"
                                    onClick={() => handleDeleteItem(item.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* ── Sector Log section ─────────────────────────────── */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Sector Log
                    </span>
                  </div>
                  {canPostLog && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs border-dashed border-zinc-600/40 text-zinc-500 hover:bg-zinc-800 gap-1"
                      onClick={() => setSectorLogOpen(true)}
                      data-ocid="facilities.sectorlog.open_modal_button"
                    >
                      <Plus className="w-3 h-3" />
                      Post
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-36">
                  {logs.length === 0 ? (
                    <div
                      className="text-zinc-700 text-xs py-3 text-center"
                      data-ocid="facilities.sectorlog.empty_state"
                    >
                      No sector log entries
                    </div>
                  ) : (
                    <div className="space-y-1.5 pr-2">
                      {[...logs]
                        .sort((a, b) => b.createdAt - a.createdAt)
                        .map((entry) => {
                          const canSee =
                            isAdmin || viewerClass >= entry.classLevel;
                          return (
                            <div
                              key={entry.id}
                              className="p-2 rounded bg-zinc-900/40 border border-zinc-800/40 text-xs"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-zinc-500 font-mono">
                                  {entry.authorName}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] border-zinc-700 text-zinc-600 px-1 h-3.5"
                                  >
                                    Class {entry.classLevel}+
                                  </Badge>
                                  <span className="text-zinc-700">
                                    {new Date(
                                      entry.createdAt,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              {canSee ? (
                                <>
                                  <p className="text-zinc-300 leading-relaxed">
                                    {entry.content}
                                  </p>
                                  {entry.mediaDataUrl &&
                                    entry.mediaType?.startsWith("image/") && (
                                      <img
                                        src={entry.mediaDataUrl}
                                        alt="Attachment"
                                        className="mt-1.5 max-h-20 rounded border border-zinc-700 object-contain"
                                      />
                                    )}
                                  {entry.mediaDataUrl &&
                                    entry.mediaType?.startsWith("video/") && (
                                      // biome-ignore lint/a11y/useMediaCaption: user-uploaded video, captions not available
                                      <video
                                        src={entry.mediaDataUrl}
                                        controls
                                        className="mt-1.5 max-h-24 rounded w-full"
                                      />
                                    )}
                                  {entry.mediaDataUrl &&
                                    entry.mediaType?.startsWith("audio/") && (
                                      // biome-ignore lint/a11y/useMediaCaption: user-uploaded audio, captions not available
                                      <audio
                                        src={entry.mediaDataUrl}
                                        controls
                                        className="mt-1.5 w-full"
                                      />
                                    )}
                                </>
                              ) : (
                                <p className="text-zinc-700 italic">
                                  [REDACTED — Class {entry.classLevel} Required]
                                </p>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Admin: Delete Facility */}
              {isAdmin && (
                <div className="flex justify-end pt-1 border-t border-zinc-800/40">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-red-400 hover:bg-red-500/10 gap-1"
                        data-ocid={`facilities.delete_button.${index + 1}`}
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove Facility
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#111111] border-zinc-800 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-zinc-100">
                          Remove Facility
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500">
                          Remove "{facility.name}"? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          data-ocid="facilities.cancel_button"
                          className="border-zinc-700 text-zinc-300"
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          data-ocid="facilities.confirm_button"
                          onClick={handleDeleteFacility}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <ItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        facilityId={facility.id}
        onSave={setItems}
      />
      {editItem && (
        <ItemDialog
          open={!!editItem}
          onOpenChange={(v) => {
            if (!v) setEditItem(undefined);
          }}
          facilityId={facility.id}
          editItem={editItem}
          onSave={(updated) => {
            setItems(updated);
            setEditItem(undefined);
          }}
        />
      )}
      <SectorLogPostDialog
        open={sectorLogOpen}
        onOpenChange={setSectorLogOpen}
        facilityId={facility.id}
        authorId={currentMemberId ?? "admin"}
        authorName={authorName}
        viewerClass={viewerClass}
        onSave={setLogs}
      />
    </motion.div>
  );
}

// ── Facilities Page ───────────────────────────────────────────────────────────

export function FacilitiesPage({
  isAdmin,
  viewerClass,
  isLockedDown,
  currentMemberId,
}: {
  isAdmin: boolean;
  viewerClass: number;
  isLockedDown: boolean;
  currentMemberId: string | null;
}) {
  const { data: facilities, isLoading } = useFacilities();
  const { selectedOfficeId } = useSelectedOffice();
  const [addOpen, setAddOpen] = useState(false);

  const officeFacilities = selectedOfficeId
    ? (facilities ?? []).filter(
        (f) => f.location === `office:${selectedOfficeId}`,
      )
    : [];

  if (!selectedOfficeId) {
    return (
      <div
        className="py-8 flex flex-col items-center gap-2 text-zinc-600"
        data-ocid="facilities.empty_state"
      >
        <Building2 className="w-8 h-8 opacity-20" />
        <p className="text-sm text-center">
          Select an office above to view facilities
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2" data-ocid="facilities.loading_state">
        {[1, 2].map((n) => (
          <Skeleton key={n} className="w-full h-12 rounded bg-zinc-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isAdmin && (
        <Button
          data-ocid="facilities.add_button"
          size="sm"
          variant="outline"
          className="w-full border-dashed border-primary/40 text-primary/70 hover:bg-primary/5 hover:border-primary/70 gap-1.5 h-8 text-xs"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Facility
        </Button>
      )}

      {selectedOfficeId && (
        <AddFacilityDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          officeId={selectedOfficeId}
        />
      )}

      {officeFacilities.length === 0 ? (
        <div
          className="text-zinc-600 text-sm py-4 text-center"
          data-ocid="facilities.empty_state"
        >
          No facilities at this location.
          {isAdmin ? " Add one above." : ""}
        </div>
      ) : (
        <div className="space-y-1.5">
          {officeFacilities.map((facility, idx) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              index={idx}
              isAdmin={isAdmin}
              viewerClass={viewerClass}
              isLockedDown={isLockedDown}
              currentMemberId={currentMemberId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
