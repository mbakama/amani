import { IsUUID, IsBoolean } from 'class-validator';

export class ToggleReminderDto {
  @IsUUID()
  eventId: string;

  @IsBoolean()
  enabled: boolean;
}
