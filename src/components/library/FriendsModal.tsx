"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import FriendProfileModal, { type FriendProfile } from "@/components/library/FriendProfileModal";
import FriendBookModal, { type FriendForBook } from "@/components/library/FriendBookModal";

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FriendsModal({ isOpen, onClose }: FriendsModalProps) {
  const [searchUid, setSearchUid] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null);
  const [bookFriend, setBookFriend] = useState<FriendForBook | null>(null);

  useEffect(() => {
    if (isOpen) fetchFriends();
  }, [isOpen]);

  const fetchFriends = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Passo 1: busca os IDs dos amigos aceitos
    const { data: friendships, error: fError } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", user.id)
      .eq("status", "accepted");

    if (fError || !friendships?.length) {
      setFriends([]);
      return;
    }

    // Passo 2: busca os perfis correspondentes
    const friendIds = friendships.map((f) => f.friend_id as string);

    const { data: profiles, error: pError } = await supabase
      .from("profiles")
      .select("id, nickname, name, avatar_url, uid")
      .in("id", friendIds);

    if (!pError) setFriends(profiles ?? []);
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchUid.length !== 8) {
      setMessage({ text: "O UID deve ter exatamente 8 números.", type: "error" });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // 1. Busca o perfil pelo UID
      // NOTA: Verificar no painel do Supabase se existe uma política RLS (Row Level Security)
      // na tabela `profiles` que permita SELECT por usuários autenticados. Se esta query
      // continuar retornando null indevidamente, a política pode estar bloqueando a leitura.
      const { data: friendProfile, error: searchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("uid", searchUid)
        .maybeSingle();

      // .maybeSingle() retorna null graciosamente quando nenhum registro é encontrado,
      // evitando o erro 406 que .single() lança via PostgREST.
      if (searchError) throw searchError;
      if (!friendProfile) throw new Error("Nenhum escritor encontrado com este UID.");
      if (friendProfile.id === user.id) throw new Error("Você não pode adicionar a si mesmo.");

      // 2. Verifica se já existe relação em QUALQUER direção (pendente ou aceita)
      const { data: existingRelation, error: relError } = await supabase
        .from("friendships")
        .select("id, status")
        .or(
          `and(user_id.eq.${user.id},friend_id.eq.${friendProfile.id}),and(user_id.eq.${friendProfile.id},friend_id.eq.${user.id})`,
        )
        .maybeSingle();

      if (relError) throw relError;
      if (existingRelation) {
        const msg =
          existingRelation.status === "accepted"
            ? "Vocês já fazem parte da mesma guilda!"
            : "Já existe um pedido pendente entre vocês.";
        throw new Error(msg);
      }

      // Insere a amizade como pendente
      const { error: insertError } = await supabase
        .from("friendships")
        .insert({ user_id: user.id, friend_id: friendProfile.id, status: "pending" });

      if (insertError) throw insertError;

      // Cria a notificação para o amigo
      await supabase
        .from("notifications")
        .insert({
          user_id: friendProfile.id,
          sender_id: user.id,
          type: "friend_request",
        });

      setMessage({ text: `Pedido de amizade enviado para ${friendProfile.nickname}!`, type: "success" });
      setSearchUid("");
      fetchFriends(); // Recarrega a lista
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-book-bg border border-book-gold/30 rounded-lg w-full max-w-lg md:max-w-2xl min-h-[500px] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-book-gold/60 hover:text-book-gold transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4 md:p-8 pb-6 border-b border-book-gold/20 shrink-0">
          <h2 className="font-display text-3xl text-book-gold mb-2">Amigos</h2>
          <p className="text-book-paper/60 text-sm">Adicione outros escritores pelo UID de 8 dígitos.</p>
        </div>

        <div className="px-4 md:px-8 py-6 shrink-0">
          <form onSubmit={handleAddFriend}>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <input
                type="text"
                placeholder="Insira o UID de 8 dígitos"
                value={searchUid}
                onChange={(e) => setSearchUid(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="flex-1 w-full bg-black/20 border border-book-gold/30 rounded-md text-book-paper px-4 py-3 focus:outline-none focus:border-book-gold font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || searchUid.length !== 8}
                className="w-full sm:w-auto bg-book-gold/10 text-book-gold border border-book-gold/30 px-4 md:px-8 py-3 rounded-md hover:bg-book-gold hover:text-book-bg transition-colors disabled:opacity-50 font-medium tracking-wide flex justify-center items-center shrink-0"
              >
                {isLoading ? "Buscando..." : "Adicionar"}
              </button>
            </div>
            {message.text && (
              <p className={`text-sm mt-3 ${message.type === "error" ? "text-red-400" : "text-green-400"}`}>
                {message.text}
              </p>
            )}
          </form>
        </div>

        <div className="px-4 md:px-8 pb-4 md:pb-8 flex-1 flex flex-col min-h-0">
          <h3 className="text-xs text-book-gold/80 uppercase tracking-widest mb-4 shrink-0">
            Sua Guilda ({friends.length})
          </h3>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {friends.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-book-paper/40 opacity-70">
                <svg className="w-16 h-16 mb-4 text-book-gold/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-lg font-display text-book-gold/50">Sua guilda está vazia</p>
                <p className="text-sm">Convide alguém pelo UID acima.</p>
              </div>
            ) : (
              friends.map((friend) => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => setSelectedFriend(friend as FriendProfile)}
                  className="w-full flex items-center justify-between p-4 rounded-lg bg-black/20 border border-book-gold/10 hover:border-book-gold/40 hover:bg-black/30 transition-colors text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-book-gold/30 overflow-hidden relative shadow-md shrink-0">
                      {friend.avatar_url ? (
                        <Image
                          alt={friend.nickname || "Companheiro"}
                          className="object-cover"
                          fill
                          src={friend.avatar_url}
                        />
                      ) : (
                        <div className="w-full h-full bg-book-gold/10 flex items-center justify-center text-book-gold text-xl font-display">
                          {friend.nickname?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-book-paper text-base font-medium group-hover:text-book-gold transition-colors">{friend.nickname}</p>
                      <p className="text-xs text-book-gold/60 font-mono tracking-widest mt-0.5">UID: {friend.uid}</p>
                    </div>
                  </div>
                  {/* Indicador visual de clicável */}
                  <svg className="w-4 h-4 text-book-gold/30 group-hover:text-book-gold/70 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Modal de perfil do amigo */}
    <FriendProfileModal
      open={selectedFriend !== null}
      friend={selectedFriend}
      onClose={() => setSelectedFriend(null)}
      onReadBook={(friend) => {
        setBookFriend({ id: friend.id, nickname: friend.nickname });
      }}
    />

    {/* Modal do livro do amigo (jogos zerados) */}
    <FriendBookModal
      open={bookFriend !== null}
      friend={bookFriend}
      onClose={() => setBookFriend(null)}
    />
    </>
  );
}
