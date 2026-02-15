import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ChevronRight,
    Route,
    MapPin,
    Globe
} from "lucide-react";

import { WebGLShader } from "../components/ui/web-gl-shader";
import { LiquidButton } from "../components/ui/liquid-glass-button";
import { BentoGrid } from "../components/ui/bento-grid";

export const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 font-sans overflow-x-hidden">
            {/* Navbar */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 backdrop-blur-xl border-b border-white/5"
            >
                <div className="flex items-center gap-3">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="h-10 w-10 overflow-hidden rounded-xl bg-indigo-600/10 shadow-lg shadow-indigo-600/10 cursor-pointer"
                    >
                        <img
                            src="/(pictoicon) - Minimal map-style logo Go2Gether.png"
                            alt="Go2Gether Logo"
                            className="h-full w-full object-contain p-1.5"
                        />
                    </motion.div>
                    <span className="text-xl font-black tracking-tighter uppercase">Go2Gether</span>
                </div>
                <button
                    onClick={() => navigate("/auth")}
                    className="group relative flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition-all hover:bg-neutral-200 active:scale-95"
                >
                    Get Started
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
            </motion.nav>

            {/* Hero Section */}
            <section id="hero" className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden pt-20">
                <WebGLShader />

                <div className="relative z-10 w-full max-w-5xl px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative border border-white/10 p-2 rounded-3xl backdrop-blur-sm bg-black/20 overflow-hidden"
                    >
                        <main className="relative border border-white/10 py-20 px-6 rounded-2xl overflow-hidden bg-gradient-to-b from-white/5 to-transparent">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mb-8 flex items-center justify-center gap-2"
                            >
                                <span className="relative flex h-3 w-3 items-center justify-center">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                                </span>
                                <p className="text-[10px] font-bold tracking-[0.4em] text-indigo-400 uppercase">System Status: Optimal</p>
                            </motion.div>

                            <h1 className="mb-6 text-white text-center text-6xl font-black tracking-tighter sm:text-8xl lg:text-9xl leading-[0.8]">
                                Travel <br />
                                <span className="italic text-indigo-500">Together</span>
                            </h1>

                            <p className="mx-auto mb-12 max-w-2xl text-center text-lg md:text-xl text-white/60 font-medium leading-relaxed">
                                The world's most advanced group trip coordination platform.
                                Real-time grid sync, encrypted communication, and automated arrival protocols.
                            </p>

                            <div className="flex justify-center">
                                <LiquidButton
                                    onClick={() => navigate("/auth")}
                                    className="text-white border border-white/20 rounded-full hover:border-indigo-500/50 transition-colors"
                                    size={'xl'}
                                >
                                    Let's Go
                                </LiquidButton>
                            </div>
                        </main>
                    </motion.div>
                </div>
            </section>


            {/* Features Grid */}
            < section id="features" className="relative py-48 px-8 bg-black" >
                <div className="mx-auto max-w-7xl">
                    <div className="mb-32 flex flex-col items-center text-center">
                        <motion.div
                            whileInView={{ rotate: 360 }}
                            transition={{ duration: 2, ease: "circOut" }}
                            className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600/10 text-indigo-500 shadow-inner"
                        >
                            <Route size={32} />
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-8 text-5xl font-black sm:text-7xl tracking-tighter text-white"
                        >
                            Master Your <span className="text-indigo-500 italic">Journey</span>.
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="max-w-2xl text-xl text-neutral-500 leading-relaxed font-medium"
                        >
                            Every feature engineered for perfect group arrival. No one gets left behind.
                        </motion.p>
                    </div>

                    <BentoGrid />
                </div>
            </section >

            {/* Enhanced CTA Section */}
            <section id="cta" className="relative py-64 px-8 overflow-hidden bg-black">
                {/* Dynamic Background Elements */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Pulsing Aura */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.1, 0.2, 0.1]
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 blur-[150px] rounded-full"
                    />

                    {/* Floating Icons */}
                    {[
                        { Icon: MapPin, color: "text-indigo-500", top: "15%", left: "10%", delay: 0 },
                        { Icon: Globe, color: "text-emerald-500", top: "25%", right: "15%", delay: 2 },
                        { Icon: Route, color: "text-purple-500", bottom: "20%", left: "20%", delay: 4 },
                        { Icon: MapPin, color: "text-sky-500", bottom: "15%", right: "10%", delay: 1 },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 0.15 }}
                            animate={{
                                y: [0, -40, 0],
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{
                                duration: 6 + i,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: item.delay
                            }}
                            style={{
                                position: 'absolute',
                                top: item.top,
                                left: item.left,
                                right: item.right,
                                bottom: item.bottom
                            }}
                            className={item.color}
                        >
                            <item.Icon size={48} />
                        </motion.div>
                    ))}
                </div>

                <div className="mx-auto max-w-4xl text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                    >
                        <h2 className="mb-12 text-6xl font-black tracking-tighter sm:text-8xl lg:text-9xl text-white leading-none">
                            Ready for the <br />
                            <motion.span
                                animate={{ color: ["#ffffff", "#6366f1", "#ffffff"] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="italic"
                            >
                                road?
                            </motion.span>
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        <motion.button
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0 0 80px rgba(99, 102, 241, 0.4)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate("/auth")}
                            className="group relative inline-flex items-center gap-6 rounded-full bg-white px-16 py-8 text-3xl font-black text-black transition-all"
                        >
                            <span className="relative z-10">Start Your First Trip</span>
                            <ChevronRight className="relative z-10 transition-transform group-hover:translate-x-4 text-indigo-600" size={36} />

                            {/* Inner Glow Effect */}
                            <div className="absolute inset-0 rounded-full bg-indigo-500/0 group-hover:bg-indigo-500/10 transition-colors" />
                        </motion.button>
                    </motion.div>
                </div>

                {/* Bottom Border Glow */}
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </section>

            {/* Premium Footer */}
            <footer className="relative border-t border-white/5 bg-black pt-32 pb-16 overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full" />

                <div className="mx-auto max-w-7xl px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
                        {/* Brand Column */}
                        <div className="lg:col-span-4 flex flex-col gap-8">
                            <a href="#hero" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <div className="h-12 w-12 overflow-hidden rounded-2xl bg-indigo-600/10 p-2 border border-indigo-500/20 shadow-lg shadow-indigo-600/5">
                                    <img
                                        src="/(pictoicon) - Minimal map-style logo Go2Gether.png"
                                        alt="Go2Gether Logo"
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                                <span className="text-3xl font-black tracking-tighter text-white uppercase italic">Go2Gether</span>
                            </a>
                            <p className="max-w-xs text-lg text-neutral-400 font-medium leading-relaxed">
                                Redefining the way groups explore the world. Real-time coordination, absolute privacy, and seamless arrival.
                            </p>
                            <div className="flex gap-4">
                                {["GitHub"].map((social) => (
                                    <motion.a
                                        key={social}
                                        href="https://github.com/PradeepMolleti-09"
                                        whileHover={{ y: -4, color: "#6366f1" }}
                                        className="text-sm font-bold text-neutral-500 transition-colors uppercase tracking-widest"
                                    >
                                        {social}
                                    </motion.a>
                                ))}
                            </div>
                        </div>

                        {/* Links Columns */}
                        <div className="lg:col-span-8 flex justify-end">
                            <div className="flex flex-col gap-6">
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Platform</span>
                                <ul className="flex flex-col gap-4">
                                    {["Navigation", "Secure Rooms", "Neural Gallery", "Arrival Sync"].map((link) => (
                                        <li key={link}>
                                            <a href="#features" className="text-neutral-400 hover:text-white transition-colors font-medium text-right lg:text-left">{link}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-mono text-neutral-600 tracking-widest uppercase">
                                © 2026 Go2Gether Technologies. All Rights Reserved.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-700 font-mono tracking-widest">
                                <span className="h-1 w-1 rounded-full bg-indigo-500/30" />
                                PROPRIETARY GRID-SYNC PROTOCOL V4.1
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase">
                                Illustration by <a href="https://github.com/PradeepMolleti-09" target="_blank" className="text-indigo-500/50 hover:text-indigo-500 transition-colors">PRADEEP MOLLETI</a>
                            </div>
                            <div className="h-8 w-px bg-white/5" />
                            <div className="flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-white/40 tracking-widest uppercase">Nodes Online</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Bottom Noise */}
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />
            </footer>
        </div>
    );
};
