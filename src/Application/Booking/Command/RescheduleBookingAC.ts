import { UserDTO } from "#application/Identity/Dto/UserDTO";
/** Version-bound move intent; resource and owner are never taken from JSON. */
export class RescheduleBookingAC {
  /** @param actor - Session identity. @param bookingId - UUID. @param startAt - Target UTC start. @param endAt - Target UTC end. @param revision - Observed version. */
  public constructor(public readonly actor:UserDTO,public readonly bookingId:string,public readonly startAt:string,public readonly endAt:string,public readonly revision:number) {}
}
