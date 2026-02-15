import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { loginWithGoogle } from "../services/authService";
import { WebGLShader } from "../components/ui/web-gl-shader";
import { Lock } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

export const Landing = () => {
  const navigate = useNavigate();
  const { setAuth, user, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/trip", { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) return null; // Or a subtle spinner

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      setError("Configuration Error: Missing Google Client ID.");
      return;
    }

    const initializeGoogle = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            setError(null);
            const { credential } = response;
            if (!credential) throw new Error("No credential from Google");

            const { user: backendUser, token } = await loginWithGoogle(credential);
            setAuth(
              {
                id: backendUser._id,
                name: backendUser.name,
                email: backendUser.email,
                avatarUrl: backendUser.avatarUrl,
              },
              token
            );
            navigate("/trip", { replace: true });
          } catch (err: any) {
            setError(err.message || "Authentication failed. Please try again.");
          }
        },
      });

      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 320
        });
      }
    };

    // Small delay to ensure script is loaded if added dynamically, 
    // though usually it's in index.html
    const timer = setTimeout(initializeGoogle, 100);
    return () => clearTimeout(timer);
  }, [navigate, setAuth]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black p-6 overflow-hidden">
      <WebGLShader />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-[48px] border border-white/10 bg-black/40 p-10 md:p-14 shadow-2xl backdrop-blur-2xl">
          {/* Subtle Glows inside card */}
          <div className="absolute -top-20 -right-20 h-40 w-40 bg-indigo-600/10 blur-[60px] rounded-full" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 bg-indigo-600/10 blur-[60px] rounded-full" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Logo Section */}
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="mb-10 h-20 w-20 overflow-hidden rounded-3xl bg-indigo-600/10 p-3 border border-indigo-500/20 shadow-xl shadow-indigo-600/5 group cursor-pointer"
            >
              <img
                src="/(pictoicon) - Minimal map-style logo Go2Gether.png"
                alt="Go2Gether Logo"
                className="h-full w-full object-contain transition-transform group-hover:scale-110"
              />
            </motion.div>

            <h1 className="mb-4 text-5xl font-black tracking-tighter text-white">
              Sync <span className="italic text-indigo-500">In</span>.
            </h1>
            <p className="mb-12 text-lg font-medium text-neutral-500 leading-tight">
              Authorize your session to access <br />
              <span className="text-neutral-300">Go2Gether encrypted rooms</span>
            </p>

            <div className="w-full space-y-8">
              {/* Google Button Container */}
              <div className="flex flex-col items-center justify-center">
                <div
                  ref={buttonRef}
                  className="min-h-[44px] transition-all hover:scale-[1.02] active:scale-[0.98]"
                />
              </div>

              {/* Status/Error */}
              {error ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs font-bold text-red-500 tracking-wide uppercase"
                >
                  {error}
                </motion.div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Secure Channel Active</span>
                </div>
              )}

              {/* Secure Footer */}
              <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-neutral-600 uppercase">
                  <Lock size={12} className="text-indigo-500/50" />
                  End-to-End Encryption
                </div>
                <p className="max-w-[180px] text-[8px] font-bold text-neutral-700 uppercase tracking-[0.3em] leading-relaxed text-center">
                  Protected by Go2Gether Grid-Sync Protocol
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Home Link */}
        <motion.button
          whileHover={{ x: -4 }}
          onClick={() => navigate("/")}
          className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white/60 transition-colors mx-auto w-fit"
        >
          ← Back to Terminal
        </motion.button>
      </motion.div>
    </div>
  );
};

