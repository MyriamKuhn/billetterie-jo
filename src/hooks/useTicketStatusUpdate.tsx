import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore";
import { API_BASE_URL } from "../config";
import { logError } from "../utils/logger";
import type { TicketStatus } from "../types/tickets";

export interface TicketStatusUpdate {
  status: TicketStatus;
}

/**
 * Hook to update the status of an admin ticket.
 */
export function useTicketStatusUpdate() {
  const token = useAuthStore(s => s.authToken);

  return async function statusUpdate(
    ticketId: number,
    update: TicketStatusUpdate
  ): Promise<boolean> {
    try {
      await axios.put(
        `${API_BASE_URL}/api/tickets/admin/${ticketId}/status`,
        update,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return true;
    } catch (err) {
      logError('useTicketStatusUpdate', err);
      return false;
    }
  };
}