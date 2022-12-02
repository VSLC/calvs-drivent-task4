import { prisma } from "@/config";
import { Booking } from "@prisma/client";

async function findBooking(userId: number) {
  return prisma.booking.findFirst({
    where: { userId: userId },
    include: { Room: true }
  });
}

async function findRoomWithId(id: number) {
  return prisma.room.findFirst({ where: { id } });
}

const bookingRepository = {
  findBooking,
  findRoomWithId
};

export default bookingRepository;
