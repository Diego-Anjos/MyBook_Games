"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationsUpdate: () => void;
}

export default function NotificationsModal({ isOpen, onClose, onNotificationsUpdate }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select(`
        id, type, is_read, created_at, sender_id,
        profiles!notifications_sender_id_fkey (id, nickname, avatar_url)
      `)
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    if (data && !error) setNotifications(data);
  };

  const handleAccept = async (notificationId: string, senderId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 1. Atualiza a linha original de pending → accepted
      const { error: updateError } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("user_id", senderId)
        .eq("friend_id", user.id);

      if (updateError) throw updateError;

      // 2. Insere a linha REVERSA já aceita — corrige o bug de unidirecionalidade
      //    (sem ela o remetente não enxerga o amigo na lista)
      const { error: insertError } = await supabase
        .from("friendships")
        .insert({ user_id: user.id, friend_id: senderId, status: "accepted" });

      // ignora conflito de chave única caso a linha já exista
      if (insertError && insertError.code !== "23505") throw insertError;

      // 3. Notifica o remetente que o convite foi aceito
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: senderId,
        sender_id: user.id,
        type: "friend_accepted",
        content: "aceitou seu pedido para entrar na guilda!",
      });

      if (notifError) console.error("Erro ao criar notificação de aceitação:", notifError);

      markAsRead(notificationId);
    } catch (err: unknown) {
      console.error("Erro ao aceitar pedido de amizade:", err);
    }
  };

  const handleReject = async (notificationId: string, senderId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Remove o pedido pendente
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("user_id", senderId)
        .eq("friend_id", user.id);

      if (error) throw error;
      markAsRead(notificationId);
    } catch (err: unknown) {
      console.error("Erro ao recusar pedido de amizade:", err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
    fetchNotifications();
    onNotificationsUpdate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-book-bg border border-book-gold/30 rounded-lg w-full max-w-lg md:max-w-xl min-h-[400px] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-book-gold/60 hover:text-book-gold">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4 md:p-8 pb-6 border-b border-book-gold/20 shrink-0">
          <h2 className="font-display text-3xl text-book-gold mb-2">Mensageiros</h2>
          <p className="text-book-paper/60 text-sm">Cartas e convites de outros escritores.</p>
        </div>

        <div className="px-4 md:px-8 py-6 flex-1 overflow-y-auto overscroll-contain touch-pan-y space-y-4">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-book-paper/40">
              <p className="text-lg font-display text-book-gold/50">Nenhuma mensagem nova</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-black/20 border border-book-gold/20">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="w-10 h-10 rounded-full border border-book-gold/30 overflow-hidden relative">
                    {notif.profiles?.avatar_url ? (
                      <Image
                        alt={notif.profiles?.nickname || "Avatar"}
                        className="object-cover"
                        fill
                        src={notif.profiles.avatar_url}
                      />
                    ) : (
                      <div className="w-full h-full bg-book-gold/10 flex items-center justify-center text-book-gold">{notif.profiles?.nickname?.[0]}</div>
                    )}
                  </div>
                  <div>
                    {notif.type === "friend_request" && <p className="text-sm text-book-paper"><span className="text-book-gold font-medium">{notif.profiles?.nickname}</span> quer juntar-se à sua guilda.</p>}
                    {notif.type === "friend_accepted" && <p className="text-sm text-book-paper"><span className="text-book-gold font-medium">{notif.profiles?.nickname}</span> aceitou o seu convite!</p>}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  {notif.type === "friend_request" ? (
                    <>
                      <button onClick={() => handleAccept(notif.id, notif.sender_id)} className="px-4 py-1.5 bg-book-gold/10 text-book-gold border border-book-gold/30 rounded hover:bg-book-gold hover:text-book-bg text-sm">Aceitar</button>
                      <button onClick={() => handleReject(notif.id, notif.sender_id)} className="px-4 py-1.5 text-book-paper/60 border border-transparent hover:text-red-400 text-sm">Recusar</button>
                    </>
                  ) : (
                    <button onClick={() => markAsRead(notif.id)} className="px-4 py-1.5 text-book-gold/60 border border-book-gold/20 rounded hover:text-book-gold text-sm">Ciente</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
