import { ApiProperty } from '@nestjs/swagger';

export class ValidateResponseDto {
  @ApiProperty({ example: true })
  valid: boolean;

  @ApiProperty({ example: '2026-07-15T18:00:00Z' })
  expiresAt: string;
}
