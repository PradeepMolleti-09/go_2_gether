import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
    isLoading?: boolean;
}

export const ConfirmationModal = ({
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    isDestructive = false,
    isLoading = false,
}: ConfirmationModalProps) => {
    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-white/10 bg-neutral-900 shadow-2xl"
                    >
                        <div className="p-8">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                                <AlertTriangle size={28} />
                            </div>

                            <h2 className="mb-2 text-2xl font-black tracking-tight text-white">
                                {title}
                            </h2>
                            <p className="mb-8 text-sm font-medium text-neutral-400">
                                {message}
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        console.log("🟢 Confirmation modal - Confirm button clicked");
                                        onConfirm();
                                    }}
                                    disabled={isLoading}
                                    className={`w-full rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${isDestructive
                                        ? "bg-red-600 text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                        : "bg-white text-black hover:bg-neutral-200"
                                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {isLoading ? "Processing..." : confirmLabel}
                                </button>
                                <button
                                    onClick={onCancel}
                                    disabled={isLoading}
                                    className={`w-full rounded-2xl border border-white/10 bg-white/5 py-4 text-xs font-black uppercase tracking-[0.2em] text-neutral-300 transition-all hover:bg-white/10 active:scale-95 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {cancelLabel}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={onCancel}
                            className="absolute right-6 top-6 rounded-full bg-white/5 p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};
