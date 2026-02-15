import { useMapContext } from "../context/MapContext";

interface TripReportModalProps {
    open: boolean;
    onClose: () => void;
}

export const TripReportModal = ({ open, onClose }: TripReportModalProps) => {
    const { tripStats, destination } = useMapContext();

    if (!open) return null;

    const durationMs = (tripStats.endTime || Date.now()) - (tripStats.startTime || Date.now());
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
            <div className="w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-neutral-900 shadow-2xl">
                <div className="p-8">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-white">Trip Summary</h2>
                        <p className="mt-2 text-sm text-neutral-400">You've reached your destination safely!</p>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl bg-white/5 p-6 border border-white/5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Destination</p>
                            <p className="text-sm font-medium text-white line-clamp-2">{destination?.description || "Completed Trip"}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-3xl bg-white/5 p-6 border border-white/5 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Duration</p>
                                <p className="text-2xl font-bold text-white">{minutes}m {seconds}s</p>
                            </div>
                            <div className="rounded-3xl bg-white/5 p-6 border border-white/5 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Checkpoints</p>
                                <p className="text-2xl font-bold text-white">{tripStats.checkpointsReached}</p>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white/5 p-6 border border-white/5 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Distance Covered</p>
                            <p className="text-2xl font-bold text-white">{tripStats.distanceTraveled.toFixed(2)} km</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="mt-8 w-full rounded-2xl bg-white py-4 text-sm font-bold text-black transition-transform active:scale-95"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};
