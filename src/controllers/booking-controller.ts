import { Response } from "express";
import { AuthenticatedRequest } from "@/middlewares";
import bookingServices from "@/services/booking-service";
import httpStatus from "http-status";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const booking = await bookingServices.getBooking(userId);
    return res.status(httpStatus.OK).send({ id: booking.id, Room: booking.Room });
  } catch (error) {
    if (error.name === "PaymentError") {
      return res.sendStatus(httpStatus.PAYMENT_REQUIRED);
    }
    if (error.name === "ForbiddenError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
  }
}
