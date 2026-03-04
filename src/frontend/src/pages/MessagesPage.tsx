import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { DM } from "../backend.d";
import { useAuthContext } from "../hooks/useAuthContext";
import {
  useDMs,
  useMarkDMRead,
  useMembers,
  useSendDM,
} from "../hooks/useQueries";
import { formatDateTime } from "../utils/format";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MessagesPage() {
  const { data: dms, isLoading: loadingDMs } = useDMs();
  const { data: members, isLoading: loadingMembers } = useMembers();
  const sendDM = useSendDM();
  const markRead = useMarkDMRead();
  const { currentMemberId } = useAuthContext();

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  // If logged in as a member via QR, use that member ID directly; otherwise let user pick
  const [manualFromMemberId, setManualFromMemberId] = useState<string>("");
  const fromMemberId = currentMemberId ?? manualFromMemberId;
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLoading = loadingDMs || loadingMembers;

  // Group DMs by conversation partner
  const conversations =
    members
      ?.map((m) => {
        const msgs =
          dms?.filter(
            (d) => d.fromMemberId === m.id || d.toMemberId === m.id,
          ) ?? [];
        const unread = msgs.filter((d) => !d.read).length;
        const last = msgs.sort((a, b) => Number(b.sentAt - a.sentAt))[0];
        return { member: m, msgs, unread, last };
      })
      .filter((c) => c.msgs.length > 0) ?? [];

  const selectedConversation = selectedMemberId
    ? conversations.find((c) => c.member.id === selectedMemberId)
    : null;

  const conversationDMs = selectedConversation
    ? [...selectedConversation.msgs].sort((a: DM, b: DM) =>
        Number(a.sentAt - b.sentAt),
      )
    : [];

  const markReadMutate = markRead.mutate;
  // Mark unread messages as read when conversation is opened
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional - only run on conversation change
  useEffect(() => {
    if (selectedConversation) {
      const unreadIds = selectedConversation.msgs
        .filter((d) => !d.read)
        .map((d) => d.id);
      for (const id of unreadIds) {
        markReadMutate(id);
      }
    }
  }, [selectedConversation]);

  // Scroll to bottom when message count changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll trigger only needs count
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationDMs.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!fromMemberId || !selectedMemberId || !content.trim()) return;
    try {
      await sendDM.mutateAsync({
        fromMemberId,
        toMemberId: selectedMemberId,
        content: content.trim(),
      });
      setContent("");
    } catch {
      toast.error("Failed to send message");
    }
  }

  // Current member info (for display)
  const currentMember = currentMemberId
    ? members?.find((m) => m.id === currentMemberId)
    : null;

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
          Messages
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Direct messages between members
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-16rem)]">
        {/* Conversation list */}
        <div className="surface-elevated rounded-xl border border-border/50 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Conversations
            </span>
            <span className="text-xs text-muted-foreground">
              {conversations.length}
            </span>
          </div>

          {/* New conversation: send to any member */}
          <div className="px-4 py-3 border-b border-border/30">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Message any member
            </Label>
            <Select
              value={selectedMemberId ?? ""}
              onValueChange={setSelectedMemberId}
            >
              <SelectTrigger
                data-ocid="messages.recipient.select"
                className="h-8 text-xs"
              >
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

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="w-full h-16 rounded-lg" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div
                className="py-10 flex flex-col items-center gap-2 text-muted-foreground"
                data-ocid="messages.empty_state"
              >
                <MessageSquare className="w-8 h-8 opacity-30" />
                <p className="text-xs">No conversations yet</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map((c, idx) => (
                  <button
                    key={c.member.id}
                    data-ocid={`messages.conversation.${idx + 1}`}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      selectedMemberId === c.member.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent/50 text-foreground"
                    }`}
                    onClick={() => setSelectedMemberId(c.member.id)}
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                        {getInitials(c.member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {c.member.name}
                        </span>
                        {c.unread > 0 && (
                          <span className="ml-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center shrink-0">
                            {c.unread}
                          </span>
                        )}
                      </div>
                      {c.last && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {c.last.content}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message thread */}
        <div className="lg:col-span-2 surface-elevated rounded-xl border border-border/50 flex flex-col overflow-hidden">
          {!selectedMemberId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <MessageSquare className="w-10 h-10 opacity-25" />
              <p className="text-sm">Select a member to view messages</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-3 border-b border-border/30 flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                    {selectedConversation
                      ? getInitials(selectedConversation.member.name)
                      : "??"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {selectedConversation?.member.name ?? "Unknown"}
                </span>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {conversationDMs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No messages yet. Start the conversation below.
                  </div>
                ) : (
                  conversationDMs.map((dm, idx) => {
                    const isFromSelected = dm.fromMemberId === selectedMemberId;
                    return (
                      <motion.div
                        key={dm.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`flex ${isFromSelected ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                            isFromSelected
                              ? "bg-secondary text-secondary-foreground rounded-tl-sm"
                              : "bg-primary/20 text-foreground rounded-tr-sm"
                          }`}
                        >
                          <p>{dm.content}</p>
                          <p className="text-[10px] opacity-60 mt-1">
                            {formatDateTime(dm.sentAt)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              <div className="px-4 pb-4 pt-3 border-t border-border/30 space-y-2">
                {/* Sender: auto from session or let user pick */}
                {currentMemberId ? (
                  <p className="text-xs text-muted-foreground">
                    Sending as{" "}
                    <span className="text-foreground font-medium">
                      {currentMember?.name ?? "You"}
                    </span>
                  </p>
                ) : (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Sending as
                    </Label>
                    <Select
                      value={manualFromMemberId}
                      onValueChange={setManualFromMemberId}
                    >
                      <SelectTrigger
                        data-ocid="messages.sender.select"
                        className="h-8 text-xs"
                      >
                        <SelectValue placeholder="Select your member profile..." />
                      </SelectTrigger>
                      <SelectContent>
                        {members
                          ?.filter((m) => m.id !== selectedMemberId)
                          .map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    data-ocid="messages.dm.input"
                    placeholder="Type a message..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex-1"
                    disabled={!fromMemberId}
                  />
                  <Button
                    data-ocid="messages.send_button"
                    type="submit"
                    size="icon"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                    disabled={
                      !content.trim() || !fromMemberId || sendDM.isPending
                    }
                  >
                    {sendDM.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
