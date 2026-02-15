import { useEffect, useState } from "react";
import type { MediaItem } from "../../services/mediaService";
import { getTripMedia } from "../../services/mediaService";

interface Props {
  tripId: string | null;
  open: boolean;
  onClose: () => void;
}

export const GalleryModal = ({ tripId, open, onClose }: Props) => {
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!open || !tripId) return;
    getTripMedia(tripId)
      .then(setItems)
      .catch(() => {
        setItems([]);
      });
  }, [open, tripId]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "photo.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, "_blank");
    }
  };

  if (!open || !tripId) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-black/90 p-4 text-white shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">
            Trip photos
          </div>
          <button
            className="text-xs text-neutral-300 hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="grid max-h-[70vh] grid-cols-2 gap-4 overflow-y-auto md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              <img
                src={item.url}
                alt={item.caption ?? "Trip media"}
                className="h-40 w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                <div className="p-3">
                  {item.caption && (
                    <p className="mb-2 text-[10px] text-neutral-200 line-clamp-2">
                      {item.caption}
                    </p>
                  )}
                  <button
                    onClick={() => handleDownload(item.url, `photo-${item._id}.jpg`)}
                    className="w-full rounded-lg bg-white py-1.5 text-[10px] font-bold text-black hover:bg-neutral-200"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!items.length && (
            <div className="col-span-full py-12 text-center">
              <p className="text-xs text-neutral-400">No photos uploaded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

