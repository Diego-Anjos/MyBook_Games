"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Camera, Image, Trash2, User, X } from "lucide-react";
import { ensureNumericUid } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

type UserProfileModalProps = {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  initialNickname?: string;
  initialEmail?: string;
  initialBirthDate?: string;
  initialPlatform?: string;
  initialAvatarUrl?: string;
  onAvatarChange?: (url: string) => void;
};

const PLATFORM_OPTIONS = ["PC", "PlayStation", "Xbox", "Nintendo"] as const;

function platformOption(value: string | null | undefined): string {
  const raw = (value || "").trim().toLowerCase();
  if (raw === "playstation" || raw === "ps" || raw === "ps4" || raw === "ps5") {
    return "PlayStation";
  }
  if (raw === "xbox") return "Xbox";
  if (raw === "nintendo" || raw === "switch") return "Nintendo";
  return PLATFORM_OPTIONS.find((option) => option.toLowerCase() === raw) || "PC";
}

function CornerFiligree({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 48"
      className={`pointer-events-none absolute h-10 w-10 text-book-gold sm:h-12 sm:w-12 ${className}`}
      fill="none"
    >
      <path
        d="M4 28 V10 H22"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M4 18 Q14 14 18 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="8" cy="12" r="1.4" fill="currentColor" />
      <path
        d="M10 22 C14 18 20 14 26 12"
        stroke="currentColor"
        strokeWidth="0.9"
        opacity="0.55"
      />
    </svg>
  );
}

function ProfileField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  disabled = false,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange?: (value: string) => void;
  autoComplete?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="font-display text-[0.65rem] tracking-[0.18em] text-book-blue/55 uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={
          onChange ? (e) => onChange(e.target.value) : undefined
        }
        autoComplete={autoComplete}
        disabled={disabled}
        className={`
          w-full bg-transparent py-2 font-body outline-none
          border-0 border-b border-book-blue/30
          transition
          placeholder:text-book-blue/30
          ${
            disabled
              ? "cursor-not-allowed text-book-blue/55"
              : "text-book-blue focus:border-book-blue"
          }
          ${type === "date" ? "[color-scheme:light]" : ""}
        `}
      />
    </div>
  );
}

export default function UserProfileModal({
  open,
  onClose,
  initialName = "",
  initialNickname = "Escritor",
  initialEmail = "",
  initialBirthDate = "",
  initialPlatform = "",
  initialAvatarUrl = "",
  onAvatarChange,
}: UserProfileModalProps) {
  const router = useRouter();
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialName);
  const [nickname, setNickname] = useState(initialNickname);
  const [email, setEmail] = useState(initialEmail);
  const [birthDate, setBirthDate] = useState("");
  const [platform, setPlatform] = useState(initialPlatform || "PC");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uid, setUid] = useState("");

  // Sync when modal opens with fresh props
  useEffect(() => {
    if (!open) return;
    
    // Atualize os estados apenas com os valores que chegam nas props
    setName(initialName || "");
    setNickname(initialNickname || "");
    
    // Se você tiver adicionado initialBirthDate ou email como props, 
    // atualize-os aqui também (descomente se existirem):
    // if (initialBirthDate !== undefined) setBirthDate(initialBirthDate);
    // if (initialEmail !== undefined) setEmail(initialEmail);
    
  }, [open, initialName, initialNickname]); // MANTENHA EXATAMENTE ASSIM, SEM VARIÁVEIS ADICIONAIS OU CONDICIONAIS

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving && !isSuccess) onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, saving, isSuccess]);

  useEffect(() => {
    if (!open) return;
    let active = true;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;

      setEmail(user.email || "");
      setUid("");

      const { data } = await supabase
        .from("profiles")
        .select("name, nickname, platform, avatar_url, cover_url, birth_date")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      if (data) {
        setName(data.name ?? "");
        setNickname(data.nickname ?? "");
        setPlatform(platformOption(data.platform || initialPlatform));
      }
      setAvatarUrl(data?.avatar_url || initialAvatarUrl || "");
      setCoverUrl(data?.cover_url || "");
      setBirthDate(data?.birth_date?.slice(0, 10) || "");

      const assignedUid = await ensureNumericUid(user.id);
      if (active && assignedUid) setUid(assignedUid);
    })();

    return () => {
      active = false;
    };
  }, [open, initialAvatarUrl]);

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Você deve selecionar uma imagem.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Sessão expirada. Entre novamente para alterar o retrato.");
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(data.publicUrl);
      onAvatarChange?.(data.publicUrl);
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao enviar a imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const uploadCover = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setIsCoverUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Você deve selecionar uma imagem.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `cover_${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Sessão expirada. Entre novamente para alterar a capa.");
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_url: data.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setCoverUrl(data.publicUrl);
    } catch (error) {
      console.error("Erro ao fazer upload da capa:", error);
      alert("Erro ao enviar a capa. Tente novamente.");
    } finally {
      setIsCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  async function handleRemoveAvatar() {
    setAvatarUrl("");
    onAvatarChange?.("");
    if (fileInputRef.current) fileInputRef.current.value = "";

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);

    if (error) {
      console.error("Erro ao remover o retrato:", error);
      alert("Erro ao remover a imagem. Tente novamente.");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }
      console.log("========== INICIANDO ATUALIZAÇÃO DO PERFIL ==========");

      if (password) {
        if (password !== confirmPassword) {
          alert("As novas senhas não coincidem.");
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password,
        });

        if (passwordError) {
          console.error("Erro ao atualizar senha:", passwordError);
          alert("Erro ao atualizar senha: " + passwordError.message);
          return;
        }
        console.log("Senha atualizada com sucesso no Auth.");
      }

      const profilePayload = {
        id: user.id,
        name: name,
        nickname: nickname,
        platform: platform,
      };

      const { data: updatedData, error: profileError } = await supabase
        .from("profiles")
        .upsert(profilePayload)
        .select();

      console.log("Resultado real do banco de dados:", updatedData);

      if (profileError) {
        console.error("Erro ao atualizar tabela profiles:", profileError);
        alert("Erro ao salvar os dados do perfil: " + profileError.message);
        return;
      }
      console.log("Dados do perfil atualizados com sucesso.");

      setPassword("");
      setConfirmPassword("");

      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        router.refresh();
        onClose();
      }, 2000);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Fechar perfil"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={() => {
          if (!saving && !isSuccess) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="
          relative z-10 flex max-h-[min(92dvh,44rem)] w-full max-w-lg
          flex-col overflow-hidden rounded-sm bg-book-paper
          shadow-[0_28px_80px_rgba(0,0,0,0.65),inset_0_0_50px_rgba(201,168,76,0.07)]
        "
      >
        {/* Textura do pergaminho */}
        <div
          aria-hidden
          className="
            pointer-events-none absolute inset-0 rounded-sm opacity-[0.35] mix-blend-multiply
            bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.45%22/%3E%3C/svg%3E')]
          "
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-3 border border-book-gold/55 sm:inset-4"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-4 border border-book-gold/30 sm:inset-5"
        />

        <CornerFiligree className="top-4 left-4 sm:top-5 sm:left-5" />
        <CornerFiligree className="top-4 right-4 rotate-90 sm:top-5 sm:right-5" />
        <CornerFiligree className="bottom-4 left-4 -rotate-90 sm:bottom-5 sm:left-5" />
        <CornerFiligree className="right-4 bottom-4 rotate-180 sm:right-5 sm:bottom-5" />

        <button
          type="button"
          onClick={() => {
            if (!saving && !isSuccess) onClose();
          }}
          disabled={saving || isSuccess}
          className={`
            absolute top-5 right-5 z-20 flex h-9 w-9 items-center justify-center
            transition disabled:opacity-40 sm:top-6 sm:right-6
            ${
              coverUrl
                ? "rounded-sm border border-book-gold/30 bg-black/40 text-book-paper backdrop-blur-sm hover:bg-black/60"
                : "text-book-blue/45 hover:text-book-blue"
            }
          `}
          aria-label="Fechar"
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <div className="relative flex flex-col items-center px-6 pt-14 pb-6 sm:px-10">
            <input
              type="file"
              id="avatar"
              accept="image/*"
              onChange={(event) => void uploadAvatar(event)}
              disabled={isUploading}
              ref={fileInputRef}
              className="hidden"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(event) => void uploadCover(event)}
              disabled={isCoverUploading}
              ref={coverInputRef}
              className="hidden"
            />

            <div className="absolute inset-0 z-0 overflow-hidden rounded-t-sm">
              {coverUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL pública do Storage */}
                  <img
                    src={coverUrl}
                    alt="Capa"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#F3E8D4]" />
                </>
              ) : (
                <div className="absolute inset-0 bg-book-gold/5" />
              )}
            </div>

            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={isCoverUploading}
              className="
                absolute top-5 left-5 z-10 flex items-center gap-2 rounded-sm
                border border-book-gold/30 bg-black/40 px-3 py-1.5
                text-[10px] tracking-widest text-book-paper uppercase
                backdrop-blur-sm transition-colors
                hover:bg-black/60 disabled:cursor-wait disabled:opacity-60
                sm:top-6 sm:left-6
              "
            >
              <Image className="h-3 w-3" />
              {isCoverUploading ? "Enviando..." : "Alterar Capa"}
            </button>

            <div className="relative z-10 flex w-full flex-col items-center">
              <p
                className={`font-display text-[0.65rem] tracking-[0.3em] uppercase ${
                  coverUrl
                    ? "text-book-gold drop-shadow-md"
                    : "text-book-blue/45"
                }`}
              >
                Página de Introdução
              </p>
              <h2
                id={titleId}
                className={`mt-2 font-display text-3xl ${
                  coverUrl
                    ? "text-book-paper drop-shadow-md"
                    : "text-book-blue"
                }`}
              >
                Ficha do Escritor
              </h2>
              <div
                aria-hidden
                className="mx-auto mt-3 mb-6 h-px w-16 bg-gradient-to-r from-transparent via-book-gold/60 to-transparent"
              />

              <div className="flex flex-col items-center">
                <div
                  className="
                    relative mb-3 flex h-28 w-28 items-center justify-center overflow-hidden
                    rounded-full border-2 border-book-gold bg-book-blue-light
                    shadow-[0_8px_24px_rgba(15,28,46,0.2)]
                    sm:h-32 sm:w-32
                  "
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL pública do Storage
                    <img
                      src={avatarUrl}
                      alt="Retrato do Escritor"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User
                      className="h-12 w-12 text-book-gold/70 sm:h-14 sm:w-14"
                      strokeWidth={1.25}
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="
                      inline-flex items-center gap-1.5 font-body text-sm
                      text-book-blue/70 underline decoration-book-gold/40 underline-offset-4
                      transition hover:text-book-blue hover:decoration-book-gold
                      disabled:cursor-wait disabled:opacity-60
                    "
                  >
                    <Camera className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {isUploading ? "Enviando..." : "Alterar Retrato"}
                  </button>
                  {avatarUrl && !isUploading ? (
                    <button
                      type="button"
                      onClick={() => void handleRemoveAvatar()}
                      className="
                        inline-flex items-center gap-1.5 font-body text-sm
                        text-book-blue/50 underline decoration-book-blue/20 underline-offset-4
                        transition hover:text-book-blue/80
                      "
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Remover
                    </button>
                  ) : null}
                </div>

                <div className="flex items-center justify-center gap-2 my-2">
                  <span className="text-xs font-mono tracking-widest text-book-gold/80">
                    UID: {uid || "Carregando..."}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (uid) {
                        navigator.clipboard.writeText(uid);
                        alert("UID copiado para a área de transferência!");
                      }
                    }}
                    className="text-[10px] text-book-gold hover:text-white underline tracking-wider"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Campos */}
          <div className="flex flex-col gap-5 px-6 sm:gap-6 sm:px-10">
            <ProfileField
              id="profile-name"
              label="Nome"
              value={name}
              onChange={(value) => setName(value)}
              autoComplete="name"
            />
            <ProfileField
              id="profile-nickname"
              label="Nickname"
              value={nickname}
              onChange={(value) => setNickname(value)}
              autoComplete="username"
            />
            <ProfileField
              id="profile-email"
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              disabled
            />
            <ProfileField
              id="profile-birth-date"
              label="Data de Nascimento"
              type="date"
              value={birthDate}
              autoComplete="bday"
              disabled
            />
            <div className="mb-4">
              <label
                htmlFor="profile-platform"
                className="block text-[10px] text-book-gold/80 tracking-widest uppercase mb-1"
              >
                Plataforma Principal
              </label>
              <select
                id="profile-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-transparent border-b border-book-gold/30 pb-2 text-book-blue focus:outline-none focus:border-book-gold transition-colors text-sm cursor-pointer"
              >
                <option value="PC" className="bg-book-bg text-book-paper">PC</option>
                <option value="PlayStation" className="bg-book-bg text-book-paper">PlayStation</option>
                <option value="Xbox" className="bg-book-bg text-book-paper">Xbox</option>
                <option value="Nintendo" className="bg-book-bg text-book-paper">Nintendo</option>
              </select>
            </div>
            <ProfileField
              id="profile-password"
              label="Nova Senha"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
            <ProfileField
              id="profile-confirm-password"
              label="Confirmar Senha"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />
          </div>

          {/* Ações */}
          <div className="mt-8 flex shrink-0 flex-col items-center gap-4 px-6 pb-8 sm:mt-10 sm:flex-row sm:justify-between sm:px-10 sm:pb-10">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                font-body text-sm text-book-blue/70
                underline decoration-book-blue/25 underline-offset-4
                transition hover:text-book-blue hover:decoration-book-blue/50
                disabled:opacity-40
              "
            >
              Voltar para Biblioteca
            </button>

            <button
              type="submit"
              disabled={saving}
              className="
                inline-flex min-h-11 min-w-[10rem] items-center justify-center
                bg-gradient-to-r from-[#C9A84C] to-[#E5C97A]
                px-6 py-2.5
                font-display text-sm tracking-wide text-book-blue
                shadow-[0_4px_16px_rgba(201,168,76,0.35)]
                transition hover:brightness-105
                disabled:cursor-wait disabled:opacity-80
              "
            >
              {saving ? "Gravando..." : "Salvar Registros"}
            </button>
          </div>
        </form>

        {isSuccess && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-book-bg/95 backdrop-blur-sm rounded-lg">
            <div className="text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 border-2 border-book-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-book-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-display text-book-gold text-2xl mb-1">Registros Atualizados</h3>
              <p className="text-book-paper/80 text-sm">A sua ficha foi reescrita com sucesso.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
