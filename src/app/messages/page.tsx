"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import {
  MessageSquare,
  Send,
  User,
  Shield,
  LifeBuoy,
  Plus,
  Loader2,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = React.useState<any[]>([]);
  const [contacts, setContacts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeThreadId, setActiveThreadId] = React.useState<string | "support">("");
  const [activeSupportSenderId, setActiveSupportSenderId] = React.useState<string>("");
  const [messageInput, setMessageInput] = React.useState("");
  const [newChatOpen, setNewChatOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  // Holds a newly-selected contact that hasn't exchanged any messages yet
  const [pendingThread, setPendingThread] = React.useState<{ id: string; name: string; role: string; isSupport: boolean } | null>(null);

  const fetchInbox = React.useCallback(async () => {
    try {
      const [messagesRes, contactsRes] = await Promise.all([
        api.get("/messages"),
        api.get("/messages/contacts"),
      ]);
      setMessages(messagesRes.data);
      setContacts(contactsRes.data);
    } catch (err) {
      console.error("Failed to load inbox", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 8000); // Poll every 8 seconds
    return () => clearInterval(interval);
  }, [fetchInbox]);

  // Group messages into threads
  const threads = React.useMemo(() => {
    if (!user) return [];
    const grouped: Record<string, {
      id: string;
      name: string;
      role: string;
      lastMessage: string;
      lastTime: string;
      unreadCount: number;
      messages: any[];
      isSupport: boolean;
      supportSenderId?: string; // For admin support view
    }> = {};

    messages.forEach((msg) => {
      // Determine thread key
      let key = "";
      let threadName = "";
      let threadRole = "";
      let isSupport = false;
      let supportSenderId = "";

      if (msg.to_admin) {
        isSupport = true;
        if (user.global_role === "SAAS_ADMIN") {
          // Admin sees support threads grouped by the sender
          key = `support-${msg.sender_id}`;
          threadName = `${msg.sender.first_name} ${msg.sender.last_name}`;
          threadRole = `Support Request (${msg.sender.global_role})`;
          supportSenderId = msg.sender_id;
        } else {
          // Tenant/Landlord see support thread as one single "System Support" thread
          key = "support";
          threadName = "System Support";
          threadRole = "Platform administration";
        }
      } else {
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!otherUserId) return;
        key = otherUserId;
        threadName = otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : "Unknown User";
        threadRole = otherUser ? otherUser.global_role : "User";
      }

      if (!grouped[key]) {
        grouped[key] = {
          id: key,
          name: threadName,
          role: threadRole,
          lastMessage: "",
          lastTime: "",
          unreadCount: 0,
          messages: [],
          isSupport,
          supportSenderId,
        };
      }

      grouped[key].messages.push(msg);
      grouped[key].lastMessage = msg.content;
      grouped[key].lastTime = msg.created_at;

      // Count unread: sender is not current user and message is unread
      if (msg.sender_id !== user.id && !msg.is_read) {
        grouped[key].unreadCount += 1;
      }
    });

    return Object.values(grouped).sort(
      (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    );
  }, [messages, user]);

  // Messages of the active thread — fall back to pendingThread if no messages yet
  const activeThread = React.useMemo(() => {
    const found = threads.find((t) => t.id === activeThreadId);
    if (found) return found;
    // If the user just clicked a contact but hasn't sent a message yet, show empty thread
    if (pendingThread && pendingThread.id === activeThreadId) {
      return { ...pendingThread, lastMessage: "", lastTime: "", unreadCount: 0, messages: [], supportSenderId: activeSupportSenderId };
    }
    return undefined;
  }, [threads, activeThreadId, pendingThread, activeSupportSenderId]);

  // Mark thread as read when selected
  React.useEffect(() => {
    if (!activeThreadId) return;

    const markRead = async () => {
      try {
        if (activeThreadId.startsWith("support-")) {
          // For SAAS_ADMIN viewing support
          await api.patch("/messages/read-support");
        } else if (activeThreadId === "support") {
          // For Tenant/Landlord viewing support
          await api.patch("/messages/read-support");
        } else {
          await api.patch(`/messages/read/${activeThreadId}`);
        }
      } catch (err) {
        console.error(err);
      }
    };

    markRead();
  }, [activeThreadId, messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || sending) return;

    setSending(true);
    try {
      const payload: any = { content: messageInput };

      if (activeThreadId.startsWith("support-")) {
        // SaaS Admin replying to support thread
        payload.receiver_id = activeSupportSenderId;
      } else if (activeThreadId === "support") {
        // Tenant/Landlord sending to support queue
        payload.to_admin = true;
      } else {
        payload.receiver_id = activeThreadId;
      }

      await api.post("/messages", payload);
      setMessageInput("");
      fetchInbox();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleStartChat = (contactId: string | "support", name: string, role: string, isSupport = false) => {
    setActiveThreadId(contactId);
    setPendingThread({ id: contactId, name, role, isSupport });
    if (isSupport && user?.global_role === "SAAS_ADMIN") {
      setActiveSupportSenderId(contactId.replace("support-", ""));
    }
    setNewChatOpen(false);
  };

  const messageEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] border border-border rounded-2xl bg-card overflow-hidden shadow-lg">
        {/* Thread List Sidebar */}
        <div className="w-full md:w-80 border-r border-border flex flex-col h-full bg-accent/10">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-primary" /> Messages
            </h2>
            <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
              <DialogTrigger render={<button className="h-8 w-8 rounded-lg border border-border hover:bg-accent flex items-center justify-center transition-colors"><Plus className="h-4 w-4" /></button>} />
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base font-extrabold">New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 py-4 max-h-[300px] overflow-y-auto">
                  {/* System Support option for non-admin */}
                  {user?.global_role !== "SAAS_ADMIN" && (
                    <button
                      onClick={() => handleStartChat("support", "System Support", "Platform Admin", true)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all text-left"
                    >
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <LifeBuoy className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">System Support</p>
                        <p className="text-[10px] text-muted-foreground">Platform Administration Support Queue</p>
                      </div>
                    </button>
                  )}

                  {contacts.length === 0 ? (
                    <p className="text-center py-6 text-xs text-muted-foreground">No contacts available to message.</p>
                  ) : (
                    contacts.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleStartChat(c.id, `${c.first_name} ${c.last_name}`, c.label)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all text-left"
                      >
                        <div className="h-9 w-9 rounded-lg bg-accent text-accent-foreground flex items-center justify-center font-bold flex-shrink-0">
                          {c.first_name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{c.first_name} {c.last_name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{c.label}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {threads.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                No active conversations
              </div>
            ) : (
              threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveThreadId(t.id);
                    if (t.isSupport && t.supportSenderId) {
                      setActiveSupportSenderId(t.supportSenderId);
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    activeThreadId === t.id
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${
                    activeThreadId === t.id ? "bg-primary-foreground/20 text-white" : "bg-primary/10 text-primary"
                  }`}>
                    {t.isSupport ? <LifeBuoy className="h-5 w-5" /> : t.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="text-xs font-extrabold truncate">{t.name}</p>
                      <span className={`text-[9px] font-mono ${
                        activeThreadId === t.id ? "text-primary-foreground/75" : "text-muted-foreground"
                      }`}>
                        {t.lastTime ? new Date(t.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>
                    <p className={`text-[10px] uppercase font-extrabold tracking-wider mb-1 ${
                      activeThreadId === t.id ? "text-primary-foreground/90" : "text-muted-foreground/70"
                    }`}>
                      {t.role}
                    </p>
                    <p className={`text-[11px] truncate ${
                      activeThreadId === t.id ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}>
                      {t.lastMessage}
                    </p>
                  </div>
                  {t.unreadCount > 0 && (
                    <span className={`h-5 min-w-5 px-1 flex items-center justify-center rounded-full text-[10px] font-bold ${
                      activeThreadId === t.id ? "bg-white text-primary" : "bg-destructive text-destructive-foreground animate-pulse"
                    }`}>
                      {t.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 flex flex-col h-full bg-card">
          {activeThread ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-accent/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {activeThread.isSupport ? <LifeBuoy className="h-5 w-5" /> : activeThread.name[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold">{activeThread.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{activeThread.role}</p>
                  </div>
                </div>
              </div>

              {/* Message Bubble Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeThread.messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-accent/40 text-foreground rounded-tl-none border border-border"
                      }`}>
                        {/* Sender name for system support queues */}
                        {activeThread.isSupport && user?.global_role === "SAAS_ADMIN" && !isOwn && (
                          <p className="text-[9px] font-bold opacity-75 mb-0.5">
                            {msg.sender.first_name} {msg.sender.last_name}
                          </p>
                        )}
                        <p>{msg.content}</p>
                        <div className={`text-[8px] font-mono mt-1 text-right opacity-70`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messageEndRef} />
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex items-center gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  required
                  autoComplete="off"
                  className="flex-1 h-10"
                />
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="h-10 w-10 rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center transition-all disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <h3 className="font-extrabold text-sm mb-1">No Active Chat</h3>
              <p className="text-xs max-w-xs leading-relaxed">
                Select a conversation from the sidebar or click the new message button to start chatting.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
