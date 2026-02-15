import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import {
    MapPin,
    Globe,
    Lock,
    Image as ImageIcon
} from "lucide-react";

export interface BentoItem {
    title: string;
    description: string;
    icon: React.ReactNode;
    status?: string;
    tags?: string[];
    meta?: string;
    cta?: string;
    colSpan?: number;
    hasPersistentHover?: boolean;
}

interface BentoGridProps {
    items?: BentoItem[];
}

export const itemsSample: BentoItem[] = [
    {
        title: "Real-Time Grid Sync",
        meta: "0.2s Latency",
        description:
            "Proprietary low-latency location protocol ensuring every member is exactly where you see them.",
        icon: <MapPin className="w-4 h-4 text-indigo-500" />,
        status: "Live",
        tags: ["Navigation", "Realtime"],
        colSpan: 2,
        hasPersistentHover: true,
    },
    {
        title: "Encrypted Rooms",
        meta: "E2EE Active",
        description: "Military-grade encryption for your private trip coordination and group data.",
        icon: <Lock className="w-4 h-4 text-emerald-500" />,
        status: "Secure",
        tags: ["Security", "Privacy"],
    },
    {
        title: "Neural Gallery",
        meta: "100+ Syncs",
        description: "Automated organization and instant sharing of trip highlights with the whole group.",
        icon: <ImageIcon className="w-4 h-4 text-purple-500" />,
        tags: ["Media", "AI"],
        colSpan: 2,
    },
    {
        title: "Global Node Network",
        meta: "24 Regions",
        description: "Worldwide coverage with edge computing for consistent performance anywhere on Earth.",
        icon: <Globe className="w-4 h-4 text-sky-500" />,
        status: "Scalable",
        tags: ["Infrastructure", "Global"],
    },
];

function BentoGrid({ items = itemsSample }: BentoGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 max-w-7xl mx-auto">
            {items.map((item, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{
                        duration: 0.5,
                        delay: index * 0.1,
                        ease: [0.21, 0.47, 0.32, 0.98]
                    }}
                    className={cn(
                        "group relative p-6 rounded-2xl overflow-hidden transition-all duration-300",
                        "border border-white/5 bg-white/[0.02] dark:bg-black/40",
                        "hover:shadow-[0_8px_30px_rgb(79,70,229,0.1)] dark:hover:shadow-[0_8px_30px_rgb(79,70,229,0.05)]",
                        "hover:-translate-y-1 will-change-transform hover:border-white/10",
                        item.colSpan === 2 ? "md:col-span-2" : "col-span-1",
                        {
                            "shadow-[0_8px_30px_rgb(79,70,229,0.05)] -translate-y-1 border-white/10":
                                item.hasPersistentHover,
                        }
                    )}
                >
                    <div
                        className={`absolute inset-0 ${item.hasPersistentHover
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                            } transition-opacity duration-500`}
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.03)_1px,transparent_1px)] bg-[length:8px_8px]" />
                    </div>

                    <div className="relative flex flex-col h-full justify-between space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                                {item.icon}
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full backdrop-blur-sm",
                                    "bg-white/5 text-indigo-400 border border-white/5",
                                    "transition-colors duration-300 group-hover:bg-indigo-500/10"
                                )}
                            >
                                {item.status || "Active"}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-bold text-white tracking-tight text-lg">
                                {item.title}
                                <span className="ml-2 text-[10px] text-neutral-500 font-mono tracking-widest uppercase">
                                    {item.meta}
                                </span>
                            </h3>
                            <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                                {item.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center space-x-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                {item.tags?.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-0.5 rounded-md border border-white/5 bg-white/5 transition-all duration-200 group-hover:text-indigo-400 group-hover:border-indigo-500/20"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            <span className="text-xs font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                {/* CTA Removed */}
                            </span>
                        </div>
                    </div>

                    <div
                        className={`absolute inset-0 -z-10 rounded-2xl p-px bg-gradient-to-br from-transparent via-white/5 to-transparent ${item.hasPersistentHover
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                            } transition-opacity duration-500`}
                    />
                </motion.div>
            ))}
        </div>
    );
}

export { BentoGrid }
