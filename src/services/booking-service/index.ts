import { notFoundError, paymentError, forbiddenError } from "@/errors";
import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import hotelRepository from "@/repositories/hotel-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { TicketStatus } from "@prisma/client";
import { forbidden } from "joi";
async function verifyIfUserCanBook(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw notFoundError();
  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) throw notFoundError();

  if (ticket.status === TicketStatus.RESERVED) throw paymentError();
  if (ticket.TicketType.isRemote) throw forbiddenError();
  if (ticket.TicketType.includesHotel === false) throw forbiddenError();
}
async function getBooking(userId: number) {
  await verifyIfUserCanBook(userId);
  const booking = await bookingRepository.findBooking(userId);
  if (!booking) throw notFoundError();

  return booking;
}
async function postBooking(userId: number, roomId: number) {
  await verifyIfUserCanBook(userId);
  const findRoom = await bookingRepository.findRoomWithId(roomId);
  if (!findRoom) throw notFoundError();

  const findBookRoom = await bookingRepository.findBookingByRoomId(roomId);
  //Retornar depois
  if (findBookRoom.length === findRoom.capacity) {
    throw forbiddenError();
  }

  const insertBooking = await bookingRepository.postBooking(userId, roomId);
  return insertBooking;
}

async function putBooking(userId: number, newRoomId: number, bookingId: number) {
  await verifyIfUserCanBook(userId);

  const findUserBooking = await bookingRepository.findUserBooking(bookingId);
  if (!findUserBooking) {
    throw notFoundError();
  }
  if (findUserBooking.roomId === newRoomId) {
    throw forbiddenError();
  }

  const findNewRoom = await bookingRepository.findRoomWithId(newRoomId);
  if (!findNewRoom) {
    throw notFoundError();
  }

  const findBookRoom = await bookingRepository.findBookingByRoomId(newRoomId);
  if (findBookRoom.length === findNewRoom.capacity) {
    throw forbiddenError();
  }
  const updateBooking = await bookingRepository.updateBooking(bookingId, newRoomId);
  return updateBooking;
}

const bookingServices = {
  getBooking,
  postBooking,
  putBooking
};
export default bookingServices;
