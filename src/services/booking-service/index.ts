import { notFoundError, paymentError, forbiddenError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { TicketStatus } from "@prisma/client";
async function getBooking(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw notFoundError();
  }
  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) {
    throw notFoundError();
  }

  if (ticket.status === TicketStatus.RESERVED) {
    throw paymentError();
  }
  if (ticket.TicketType.isRemote) {
    throw forbiddenError();
  }
  if (ticket.TicketType.includesHotel === false) {
    throw forbiddenError();
  }

  const booking = await bookingRepository.findBooking(userId);
  if (!booking) {
    throw notFoundError();
  }
  return booking;
}

const bookingServices = {
  getBooking
};
export default bookingServices;
