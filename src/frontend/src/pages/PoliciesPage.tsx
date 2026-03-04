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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Ban,
  ChevronDown,
  FileText,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Policy } from "../backend.d";
import {
  useAddPolicy,
  useDeactivatePolicy,
  useIsAdmin,
  usePolicies,
  useUpdatePolicy,
} from "../hooks/useQueries";
import { formatDate } from "../utils/format";

function PolicyFormDialog({
  open,
  onOpenChange,
  editPolicy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editPolicy?: Policy;
}) {
  const addPolicy = useAddPolicy();
  const updatePolicy = useUpdatePolicy();
  const [title, setTitle] = useState(editPolicy?.title ?? "");
  const [content, setContent] = useState(editPolicy?.content ?? "");
  const [category, setCategory] = useState(editPolicy?.category ?? "");

  const isEditing = !!editPolicy;
  const isPending = addPolicy.isPending || updatePolicy.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const safeCategory = category.trim() || "";
    try {
      if (isEditing) {
        await updatePolicy.mutateAsync({ id: editPolicy.id, title, content });
        toast.success("Policy updated");
      } else {
        await addPolicy.mutateAsync({
          id: crypto.randomUUID(),
          title: title.trim(),
          content: content.trim(),
          category: safeCategory,
        });
        toast.success("Policy added");
      }
      onOpenChange(false);
    } catch {
      toast.error(
        isEditing ? "Failed to update policy" : "Failed to add policy",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="policies.add.dialog" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Policy" : "Add Policy"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update policy details."
              : "Create a new organization policy."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="policy-title">Title</Label>
            <Input
              id="policy-title"
              data-ocid="policies.title.input"
              placeholder="Code of Conduct"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          {!isEditing && (
            <div className="space-y-1.5">
              <Label htmlFor="policy-category">
                Category{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="policy-category"
                data-ocid="policies.category.input"
                placeholder="HR, Finance, Operations..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="policy-content">Content</Label>
            <Textarea
              id="policy-content"
              data-ocid="policies.content.textarea"
              placeholder="Policy details..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="policies.cancel_button"
            >
              Cancel
            </Button>
            <Button
              data-ocid="policies.submit_button"
              type="submit"
              disabled={isPending || !title.trim() || !content.trim()}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Policy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PolicyItem({
  policy,
  index,
  isAdmin,
}: {
  policy: Policy;
  index: number;
  isAdmin: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const deactivate = useDeactivatePolicy();

  async function handleDeactivate() {
    try {
      await deactivate.mutateAsync(policy.id);
      toast.success("Policy deactivated");
    } catch {
      toast.error("Failed to deactivate policy");
    }
  }

  return (
    <motion.div
      data-ocid={`policies.item.${index + 1}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="surface-elevated rounded-xl border border-border/50 overflow-hidden"
    >
      <button
        type="button"
        className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-accent/30 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground">
                {policy.title}
              </span>
              {policy.category && (
                <Badge variant="outline" className="text-xs bg-accent/50">
                  {policy.category}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={
                  policy.active
                    ? "text-xs bg-success/15 text-success border-success/30"
                    : "text-xs bg-muted text-muted-foreground border-border"
                }
              >
                {policy.active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Updated {formatDate(policy.updatedAt)}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-4 border-t border-border/30">
              <p className="text-sm text-foreground/80 leading-relaxed mt-3 whitespace-pre-wrap">
                {policy.content}
              </p>
              {isAdmin && (
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    data-ocid={`policies.edit_button.${index + 1}`}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="mr-1.5 h-3 w-3" />
                    Edit
                  </Button>
                  {policy.active && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          data-ocid={`policies.deactivate_button.${index + 1}`}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                          disabled={deactivate.isPending}
                        >
                          <Ban className="mr-1.5 h-3 w-3" />
                          Deactivate
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deactivate Policy</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deactivate "{policy.title}"? This will mark it as
                            inactive.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-ocid="policies.cancel_button">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            data-ocid="policies.confirm_button"
                            onClick={handleDeactivate}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Deactivate
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PolicyFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editPolicy={policy}
      />
    </motion.div>
  );
}

export function PoliciesPage() {
  const { data: policies, isLoading } = usePolicies();
  const { data: isAdmin } = useIsAdmin();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
            Policies
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {policies?.length ?? 0} policies defined
          </p>
        </div>
        {isAdmin && (
          <Button
            data-ocid="policies.add_button"
            onClick={() => setAddOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Policy
          </Button>
        )}
      </div>

      <PolicyFormDialog open={addOpen} onOpenChange={setAddOpen} />

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((n) => (
            <Skeleton key={n} className="w-full h-16 rounded-xl" />
          ))
        ) : !policies || policies.length === 0 ? (
          <div
            className="surface-elevated rounded-xl border border-border/50 py-14 flex flex-col items-center gap-3 text-muted-foreground"
            data-ocid="policies.empty_state"
          >
            <FileText className="w-10 h-10 opacity-30" />
            <p className="text-sm">
              No policies yet.{isAdmin ? " Create your first one above." : ""}
            </p>
          </div>
        ) : (
          policies.map((policy, idx) => (
            <PolicyItem
              key={policy.id}
              policy={policy}
              index={idx}
              isAdmin={isAdmin ?? false}
            />
          ))
        )}
      </div>
    </div>
  );
}
