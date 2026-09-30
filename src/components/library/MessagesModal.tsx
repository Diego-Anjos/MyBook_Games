"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

interface MessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MessagesModal({ isOpen, onClose }: MessagesModalProps) {
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendError, setSendError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Busca o utilizador logado e a lista de amigos aceites
  useEffect(() => {
    if (isOpen) {
      const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          fetchFriends(user.id);
        }
      };
      init();
    }
  }, [isOpen]);

  // Rola o chat para baixo sempre que as mensagens mudam
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Busca o histórico de mensagens quando seleciona um amigo
  useEffect(() => {
    if (selectedFriend && currentUser) {
      fetchMessages();

      // Inscreve no canal realtime para receber mensagens instantaneamente
      const channel = supabase.channel(`chat-${currentUser.id}-${selectedFriend.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
          const newMsg = payload.new;
          if (
            (newMsg.sender_id === currentUser.id && newMsg.receiver_id === selectedFriend.id) ||
            (newMsg.sender_id === selectedFriend.id && newMsg.receiver_id === currentUser.id)
          ) {
            setMessages((prev) => (prev.some((msg) => msg.id === newMsg.id) ? prev : [...prev, newMsg]));
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedFriend, currentUser]);

  const fetchFriends = async (userId: string) => {
    // Busca amigos onde o status é 'accepted'
    const { data, error } = await supabase
      .from("friendships")
      .select(`
        friend_id,
        profiles!friendships_friend_id_fkey (id, nickname, avatar_url)
      `)
      .eq("user_id", userId)
      .eq("status", "accepted");

    if (data && !error) setFriends(data.map((f) => f.profiles).filter(Boolean));
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},receiver_id.eq.${currentUser.id})`)
      .order("created_at", { ascending: true });

    if (data && !error) setMessages(data);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend || !currentUser) return;

    const msgContent = newMessage.trim();
    setNewMessage("");
    setSendError("");

    const { data, error } = await supabase.from("messages").insert({
      sender_id: currentUser.id,
      receiver_id: selectedFriend.id,
      content: msgContent,
    }).select().single();

    if (error || !data) {
      setNewMessage(msgContent);
      setSendError("A mensagem não foi enviada. Confirme a tabela messages no Supabase.");
      return;
    }

    setMessages((prev) => (prev.some((msg) => msg.id === data.id) ? prev : [...prev, data]));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-book-bg border border-book-gold/30 rounded-lg w-full max-w-lg md:max-w-5xl h-[80vh] flex overflow-hidden shadow-2xl relative">

        {/* Painel Esquerdo: Lista de Amigos */}
        <div className={`w-full border-r border-book-gold/20 bg-black/20 md:w-1/3 lg:w-1/4 ${selectedFriend ? "hidden md:flex flex-col" : "flex flex-col"}`}>
          <div className="p-4 border-b border-book-gold/20 flex items-center justify-between shrink-0">
            <h2 className="font-display text-xl text-book-gold">Contactos</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-book-gold/60 transition-colors hover:text-book-gold md:hidden"
              aria-label="Fechar mensagens"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-book-gold/20">
            {friends.length === 0 ? (
              <p className="text-xs text-book-paper/40 p-4 text-center">Nenhum amigo na guilda ainda.</p>
            ) : (
              friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => {
                    setMessages([]);
                    setSendError("");
                    setSelectedFriend(friend);
                  }}
                  className={`w-full flex items-center gap-3 p-4 transition-colors text-left border-l-2 ${
                    selectedFriend?.id === friend.id
                      ? "bg-book-gold/10 border-book-gold"
                      : "border-transparent hover:bg-book-gold/5"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full border border-book-gold/30 overflow-hidden relative shrink-0">
                    {friend.avatar_url ? (
                      <Image
                        alt={friend.nickname || "Companheiro"}
                        className="object-cover"
                        fill
                        src={friend.avatar_url}
                      />
                    ) : (
                      <div className="w-full h-full bg-book-gold/10 flex items-center justify-center text-book-gold text-sm">
                        {friend.nickname?.[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-book-paper text-sm font-medium truncate">{friend.nickname}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Painel Direito: Área do Chat */}
        <div className={`relative flex-1 ${!selectedFriend ? "hidden flex-col md:flex" : "flex flex-col"}`}>
          <button onClick={onClose} className="absolute top-4 right-4 text-book-gold/60 hover:text-book-gold z-10 transition-colors" aria-label="Fechar mensagens">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {!selectedFriend ? (
            <div className="flex-1 flex flex-col items-center justify-center text-book-paper/40">
              <svg className="w-16 h-16 mb-4 text-book-gold/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="font-display text-xl text-book-gold/50">Selecione um companheiro</p>
              <p className="text-sm">Para iniciar uma conversa mágica.</p>
            </div>
          ) : (
            <>
              {/* Header do Chat */}
              <div className="flex shrink-0 items-center gap-3 border-b border-book-gold/20 bg-black/10 p-4 pr-14">
                <button
                  type="button"
                  onClick={() => setSelectedFriend(null)}
                  className="text-book-gold transition-colors hover:text-white md:hidden"
                  aria-label="Voltar para contactos"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-book-gold font-display text-xl">{selectedFriend.nickname}</span>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-book-gold/20">
                {messages.map((msg, idx) => {
                  const isMine = msg.sender_id === currentUser.id;
                  return (
                    <div key={msg.id || idx} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isMine
                          ? "bg-book-gold text-book-bg rounded-br-none"
                          : "bg-black/40 border border-book-gold/20 text-book-paper rounded-bl-none"
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <span className={`text-[9px] block mt-1 ${isMine ? "text-book-bg/70 text-right" : "text-book-gold/50 text-left"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-book-gold/20 bg-black/20 shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escreva a sua mensagem..."
                    className="flex-1 bg-black/40 border border-book-gold/30 rounded-md text-book-paper px-4 py-3 focus:outline-none focus:border-book-gold transition-colors text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-book-gold/10 text-book-gold border border-book-gold/30 px-6 py-3 rounded-md hover:bg-book-gold hover:text-book-bg transition-colors disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </form>
                {sendError ? (
                  <p className="mt-2 text-xs text-red-300">{sendError}</p>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
