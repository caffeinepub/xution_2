import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserX } from "lucide-react";
import { motion } from "motion/react";
import type { Status } from "../backend.d";
import { Status as StatusEnum } from "../backend.d";
import { useMembers } from "../hooks/useQueries";
import { formatDate, truncatePrincipal } from "../utils/format";
import {
  getClassLabel,
  getMemberClass,
  getMemberXut,
} from "../utils/memberClass";

const statusStyles: Record<Status, string> = {
  [StatusEnum.active]: "bg-green-500/15 text-green-400 border-green-500/30",
  [StatusEnum.inactive]: "bg-zinc-700/30 text-zinc-500 border-zinc-600/30",
  [StatusEnum.suspended]: "bg-red-500/15 text-red-400 border-red-500/30",
};

const CLASS_COLORS: Record<number, string> = {
  1: "bg-zinc-700/50 text-zinc-300 border-zinc-600/40",
  2: "bg-blue-900/30 text-blue-300 border-blue-700/40",
  3: "bg-green-900/30 text-green-300 border-green-700/40",
  4: "bg-yellow-900/30 text-yellow-300 border-yellow-700/40",
  5: "bg-orange-900/30 text-orange-300 border-orange-700/40",
  6: "bg-primary/15 text-primary border-primary/30",
};

interface MembersPageProps {
  viewerClass: number;
}

export function MembersPage({ viewerClass }: MembersPageProps) {
  const { data: members, isLoading } = useMembers();

  // Class 5+ can see XUT numbers, class 4 and below cannot
  const canSeeXut = viewerClass >= 5;

  if (isLoading) {
    return (
      <div className="space-y-2 px-4 pb-4" data-ocid="members.loading_state">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="w-full h-10 rounded bg-zinc-800" />
        ))}
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div
        className="py-8 flex flex-col items-center gap-2 text-zinc-600"
        data-ocid="members.empty_state"
      >
        <UserX className="w-8 h-8 opacity-30" />
        <p className="text-sm">No members registered yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" data-ocid="members.table">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">
              Username
            </TableHead>
            <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">
              Class
            </TableHead>
            {canSeeXut && (
              <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">
                XUT #
              </TableHead>
            )}
            <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">
              Principal
            </TableHead>
            <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">
              Joined
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
                transition={{ delay: idx * 0.03 }}
                className="border-zinc-800/60 hover:bg-zinc-800/20 transition-colors"
              >
                <TableCell className="font-medium text-zinc-200 text-sm">
                  {member.name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${clsColor}`}>
                    {getClassLabel(cls)}
                  </Badge>
                </TableCell>
                {canSeeXut && (
                  <TableCell className="font-mono text-xs text-zinc-400">
                    {xut || <span className="opacity-40">—</span>}
                  </TableCell>
                )}
                <TableCell className="font-mono text-xs text-zinc-500">
                  {truncatePrincipal(member.principal.toString())}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs ${statusStyles[member.status]}`}
                  >
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-500 text-xs">
                  {formatDate(member.joinedAt)}
                </TableCell>
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
