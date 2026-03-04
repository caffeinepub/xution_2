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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Receipt } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { TransactionType } from "../backend.d";
import {
  useAddTransaction,
  useFacilities,
  useMembers,
  useTransactions,
} from "../hooks/useQueries";
import { formatAmount, formatDate } from "../utils/format";

const typeStyles: Record<TransactionType, string> = {
  [TransactionType.payment]: "bg-info/15 text-info border-info/30",
  [TransactionType.refund]: "bg-success/15 text-success border-success/30",
  [TransactionType.fee]: "bg-warning/15 text-warning border-warning/30",
  [TransactionType.donation]: "bg-primary/15 text-primary border-primary/30",
};

function AddTransactionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const addTx = useAddTransaction();
  const { data: members } = useMembers();
  const { data: facilities } = useFacilities();
  const [memberId, setMemberId] = useState("");
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
    try {
      await addTx.mutateAsync({
        id: crypto.randomUUID(),
        memberId,
        facilityId: facilityId === "none" ? null : facilityId,
        amount: BigInt(amountCents),
        description,
        type,
      });
      toast.success("Transaction recorded");
      onOpenChange(false);
      setMemberId("");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Record a new financial transaction.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Member</Label>
            <Select value={memberId} onValueChange={setMemberId} required>
              <SelectTrigger>
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
            <Label>Facility (optional)</Label>
            <Select value={facilityId} onValueChange={setFacilityId}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {facilities?.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tx-amount">Amount (USD)</Label>
              <Input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as TransactionType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TransactionType.payment}>
                    Payment
                  </SelectItem>
                  <SelectItem value={TransactionType.refund}>Refund</SelectItem>
                  <SelectItem value={TransactionType.fee}>Fee</SelectItem>
                  <SelectItem value={TransactionType.donation}>
                    Donation
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-desc">Description</Label>
            <Input
              id="tx-desc"
              placeholder="Monthly membership dues"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              data-ocid="transactions.submit_button"
              type="submit"
              disabled={addTx.isPending || !memberId}
            >
              {addTx.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Record Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TransactionsPage() {
  const { data: transactions, isLoading } = useTransactions();
  const { data: members } = useMembers();
  const { data: facilities } = useFacilities();
  const [addOpen, setAddOpen] = useState(false);

  const memberMap = Object.fromEntries(
    members?.map((m) => [m.id, m.name]) ?? [],
  );
  const facilityMap = Object.fromEntries(
    facilities?.map((f) => [f.id, f.name]) ?? [],
  );

  const sorted = transactions
    ? [...transactions].sort((a, b) => Number(b.createdAt - a.createdAt))
    : [];

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
            Transactions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sorted.length} transaction{sorted.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <Button
          data-ocid="transactions.add_button"
          onClick={() => setAddOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <AddTransactionDialog open={addOpen} onOpenChange={setAddOpen} />

      <div className="surface-elevated rounded-xl border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <Skeleton key={n} className="w-full h-12 rounded-lg" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="py-14 flex flex-col items-center gap-3 text-muted-foreground"
            data-ocid="transactions.empty_state"
          >
            <Receipt className="w-10 h-10 opacity-30" />
            <p className="text-sm">No transactions yet.</p>
          </div>
        ) : (
          <Table data-ocid="transactions.table">
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Member</TableHead>
                <TableHead className="text-muted-foreground">
                  Facility
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Description
                </TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Amount
                </TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((tx, idx) => (
                <motion.tr
                  key={tx.id}
                  data-ocid={`transactions.item.${idx + 1}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-border/30 hover:bg-accent/30 transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    {memberMap[tx.memberId] ?? tx.memberId}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {tx.facilityId
                      ? (facilityMap[tx.facilityId] ?? tx.facilityId)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-foreground/80 text-sm max-w-[200px] truncate">
                    {tx.description}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${typeStyles[tx.type]}`}
                    >
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-foreground">
                    {formatAmount(tx.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(tx.createdAt)}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
