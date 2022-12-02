import faker from "@faker-js/faker";
import { prisma } from "@/config";

//Sabe criar objetos - Hotel do banco
export async function createBooking(userId: number, roomId: number) {
  return await prisma.booking.create({
    data: {
      userId: userId,
      roomId: roomId
    }
  });
}

export async function findRoomWithId(roomId: number) {
  return await prisma.room.findFirst({
    where: { id: roomId }
  });
}
