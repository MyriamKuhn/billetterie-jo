import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore";
import { API_BASE_URL } from "../config";
import { logError } from "../utils/logger";

export interface freeTicket {
  user_id: number;
  product_id: number;
  quantity: number;
  locale: string;
}

export function useFreeTicket() {
  const token = useAuthStore(s => s.authToken);

  return async function freeTicket(
    freeTicket: freeTicket
  ): Promise<boolean> {
    try {
      await axios.post(
        `${API_BASE_URL}/api/tickets`,
        freeTicket,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return true;
    } catch (err) {
      logError('useFreeTicket', err);
      return false;
    }
  };
}