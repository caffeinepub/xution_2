import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Broadcast,
  BroadcastPriority,
  DM,
  Facility,
  FacilityStatus,
  Member,
  Policy,
  Role,
  Transaction,
  TransactionType,
} from "../backend.d";
import { useActor } from "./useActor";

// ── Members ─────────────────────────────────────────────────────────────────

export function useMembers() {
  const { actor, isFetching } = useActor();
  return useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMembers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: string;
      name: string;
      email: string;
      role: Role;
      principal: Principal;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createMember(
        args.id,
        args.name,
        args.email,
        args.role,
        args.principal,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useUpdateMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: string;
      name: string;
      email: string;
      role: Role;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateMember(args.id, args.name, args.email, args.role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useDeleteMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteMember(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

// ── DMs ─────────────────────────────────────────────────────────────────────

export function useDMs() {
  const { actor, isFetching } = useActor();
  return useQuery<DM[]>({
    queryKey: ["dms"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDMs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSendDM() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      fromMemberId: string;
      toMemberId: string;
      content: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.sendDM(args.fromMemberId, args.toMemberId, args.content);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dms"] }),
  });
}

export function useMarkDMRead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      return actor.markDMAsRead(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dms"] }),
  });
}

// ── Facilities ───────────────────────────────────────────────────────────────

export function useFacilities() {
  const { actor, isFetching } = useActor();
  return useQuery<Facility[]>({
    queryKey: ["facilities"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFacilities();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddFacility() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: string;
      name: string;
      description: string;
      location: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addFacility(
        args.id,
        args.name,
        args.description,
        args.location,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["facilities"] }),
  });
}

export function useUpdateFacilityStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; status: FacilityStatus }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateFacilityStatus(args.id, args.status);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["facilities"] }),
  });
}

export function useRemoveFacility() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      return actor.removeFacility(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["facilities"] }),
  });
}

// ── Transactions ─────────────────────────────────────────────────────────────

export function useTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTransaction() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: string;
      memberId: string;
      facilityId: string | null;
      amount: bigint;
      description: string;
      type: TransactionType;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addTransaction(
        args.id,
        args.memberId,
        args.facilityId,
        args.amount,
        args.description,
        args.type,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}

// ── Policies ─────────────────────────────────────────────────────────────────

export function usePolicies() {
  const { actor, isFetching } = useActor();
  return useQuery<Policy[]>({
    queryKey: ["policies"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPolicies();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddPolicy() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: string;
      title: string;
      content: string;
      category: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addPolicy(args.id, args.title, args.content, args.category);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  });
}

export function useUpdatePolicy() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: string;
      title: string;
      content: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updatePolicy(args.id, args.title, args.content);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  });
}

export function useDeactivatePolicy() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deactivatePolicy(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  });
}

// ── Broadcasts ───────────────────────────────────────────────────────────────

export function useBroadcasts() {
  const { actor, isFetching } = useActor();
  return useQuery<Broadcast[]>({
    queryKey: ["broadcasts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBroadcasts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateBroadcast() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: string;
      title: string;
      content: string;
      authorId: string;
      priority: BroadcastPriority;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createBroadcast(
        args.id,
        args.title,
        args.content,
        args.authorId,
        args.priority,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broadcasts"] }),
  });
}

// ── Auth / User ───────────────────────────────────────────────────────────────

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Password management ───────────────────────────────────────────────────────

export function useGetPasswords() {
  const { actor, isFetching } = useActor();
  return useQuery<[string, string]>({
    queryKey: ["passwords"],
    queryFn: async () => {
      if (!actor) return ["", ""];
      return actor.getPasswords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetPasswords() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { p1: string; p2: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.setPasswords(args.p1, args.p2);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["passwords"] }),
  });
}

export function useSetMemberIdCard() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { memberId: string; imageDataUrl: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.setMemberIdCard(args.memberId, args.imageDataUrl);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useVerifyPassword() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (password: string) => {
      if (!actor) throw new Error("No actor");
      return actor.verifyPassword(password);
    },
  });
}
