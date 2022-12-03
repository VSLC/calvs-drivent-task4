import { prisma } from "@/config";

async function findBooking(userId: number) {
  return prisma.booking.findFirst({
    where: { userId: userId },
    include: { Room: true }
  });
}

async function findRoomWithId(roomId: number) {
  return prisma.room.findFirst({
    where: { id: roomId },
  });
}

async function postBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId: userId,
      roomId: roomId,
    }
  });
}

async function findBookingByRoomId(roomId: number) {
  return prisma.booking.findMany({
    where: { roomId },
  });
}

async function findUserBooking(bookingId: number) {
  return prisma.booking.findFirst({
    where: { id: bookingId },
  });
}

async function updateBooking(bookingId: number, RoomId: number) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      roomId: RoomId,
    }
  });
}
const bookingRepository = {
  findBooking,
  findRoomWithId,
  postBooking,
  findBookingByRoomId,
  findUserBooking,
  updateBooking
};

export default bookingRepository;
