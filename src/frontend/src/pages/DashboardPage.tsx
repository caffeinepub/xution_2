import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  Building2,
  Key,
  Loader2,
  MessageSquare,
  Radio,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { BroadcastPriority } from "../backend.d";
import {
  useBroadcasts,
  useDMs,
  useFacilities,
  useGetPasswords,
  useIsAdmin,
  useMembers,
  useSetPasswords,
  useTransactions,
} from "../hooks/useQueries";
import { formatDate } from "../utils/format";

const priorityColors: Record<BroadcastPriority, string> = {
  [BroadcastPriority.urgent]:
    "bg-destructive/20 text-destructive border-destructive/30",
  [BroadcastPriority.high]: "bg-warning/20 text-warning border-warning/30",
  [BroadcastPriority.normal]: "bg-muted text-muted-foreground border-border",
};

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sublabel?: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="surface-elevated rounded-xl p-5 border border-border/50 hover:border-primary/30 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="text-3xl font-bold font-mono text-foreground mb-1">
        {value}
      </div>
      <div className="text-sm font-medium text-foreground/80">{label}</div>
      {sublabel && (
        <div className="text-xs text-muted-foreground mt-0.5">{sublabel}</div>
      )}
    </motion.div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="surface-elevated rounded-xl p-5 border border-border/50">
      <Skeleton className="w-9 h-9 rounded-lg mb-3" />
      <Skeleton className="w-16 h-8 mb-1" />
      <Skeleton className="w-24 h-4" />
    </div>
  );
}

function PasswordManagementSection() {
  const { data: passwords, isLoading } = useGetPasswords();
  const setPasswords = useSetPasswords();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  // Populate fields from loaded data
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="surface-elevated rounded-xl border border-border/50 overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
        <Key className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          Password Management
        </h2>
      </div>
      <div className="p-5 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                PASSWORD 1
              </Label>
              <div className="flex gap-2">
                <Input
                  data-ocid="dashboard.password1.input"
                  type="text"
                  placeholder={
                    loadedP1 ? `Current: ${loadedP1}` : "Enter password 1"
                  }
                  value={p1}
                  onChange={(e) => setP1(e.target.value)}
                  className="font-mono"
                />
                <Button
                  data-ocid="dashboard.password1.save_button"
                  size="icon"
                  variant="outline"
                  onClick={handleSaveP1}
                  disabled={setPasswords.isPending || !p1.trim()}
                  title="Save password 1"
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
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                PASSWORD 2
              </Label>
              <div className="flex gap-2">
                <Input
                  data-ocid="dashboard.password2.input"
                  type="text"
                  placeholder={
                    loadedP2 ? `Current: ${loadedP2}` : "Enter password 2"
                  }
                  value={p2}
                  onChange={(e) => setP2(e.target.value)}
                  className="font-mono"
                />
                <Button
                  data-ocid="dashboard.password2.save_button"
                  size="icon"
                  variant="outline"
                  onClick={handleSaveP2}
                  disabled={setPasswords.isPending || !p2.trim()}
                  title="Save password 2"
                >
                  {setPasswords.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              These passwords allow access to the Xution platform. Default
              passwords are "bacon" and "leviathan".
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}

export function DashboardPage() {
  const { data: members, isLoading: loadingMembers } = useMembers();
  const { data: facilities, isLoading: loadingFacilities } = useFacilities();
  const { data: dms, isLoading: loadingDMs } = useDMs();
  const { data: broadcasts, isLoading: loadingBroadcasts } = useBroadcasts();
  const { data: transactions, isLoading: loadingTransactions } =
    useTransactions();
  const { data: isAdmin } = useIsAdmin();

  const isLoading =
    loadingMembers ||
    loadingFacilities ||
    loadingDMs ||
    loadingBroadcasts ||
    loadingTransactions;

  const activeMembers =
    members?.filter((m) => m.status === "active").length ?? 0;
  const availableFacilities =
    facilities?.filter((f) => f.status === "available").length ?? 0;
  const unreadDMs = dms?.filter((d) => !d.read).length ?? 0;
  const totalTransactions = transactions?.length ?? 0;

  const recentBroadcasts = broadcasts
    ? [...broadcasts]
        .sort((a, b) => Number(b.createdAt - a.createdAt))
        .slice(0, 5)
    : [];

  const recentDMs = dms
    ? [...dms].sort((a, b) => Number(b.sentAt - a.sentAt)).slice(0, 4)
    : [];

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your organization at a glance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Active Members"
              value={activeMembers}
              sublabel={`${members?.length ?? 0} total`}
              delay={0}
            />
            <StatCard
              icon={Building2}
              label="Available Facilities"
              value={availableFacilities}
              sublabel={`${facilities?.length ?? 0} total`}
              delay={0.08}
            />
            <StatCard
              icon={MessageSquare}
              label="Unread Messages"
              value={unreadDMs}
              sublabel={`${dms?.length ?? 0} total DMs`}
              delay={0.12}
            />
            <StatCard
              icon={TrendingUp}
              label="Transactions"
              value={totalTransactions}
              sublabel="All time"
              delay={0.16}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Broadcasts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="surface-elevated rounded-xl border border-border/50 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Recent Broadcasts
            </h2>
          </div>
          <div className="divide-y divide-border/30">
            {loadingBroadcasts ? (
              <>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="px-5 py-3 space-y-1.5">
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-1/2 h-3" />
                  </div>
                ))}
              </>
            ) : recentBroadcasts.length === 0 ? (
              <div
                className="px-5 py-8 text-center text-muted-foreground text-sm"
                data-ocid="broadcasts.empty_state"
              >
                No broadcasts yet
              </div>
            ) : (
              recentBroadcasts.map((b) => (
                <div
                  key={b.id}
                  className="px-5 py-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {b.title}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${priorityColors[b.priority]}`}
                    >
                      {b.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(b.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent DMs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="surface-elevated rounded-xl border border-border/50 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border/50 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Recent Messages
            </h2>
          </div>
          <div className="divide-y divide-border/30">
            {loadingDMs ? (
              <>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="px-5 py-3 space-y-1.5">
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-1/2 h-3" />
                  </div>
                ))}
              </>
            ) : recentDMs.length === 0 ? (
              <div
                className="px-5 py-8 text-center text-muted-foreground text-sm"
                data-ocid="messages.empty_state"
              >
                No messages yet
              </div>
            ) : (
              recentDMs.map((dm) => (
                <div
                  key={dm.id}
                  className="px-5 py-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-foreground line-clamp-1">
                      {dm.content}
                    </p>
                    {!dm.read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(dm.sentAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Password Management — admin only */}
      {isAdmin && <PasswordManagementSection />}
    </div>
  );
}
