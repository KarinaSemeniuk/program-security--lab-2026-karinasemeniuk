import { BookingNoteVO } from "#domain/Booking/ValueObject/BookingNoteVO";
import { InvalidBookingNoteException } from "#domain/Booking/Exception/InvalidBookingNoteException";
describe("BookingNoteVO", () => {
  it.each(["", "  Нотатка\nз пробілами\t ", "💻".repeat(2000)])("preserves valid exact input", value => expect(new BookingNoteVO(value).getValue()).toBe(value));
  it.each(["x".repeat(2001), "💻".repeat(2001), "x\ud800", "x\udfff", "a\u0000b", "a\u0007b", "a\u007fb"])("rejects invalid text", value => expect(() => new BookingNoteVO(value)).toThrow(InvalidBookingNoteException));
});
