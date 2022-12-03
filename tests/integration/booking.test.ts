import app, { init } from "@/app";
import { notFoundError } from "@/errors";
import bookingServices from "@/services/booking-service";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import { create } from "domain";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import {
  createUser,
  createBooking,
  createHotel,
  createRoomWithHotelId,
  createEnrollmentWithAddress,
  createTicketTypeWithHotel,
  createTicket,
  createTicketTypeRemote,
  createPayment,
  createTicketTypeWithoutHotel,
  findRoomWithId,
  createTicketType,
  createBookings
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);
describe("GET:/booking", () => {
  describe("When token is not valid", () => {
    it("Should respond with status 401 when there isn't token", async () => {
      const response = await server.get("/booking");
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("Should respond with status 401 when there isn't a valid token", async () => {
      const token = faker.lorem.word();

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("Should respond with status 401 when there isn't a valid session", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });
  describe("When token is valid", () => {
    it("Should respond with status 404 if doesn't have a ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const ticketType = await createTicketType();
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("Should respond with status 404 if doesn't have an enrollment", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const ticket = await createTicketTypeRemote();
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("Should respond with status 402 if the user doesn't paid the ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });
    it("Should respond with status 403 if the user doesn't include a hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithoutHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    it("Should respond with status 403 if the user ticket is remote", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    it("Should respond with status 404 if the user doesn't have booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const createRoom = await createRoomWithHotelId(hotel.id);
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });
    it("Should respond with status 200 and an object if the user have a booking", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const createRoom = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, createRoom.id);
      const bookRoom = await findRoomWithId(booking.roomId);
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toStrictEqual({
        id: booking.id,
        Room: {
          id: bookRoom.id,
          name: bookRoom.name,
          capacity: bookRoom.capacity,
          hotelId: bookRoom.hotelId,
          createdAt: bookRoom.createdAt.toISOString(),
          updatedAt: bookRoom.updatedAt.toISOString()
        }
      });
    });
  });
});

describe("POST:/booking", () => {
  describe("When token is not valid", () => {
    it("Should respond with status 401 when there isn't token", async () => {
      const response = await server.post("/booking");
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("Should respond with status 401 when there isn't a valid token", async () => {
      const token = faker.lorem.word();

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("Should respond with status 401 when there isn't a valid session", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });
  describe("When token is valid", () => {
    it("Should respond with status 404 if doesn't have a ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const ticketType = await createTicketType();
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("Should respond with status 404 if  user hasn't an enrollment", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createTicketTypeRemote();
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("Should respond with status 402 if the user doesn't paid the ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });
    it("Should respond with status 403 if the user ticket doesn't include a hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithoutHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    it("Should respond with status 403 if roomId has no place", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const createRoom = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, createRoom.id);
      const createMultipleBookings = await createBookings(createRoom.id);
      const body = {
        roomId: createRoom.id
      };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    it("Should respond with status 403 if the user ticket is remote", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    it("Should respond with status 404 if roomId doesn't exist", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const body = { roomId: -1 };

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("Should respond with status 200 and booking id information", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const createRoom = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, createRoom.id);
      const body = {
        roomId: createRoom.id
      };
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({ bookingId: expect.any(Number) });
    });
  });
});

describe("PUT:/booking/:bookingId", () => {
  describe("When token is not valid", () => {
    it("Should respond with status 401 when there isn't token", async () => {
      const response = await server.put(`/booking/${1}`);
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("Should respond with status 401 when there isn't a valid token", async () => {
      const token = faker.lorem.word();

      const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
    it("Should respond with status 401 when there isn't a valid session", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

      const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });
  describe("When token is valid", () => {
    it("Should respond with status 404 if  user hasn't an enrollment", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createTicketTypeRemote();
      const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });
    it("Should respond with status 402 if the user doesn't paid the ticket", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });
    it("Should respond with status 403 if the user ticket is remote", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    it("Should respond with status 403 if the user ticket doesn't include a hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithoutHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    it("Should respond with status 403 if roomId has no place", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const createRoom = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, createRoom.id);
      const user1 = await createUser();
      const user2 = await createUser();
      const user3 = await createUser();
      const booking1 = await createBooking(user1.id, createRoom.id);
      const booking2 = await createBooking(user2.id, createRoom.id);
      const booking3 = await createBooking(user3.id, createRoom.id);

      const body = {
        roomId: createRoom.id
      };

      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    it("Should respond with status 403 when user try to re-book same room", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const createRoom = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, createRoom.id);
      const body = {
        roomId: booking.roomId,
      };
      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    it("Should respond with status 404 when the user hasn't booked a room", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const response = await server.put(`/booking/${1}`).set("Authorization", `Bearer ${token}`);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });
    it("Should respond with status 404 when new roomId doesn't exist", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const createRoom = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, createRoom.id);
      const body = {
        roomId: booking.roomId + 1,
      };
      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });
    it("Should respond with status 200 and booking id", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const hotel = await createHotel();
      const createRoom = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, createRoom.id);
      const newRoom = await createRoomWithHotelId(hotel.id);
      const body = {
        roomId: newRoom.id,
      };
      const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(body);
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({ bookingId: booking.id });
    });
  });
});
