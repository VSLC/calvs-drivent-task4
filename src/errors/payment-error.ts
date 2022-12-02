import { ApplicationError } from "@/protocols";

export function paymentError(): ApplicationError {
  return {
    name: "PaymentError",
    message: "Ticket wasn't paid",
  };
}
