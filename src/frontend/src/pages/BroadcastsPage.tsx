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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Radio } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { BroadcastPriority } from "../backend.d";
import {
  useBroadcasts,
  useCreateBroadcast,
  useIsAdmin,
  useMembers,
} from "../hooks/useQueries";
import { formatDateTime } from "../utils/format";

const priorityConfig: Record<
  BroadcastPriority,
  { label: string; cls: string; dot: string }
> = {
  [BroadcastPriority.urgent]: {
    label: "Urgent",
    cls: "bg-destructive/15 text-destructive border-destructive/30",
    dot: "bg-destructive",
  },
  [BroadcastPriority.high]: {
    label: "High",
    cls: "bg-warning/15 text-warning border-warning/30",
    dot: "bg-warning",
  },
  [BroadcastPriority.normal]: {
    label: "Normal",
    cls: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

function AddBroadcastDialog({
  open,
  onOpenChange,
  authorId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  authorId: string;
}) {
  const createBroadcast = useCreateBroadcast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<BroadcastPriority>(
    BroadcastPriority.normal,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      await createBroadcast.mutateAsync({
        id: crypto.randomUUID(),
        title,
        content,
        authorId: authorId || "system",
        priority,
      });
      toast.success("Broadcast sent");
      onOpenChange(false);
      setTitle("");
      setContent("");
      setPriority(BroadcastPriority.normal);
    } catch {
      toast.error("Failed to send broadcast");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Broadcast</DialogTitle>
          <DialogDescription>
            Send a message to all organization members.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="broadcast-title">Title</Label>
            <Input
              id="broadcast-title"
              placeholder="Important Update"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as BroadcastPriority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BroadcastPriority.normal}>Normal</SelectItem>
                <SelectItem value={BroadcastPriority.high}>High</SelectItem>
                <SelectItem value={BroadcastPriority.urgent}>Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="broadcast-content">Message</Label>
            <Textarea
              id="broadcast-content"
              placeholder="Your message to all members..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="broadcasts.submit_button"
              type="submit"
              disabled={createBroadcast.isPending}
            >
              {createBroadcast.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Broadcast
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BroadcastsPage() {
  const { data: broadcasts, isLoading } = useBroadcasts();
  const { data: members } = useMembers();
  const { data: isAdmin } = useIsAdmin();
  const [addOpen, setAddOpen] = useState(false);

  const memberMap = Object.fromEntries(
    members?.map((m) => [m.id, m.name]) ?? [],
  );
  const sorted = broadcasts
    ? [...broadcasts].sort((a, b) => Number(b.createdAt - a.createdAt))
    : [];

  // Find the first member as author placeholder
  const firstMemberId = members?.[0]?.id ?? "";

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
            Broadcasts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organization-wide announcements
          </p>
        </div>
        {isAdmin && (
          <Button
            data-ocid="broadcasts.add_button"
            onClick={() => setAddOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Broadcast
          </Button>
        )}
      </div>

      <AddBroadcastDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        authorId={firstMemberId}
      />

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((n) => (
            <Skeleton key={n} className="w-full h-28 rounded-xl" />
          ))
        ) : sorted.length === 0 ? (
          <div
            className="surface-elevated rounded-xl border border-border/50 py-14 flex flex-col items-center gap-3 text-muted-foreground"
            data-ocid="broadcasts.empty_state"
          >
            <Radio className="w-10 h-10 opacity-30" />
            <p className="text-sm">No broadcasts yet.</p>
          </div>
        ) : (
          sorted.map((b, idx) => {
            const pc = priorityConfig[b.priority];
            return (
              <motion.div
                key={b.id}
                data-ocid={`broadcasts.item.${idx + 1}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="surface-elevated rounded-xl border border-border/50 p-5 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 shrink-0 ${pc.dot}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">
                          {b.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${pc.cls}`}
                        >
                          {pc.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground/70 mt-2 leading-relaxed">
                        {b.content}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                  <span>By {memberMap[b.authorId] ?? b.authorId}</span>
                  <span>·</span>
                  <span>{formatDateTime(b.createdAt)}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
