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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Loader2, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { FacilityStatus } from "../backend.d";
import {
  useAddFacility,
  useFacilities,
  useIsAdmin,
  useRemoveFacility,
  useUpdateFacilityStatus,
} from "../hooks/useQueries";
import { useSelectedOffice } from "../utils/SelectedOfficeContext";
import { formatDate } from "../utils/format";
import {
  facilityForOfficeLocation,
  isFacilityForOffice,
} from "../utils/officeUtils";

const statusConfig: Record<FacilityStatus, { label: string; cls: string }> = {
  [FacilityStatus.available]: {
    label: "Available",
    cls: "bg-success/15 text-success border-success/30",
  },
  [FacilityStatus.inUse]: {
    label: "In Use",
    cls: "bg-warning/15 text-warning border-warning/30",
  },
  [FacilityStatus.maintenance]: {
    label: "Maintenance",
    cls: "bg-muted text-muted-foreground border-border",
  },
};

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addFacility.mutateAsync({
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description.trim(),
        location: facilityForOfficeLocation(officeId),
      });
      toast.success("Facility added");
      onOpenChange(false);
      setName("");
      setDescription("");
    } catch {
      toast.error("Failed to add facility");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="facilities.add.dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Facility</DialogTitle>
          <DialogDescription>
            Register a new facility for this office location.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="facility-name">Facility Name</Label>
            <Input
              id="facility-name"
              data-ocid="facilities.name.input"
              placeholder="Main Conference Room"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="facility-description">Description</Label>
            <Textarea
              id="facility-description"
              data-ocid="facilities.description.textarea"
              placeholder="Brief description of this facility..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="facilities.cancel_button"
            >
              Cancel
            </Button>
            <Button
              data-ocid="facilities.submit_button"
              type="submit"
              disabled={addFacility.isPending}
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

export function FacilitiesPage() {
  const { data: facilities, isLoading } = useFacilities();
  const { data: isAdmin } = useIsAdmin();
  const { selectedOfficeId } = useSelectedOffice();
  const updateStatus = useUpdateFacilityStatus();
  const removeFacility = useRemoveFacility();
  const [addOpen, setAddOpen] = useState(false);

  async function handleStatusChange(id: string, status: FacilityStatus) {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDelete(id: string) {
    try {
      await removeFacility.mutateAsync(id);
      toast.success("Facility removed");
    } catch {
      toast.error("Failed to remove facility");
    }
  }

  // Filter facilities for the selected office
  const officeFacilities = selectedOfficeId
    ? (facilities ?? []).filter((f) => isFacilityForOffice(f, selectedOfficeId))
    : [];

  if (!selectedOfficeId) {
    return (
      <div
        className="py-10 flex flex-col items-center gap-3 text-muted-foreground"
        data-ocid="facilities.empty_state"
      >
        <Building2 className="w-10 h-10 opacity-20" />
        <p className="text-sm text-center">
          Select an office above to view its facilities
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
            Facilities
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {officeFacilities.length} facilities at this location
          </p>
        </div>
        {isAdmin && (
          <Button
            data-ocid="facilities.add_button"
            onClick={() => setAddOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Facility
          </Button>
        )}
      </div>

      {selectedOfficeId && (
        <AddFacilityDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          officeId={selectedOfficeId}
        />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : officeFacilities.length === 0 ? (
        <div
          className="surface-elevated rounded-xl border border-border/50 py-14 flex flex-col items-center gap-3 text-muted-foreground"
          data-ocid="facilities.empty_state"
        >
          <Building2 className="w-10 h-10 opacity-30" />
          <p className="text-sm">
            No facilities at this location yet.
            {isAdmin ? " Add your first one above." : ""}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {officeFacilities.map((facility, idx) => (
            <motion.div
              key={facility.id}
              data-ocid={`facilities.item.${idx + 1}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="surface-elevated rounded-xl border border-border/50 p-5 flex flex-col gap-3 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {facility.name}
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${statusConfig[facility.status].cls}`}
                >
                  {statusConfig[facility.status].label}
                </Badge>
              </div>

              {facility.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {facility.description}
                </p>
              )}

              <div className="text-xs text-muted-foreground">
                Added {formatDate(facility.createdAt)}
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                <Select
                  value={facility.status}
                  onValueChange={(v) =>
                    handleStatusChange(facility.id, v as FacilityStatus)
                  }
                >
                  <SelectTrigger
                    data-ocid={`facilities.status.select.${idx + 1}`}
                    className="h-8 text-xs flex-1"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FacilityStatus.available}>
                      Available
                    </SelectItem>
                    <SelectItem value={FacilityStatus.inUse}>In Use</SelectItem>
                    <SelectItem value={FacilityStatus.maintenance}>
                      Maintenance
                    </SelectItem>
                  </SelectContent>
                </Select>

                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        data-ocid={`facilities.delete_button.${idx + 1}`}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Facility</AlertDialogTitle>
                        <AlertDialogDescription>
                          Remove "{facility.name}"? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-ocid="facilities.cancel_button">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          data-ocid="facilities.confirm_button"
                          onClick={() => handleDelete(facility.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
