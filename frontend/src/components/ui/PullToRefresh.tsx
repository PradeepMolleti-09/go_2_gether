import { useEffect, useRef, useState } from "react";

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

export const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const PULL_THRESHOLD = 80; // Distance to trigger refresh
    const MAX_PULL = 120; // Maximum pull distance

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let touchStartY = 0;
        let scrollTop = 0;

        const handleTouchStart = (e: TouchEvent) => {
            if (isRefreshing) return;

            scrollTop = container.scrollTop;
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (isRefreshing) return;

            const touchY = e.touches[0].clientY;
            const pullDist = touchY - touchStartY;

            // Only allow pull-to-refresh when at the top of the page
            if (scrollTop <= 0 && pullDist > 0) {
                e.preventDefault();
                const distance = Math.min(pullDist * 0.5, MAX_PULL);
                setPullDistance(distance);
            }
        };

        const handleTouchEnd = async () => {
            if (isRefreshing) return;

            if (pullDistance >= PULL_THRESHOLD) {
                setIsRefreshing(true);
                setPullDistance(PULL_THRESHOLD);

                try {
                    await onRefresh();
                } catch (error) {
                    console.error("Refresh failed:", error);
                } finally {
                    setIsRefreshing(false);
                    setPullDistance(0);
                }
            } else {
                setPullDistance(0);
            }
        };

        container.addEventListener("touchstart", handleTouchStart, { passive: true });
        container.addEventListener("touchmove", handleTouchMove, { passive: false });
        container.addEventListener("touchend", handleTouchEnd);

        return () => {
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
            container.removeEventListener("touchend", handleTouchEnd);
        };
    }, [pullDistance, isRefreshing, onRefresh]);

    const refreshOpacity = Math.min(pullDistance / PULL_THRESHOLD, 1);
    const rotation = (pullDistance / MAX_PULL) * 360;

    return (
        <div ref={containerRef} className="relative h-full w-full overflow-auto">
            {/* Pull-to-refresh indicator */}
            <div
                className="absolute left-0 right-0 top-0 z-50 flex justify-center transition-transform"
                style={{
                    transform: `translateY(${pullDistance - 60}px)`,
                    opacity: refreshOpacity,
                }}
            >
                <div className="rounded-full bg-black/80 p-3 backdrop-blur-xl border border-white/10 shadow-2xl">
                    <div
                        className={`h-6 w-6 ${isRefreshing ? "animate-spin" : ""}`}
                        style={{
                            transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="text-white"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div
                className="transition-transform duration-200"
                style={{
                    transform: `translateY(${pullDistance}px)`,
                }}
            >
                {children}
            </div>
        </div>
    );
};
