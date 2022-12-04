import { prisma } from "@/config";
import { createUser } from "./users-factory";

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

export async function createBookings(roomId: number) {
  const user = await createUser();
  return await prisma.booking.createMany({
    data: [
      { userId: user.id, roomId: roomId },
      { userId: user.id, roomId: roomId },
      { userId: user.id, roomId: roomId }

    ],
  });
}
