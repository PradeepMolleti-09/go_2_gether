import { apiFetch } from "./apiClient";

export interface CheckpointDto {
    _id: string;
    trip: string;
    title: string;
    tag?: string;
    description?: string;
    location: {
        lat: number;
        lng: number;
    };
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export const checkpointService = {
    async createCheckpoint(
        tripId: string,
        data: {
            title: string;
            tag?: string;
            description?: string;
            lat: number;
            lng: number;
        }
    ): Promise<CheckpointDto> {
        const response = await apiFetch<{ checkpoint: CheckpointDto }>(
            `/trips/${tripId}/checkpoints`,
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        );
        return response.checkpoint;
    },

    async getCheckpoints(tripId: string): Promise<CheckpointDto[]> {
        const response = await apiFetch<{ checkpoints: CheckpointDto[] }>(
            `/trips/${tripId}/checkpoints`
        );
        return response.checkpoints || [];
    },

    async deleteCheckpoint(checkpointId: string): Promise<void> {
        await apiFetch(`/trips/checkpoints/${checkpointId}`, {
            method: "DELETE",
        });
    },
};
