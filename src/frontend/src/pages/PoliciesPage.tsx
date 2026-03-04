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
  ChevronDown,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
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
      <DialogContent
        data-ocid="policies.add.dialog"
        className="sm:max-w-lg bg-[#111111] border-zinc-800 text-white"
      >
        <DialogHeader>
          <DialogTitle className="text-primary">
            {isEditing ? "Edit Policy" : "Add Policy"}
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            {isEditing
              ? "Update policy details."
              : "Create a new organization policy."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="policy-title"
              className="text-zinc-400 text-xs uppercase tracking-wider"
            >
              Title
            </Label>
            <Input
              id="policy-title"
              data-ocid="policies.title.input"
              placeholder="Code of Conduct"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          </div>
          {!isEditing && (
            <div className="space-y-1.5">
              <Label
                htmlFor="policy-category"
                className="text-zinc-400 text-xs uppercase tracking-wider"
              >
                Category{" "}
                <span className="text-zinc-600 normal-case">(optional)</span>
              </Label>
              <Input
                id="policy-category"
                data-ocid="policies.category.input"
                placeholder="HR, Finance, Operations..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-zinc-200"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label
              htmlFor="policy-content"
              className="text-zinc-400 text-xs uppercase tracking-wider"
            >
              Content
            </Label>
            <Textarea
              id="policy-content"
              data-ocid="policies.content.textarea"
              placeholder="Policy details..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
              className="bg-zinc-900 border-zinc-700 text-zinc-200"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="policies.cancel_button"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              data-ocid="policies.submit_button"
              type="submit"
              disabled={isPending || !title.trim() || !content.trim()}
              className="bg-primary text-black hover:bg-primary/90"
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

  async function handleDelete() {
    try {
      await deactivate.mutateAsync(policy.id);
      toast.success("Policy deleted");
    } catch {
      toast.error("Failed to delete policy");
    }
  }

  return (
    <motion.div
      data-ocid={`policies.item.${index + 1}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-none border-l-[3px] border-primary/50 bg-[#111111] overflow-hidden"
    >
      <button
        type="button"
        className="w-full px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-zinc-200 text-sm">
                {policy.title}
              </span>
              {policy.category && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-zinc-700 text-zinc-500"
                >
                  {policy.category}
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-600 mt-0.5">
              Updated {formatDate(policy.updatedAt)}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-600 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
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
            <div className="px-4 pb-4 border-t border-zinc-800/60">
              <p className="text-sm text-zinc-400 leading-relaxed mt-3 whitespace-pre-wrap">
                {policy.content}
              </p>
              {isAdmin && (
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    data-ocid={`policies.edit_button.${index + 1}`}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="mr-1.5 h-3 w-3" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        data-ocid={`policies.delete_button.${index + 1}`}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
                        disabled={deactivate.isPending}
                      >
                        <Trash2 className="mr-1.5 h-3 w-3" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#111111] border-zinc-800 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-zinc-100">
                          Delete Policy
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500">
                          Delete "{policy.title}"? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          data-ocid="policies.cancel_button"
                          className="border-zinc-700 text-zinc-300"
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          data-ocid="policies.confirm_button"
                          onClick={handleDelete}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          Delete
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

      <PolicyFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editPolicy={policy}
      />
    </motion.div>
  );
}

export function PoliciesPage({ isAdmin }: { isAdmin: boolean }) {
  const { data: policies, isLoading } = usePolicies();
  const [addOpen, setAddOpen] = useState(false);

  // Only show active policies
  const activePolicies = (policies ?? []).filter((p) => p.active);

  return (
    <div className="space-y-3">
      {isAdmin && (
        <Button
          data-ocid="policies.add_button"
          size="sm"
          variant="outline"
          className="w-full border-dashed border-primary/40 text-primary/70 hover:bg-primary/5 hover:border-primary/70 gap-1.5 h-8 text-xs"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Policy
        </Button>
      )}

      <PolicyFormDialog open={addOpen} onOpenChange={setAddOpen} />

      {isLoading ? (
        <div className="space-y-2" data-ocid="policies.loading_state">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="w-full h-12 rounded bg-zinc-800" />
          ))}
        </div>
      ) : activePolicies.length === 0 ? (
        <div
          className="text-zinc-600 text-sm py-4 text-center"
          data-ocid="policies.empty_state"
        >
          <FileText className="w-8 h-8 opacity-20 mx-auto mb-2" />
          No policies yet.{isAdmin ? " Add your first one above." : ""}
        </div>
      ) : (
        <div className="space-y-1.5">
          {activePolicies.map((policy, idx) => (
            <PolicyItem
              key={policy.id}
              policy={policy}
              index={idx}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
