import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  QrCode,
  Shield,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";
import { useAuthContext } from "../hooks/useAuthContext";

type LoginStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "success" };

export function LoginPage() {
  const { loginWithPassword, loginWithQr } = useAuthContext();
  const { actor } = useActor();

  // Password state
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwStatus, setPwStatus] = useState<LoginStatus>({ state: "idle" });

  // QR / ID card state
  const [qrStatus, setQrStatus] = useState<LoginStatus>({ state: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pending QR text that arrived before the actor was ready
  const [pendingQrText, setPendingQrText] = useState<string | null>(null);

  const isLoadingAny =
    pwStatus.state === "loading" || qrStatus.state === "loading";

  // ── Password login ──────────────────────────────────────────────────────────
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || !actor) return;
    setPwStatus({ state: "loading" });
    const ok = await loginWithPassword(password);
    if (!ok) {
      setPwStatus({
        state: "error",
        message: "Incorrect password. Try again.",
      });
    } else {
      setPwStatus({ state: "success" });
    }
  }

  // ── QR decode ───────────────────────────────────────────────────────────────
  const processImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setQrStatus({
          state: "error",
          message: "Please upload a PNG or JPG image.",
        });
        return;
      }

      setQrStatus({ state: "loading" });
      setPreviewUrl(URL.createObjectURL(file));

      try {
        const bitmap = await createImageBitmap(file);

        // Use native BarcodeDetector API where available.
        interface BarcodeResult {
          rawValue: string;
        }
        interface BarcodeDetectorInstance {
          detect(image: ImageBitmap): Promise<BarcodeResult[]>;
        }
        interface BarcodeDetectorConstructor {
          new (options: { formats: string[] }): BarcodeDetectorInstance;
        }
        const BarcodeDetectorCtor = (globalThis as Record<string, unknown>)
          .BarcodeDetector as BarcodeDetectorConstructor | undefined;

        let qrText: string | null = null;

        if (BarcodeDetectorCtor) {
          const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
          const codes = await detector.detect(bitmap);
          if (codes.length > 0) {
            qrText = codes[0].rawValue.trim();
          }
        }
        bitmap.close();

        if (!qrText) {
          setQrStatus({
            state: "error",
            message:
              "No QR code found in image. Make sure the card is clear and well-lit.",
          });
          return;
        }

        if (!actor) {
          // Actor not ready yet -- hold the QR text and show a waiting indicator
          setPendingQrText(qrText);
          setQrStatus({ state: "loading" });
          return;
        }

        const member = await actor.getMemberByQrId(qrText);
        if (!member) {
          setQrStatus({
            state: "error",
            message: `QR ID "${qrText}" is not registered in this system.`,
          });
          return;
        }

        await loginWithQr(member.id);
        setQrStatus({ state: "success" });
      } catch {
        setQrStatus({
          state: "error",
          message: "Failed to process image. Please try a clearer photo.",
        });
      }
    },
    [actor, loginWithQr],
  );

  // When actor becomes available and we have a pending QR lookup, retry it
  useEffect(() => {
    if (!actor || !pendingQrText) return;
    let cancelled = false;
    (async () => {
      try {
        const member = await actor.getMemberByQrId(pendingQrText);
        if (cancelled) return;
        if (!member) {
          setQrStatus({
            state: "error",
            message: `QR ID "${pendingQrText}" is not registered in this system.`,
          });
        } else {
          await loginWithQr(member.id);
          setQrStatus({ state: "success" });
        }
      } catch {
        if (!cancelled)
          setQrStatus({
            state: "error",
            message: "Failed to process image. Please try a clearer photo.",
          });
      } finally {
        if (!cancelled) setPendingQrText(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actor, pendingQrText, loginWithQr]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  }

  return (
    <div className="min-h-screen bg-login-bg flex flex-col items-center justify-center relative overflow-hidden px-4 py-10">
      {/* Atmospheric background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.78 0.17 75) 1px, transparent 1px), linear-gradient(90deg, oklch(0.78 0.17 75) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Top amber halo */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] opacity-[0.07] blur-[100px]"
          style={{ background: "oklch(0.78 0.17 75)" }}
        />
        {/* Bottom glow */}
        <div
          className="absolute bottom-0 right-1/3 w-[400px] h-[200px] opacity-[0.04] blur-[80px]"
          style={{ background: "oklch(0.7 0.2 55)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <h1 className="text-5xl font-black tracking-[0.3em] font-display text-amber-primary uppercase mb-2 drop-shadow-[0_0_30px_oklch(0.78_0.17_75/0.4)]">
              XUTION
            </h1>
            <p className="text-xs tracking-[0.25em] font-mono text-amber-muted uppercase">
              CENTRAL COMMAND PLATFORM
            </p>
          </motion.div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-4 h-px bg-gradient-to-r from-transparent via-amber-border to-transparent"
          />
        </div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="login-card rounded-sm p-6 space-y-5"
        >
          {/* Card label */}
          <p className="text-[10px] tracking-[0.2em] font-mono text-amber-muted text-center uppercase">
            ENTER PASSWORD OR UPLOAD ID — ONLY ONE REQUIRED
          </p>

          {/* ── Password section ────────────────────────────── */}
          <form onSubmit={handlePasswordLogin} className="space-y-3">
            <Label
              htmlFor="login-password"
              className="text-[10px] tracking-[0.2em] font-mono text-amber-primary uppercase"
            >
              PASSWORD
            </Label>
            <div className="relative">
              <Input
                id="login-password"
                data-ocid="login.input"
                type={showPassword ? "text" : "password"}
                placeholder="Enter access password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (pwStatus.state === "error")
                    setPwStatus({ state: "idle" });
                }}
                disabled={isLoadingAny}
                className="login-input pr-10 font-mono"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-muted hover:text-amber-primary transition-colors"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {pwStatus.state === "error" && (
                <motion.p
                  key="pw-err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  data-ocid="login.error_state"
                  className="flex items-center gap-1.5 text-xs text-destructive font-mono"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {pwStatus.message}
                </motion.p>
              )}
            </AnimatePresence>
          </form>

          {/* ── OR divider ──────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-amber-border/40" />
            <span className="text-[10px] tracking-[0.2em] font-mono text-amber-muted">
              OR
            </span>
            <div className="flex-1 h-px bg-amber-border/40" />
          </div>

          {/* ── QR / ID Card section ─────────────────────────── */}
          <div className="space-y-3">
            <Label className="text-[10px] tracking-[0.2em] font-mono text-amber-primary uppercase flex items-center gap-2">
              <QrCode className="w-3.5 h-3.5" />
              ID VERIFICATION
            </Label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleFileChange}
              data-ocid="login.upload_button"
            />

            {/* Drop zone */}
            <button
              type="button"
              data-ocid="login.dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              disabled={isLoadingAny}
              className={`w-full rounded-sm border-2 border-dashed transition-all p-5 text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-border ${
                dragOver
                  ? "border-amber-primary bg-amber-primary/5"
                  : "border-amber-border/50 hover:border-amber-primary/60 hover:bg-amber-primary/3"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {previewUrl && qrStatus.state !== "error" ? (
                <div className="flex items-center justify-center gap-3">
                  <img
                    src={previewUrl}
                    alt="Uploaded ID card"
                    className="w-16 h-10 object-cover rounded border border-amber-border/30"
                  />
                  <div className="text-left">
                    <p className="text-xs font-mono text-amber-primary">
                      Card loaded
                    </p>
                    <p className="text-[10px] font-mono text-amber-muted">
                      Click to change
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Upload className="w-5 h-5 text-amber-muted mx-auto" />
                  <p className="text-xs font-mono text-amber-primary">
                    Upload QR ID Card
                  </p>
                  <p className="text-[10px] font-mono text-amber-muted">
                    PNG, JPG accepted — angled or slightly blurry cards OK
                  </p>
                </div>
              )}
            </button>

            <AnimatePresence mode="wait">
              {qrStatus.state === "loading" && (
                <motion.p
                  key="qr-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  data-ocid="login.loading_state"
                  className="flex items-center gap-1.5 text-xs font-mono text-amber-muted"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {pendingQrText
                    ? "Connecting to backend..."
                    : "Scanning QR code..."}
                </motion.p>
              )}
              {qrStatus.state === "error" && (
                <motion.p
                  key="qr-err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  data-ocid="login.error_state"
                  className="flex items-center gap-1.5 text-xs text-destructive font-mono"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {qrStatus.message}
                </motion.p>
              )}
              {qrStatus.state === "success" && (
                <motion.p
                  key="qr-ok"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  data-ocid="login.success_state"
                  className="flex items-center gap-1.5 text-xs text-success font-mono"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ID verified. Entering system...
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* ── Main CTA button ─────────────────────────────── */}
          <Button
            data-ocid="login.primary_button"
            type="button"
            onClick={handlePasswordLogin}
            disabled={isLoadingAny || !password.trim()}
            className="w-full h-11 login-cta font-mono font-bold tracking-[0.15em] uppercase text-sm"
          >
            {pwStatus.state === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                VERIFYING...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                ACCESS XUTION
              </>
            )}
          </Button>

          {/* Footer note */}
          <p className="text-center text-[10px] font-mono text-amber-muted leading-relaxed">
            No account?{" "}
            <span className="text-amber-primary">
              Contact a Class 6 administrator
            </span>{" "}
            to have an ID created for you.
          </p>
        </motion.div>

        {/* Bottom terminal footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-[10px] font-mono text-amber-muted/50 mt-6 tracking-[0.2em] uppercase"
        >
          XUTION SECURE TERMINAL v1.0
        </motion.p>
      </motion.div>
    </div>
  );
}
