import { useState, useRef, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Sparkles, CheckCircle2, Mic, MicOff, Plus, MessageSquare, Trash2, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

type Msg = { role: "user" | "assistant"; content: string };

export interface WorkoutSuggestion {
  day_of_week?: number;
  title: string;
  intensity: string;
  tags: string[];
  warmup: string;
  activation?: string;
  strength?: string;
  wod: string;
  notes?: string;
}

interface Conversation {
  id: string;
  title: string;
  week_start: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekStart?: string;
  dayOfWeek?: number;
  onApply?: (suggestion: WorkoutSuggestion) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workout-ai-assistant`;

const WorkoutAIAssistant = ({ open, onOpenChange, weekStart, dayOfWeek, onApply }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<WorkoutSuggestion | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConversations(true);
    const { data } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);
    setConversations((data as Conversation[]) || []);
    setLoadingConversations(false);
  }, [user]);

  // Load conversations when opening
  useEffect(() => {
    if (open && user) {
      loadConversations();
    }
  }, [open, user, loadConversations]);

  // Load messages for a conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data as Msg[]);
    }
    setActiveConversationId(conversationId);
    setShowHistory(false);
    setPendingSuggestion(null);
  }, []);

  // Create new conversation
  const startNewConversation = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
    setPendingSuggestion(null);
    setShowHistory(false);
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("ai_conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      startNewConversation();
    }
  }, [activeConversationId, startNewConversation]);

  // Save message to DB
  const saveMessage = useCallback(async (conversationId: string, role: string, content: string) => {
    await supabase.from("ai_messages").insert({ conversation_id: conversationId, role, content });
  }, []);

  // Create or get conversation
  const ensureConversation = useCallback(async (firstMessage: string): Promise<string> => {
    if (activeConversationId) return activeConversationId;
    
    const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? "..." : "");
    const { data } = await supabase
      .from("ai_conversations")
      .insert({ user_id: user!.id, title, week_start: weekStart || null })
      .select("id")
      .single();
    
    const id = data!.id;
    setActiveConversationId(id);
    loadConversations();
    return id;
  }, [activeConversationId, user, weekStart, loadConversations]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      toast({ title: "Não suportado", description: "Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInput(finalTranscript + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        toast({ title: "Microfone bloqueado", description: "Permita o acesso ao microfone nas configurações do navegador.", variant: "destructive" });
      }
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  }, [isListening, toast]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);
    setPendingSuggestion(null);

    // Persist user message
    const convId = await ensureConversation(text);
    await saveMessage(convId, "user", text);

    let assistantSoFar = "";
    let toolCallArgs = "";
    let isToolCall = false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast({ title: "Erro", description: "Você precisa estar logado para usar o assistente", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: allMessages, weekStart, dayOfWeek }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        toast({ title: "Erro", description: err.error || "Falha na comunicação com a IA", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No stream body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsertAssistant = (nextChunk: string) => {
        assistantSoFar += nextChunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const choice = parsed.choices?.[0];
            const delta = choice?.delta;

            if (delta?.tool_calls) {
              isToolCall = true;
              for (const tc of delta.tool_calls) {
                if (tc.function?.arguments) {
                  toolCallArgs += tc.function.arguments;
                }
              }
            }

            const content = delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Process tool call result
      if (isToolCall && toolCallArgs) {
        try {
          const suggestion = JSON.parse(toolCallArgs) as WorkoutSuggestion;
          setPendingSuggestion(suggestion);
          const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
          const dayLabel = suggestion.day_of_week !== undefined ? ` para **${DAY_NAMES[suggestion.day_of_week]}**` : "";
          upsertAssistant(`\n\n✅ **Treino gerado${dayLabel}!** Clique em "Aplicar" para salvar.`);
        } catch (e) {
          console.error("Failed to parse tool call:", e);
        }
      }

      // Persist assistant response
      if (assistantSoFar) {
        await saveMessage(convId, "assistant", assistantSoFar);
        // Update conversation updated_at
        await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Erro", description: "Falha na conexão com o assistente", variant: "destructive" });
    }

    setIsLoading(false);
  }, [messages, isLoading, weekStart, dayOfWeek, toast, ensureConversation, saveMessage]);

  const handleApply = () => {
    if (pendingSuggestion && onApply) {
      onApply(pendingSuggestion);
      toast({ title: "Treino aplicado!", description: "Treino salvo com sucesso." });
      setPendingSuggestion(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 1) return "Agora";
    if (diffHours < 24) return `${Math.floor(diffHours)}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays}d atrás`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            {showHistory ? (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowHistory(false)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
            {showHistory ? "Histórico de Conversas" : "Assistente IA – CrossFit"}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground flex items-center justify-between">
            <span>{showHistory ? `${conversations.length} conversas` : "Converse com a IA para gerar treinos inteligentes"}</span>
            {!showHistory && (
              <span className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setShowHistory(true)}>
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Histórico
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={startNewConversation}>
                  <Plus className="h-3 w-3 mr-1" />
                  Nova
                </Button>
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        {showHistory ? (
          /* Conversation history list */
          <ScrollArea className="flex-1">
            <div className="px-4 py-3 space-y-2">
              {loadingConversations ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Nenhuma conversa salva</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`w-full text-left rounded-lg px-3 py-2.5 border transition-colors group
                      ${activeConversationId === conv.id
                        ? "border-primary/50 bg-primary/5"
                        : "border-border/50 hover:border-primary/30 hover:bg-muted/50"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDate(conv.updated_at)}
                          {conv.week_start && ` · Semana ${conv.week_start}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                        onClick={(e) => deleteConversation(conv.id, e)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          <>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
                  <Bot className="h-12 w-12 text-primary/40" />
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Diga o que precisa! Ex: "Crie um treino de força + engine para segunda" ou "Sugira um WOD com ginástica"
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`rounded-xl px-3 py-2 max-w-[85%] text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-xl px-3 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Apply button */}
            {pendingSuggestion && onApply && (
              <div className="px-4 py-2 border-t border-border">
                <Button onClick={handleApply} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aplicar Treino
                </Button>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-border">
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant={isListening ? "default" : "outline"}
                  onClick={toggleListening}
                  disabled={isLoading}
                  className={`flex-shrink-0 ${isListening ? "bg-destructive hover:bg-destructive/90 animate-pulse" : ""}`}
                  title={isListening ? "Parar gravação" : "Falar com o assistente"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "Ouvindo... fale agora 🎙️" : "Ex: Crie um treino de força para segunda..."}
                  className="min-h-[44px] max-h-[120px] resize-none bg-background border-border text-sm"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  onClick={() => { recognitionRef.current?.stop(); setIsListening(false); send(input); }}
                  disabled={isLoading || !input.trim()}
                  className="flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default WorkoutAIAssistant;
