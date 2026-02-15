import { ChangeEvent } from "react";
import { uploadPhoto } from "../../services/mediaService";

interface Props {
  tripId: string | null;
}

export const PhotoUploadButton = ({ tripId }: Props) => {
  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!tripId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadPhoto(tripId, file);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <label className="cursor-pointer text-[10px] font-medium uppercase tracking-wide">
      <span>Photo</span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </label>
  );
};

