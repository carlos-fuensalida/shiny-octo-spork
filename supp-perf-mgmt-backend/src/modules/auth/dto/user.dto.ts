import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: 'usr-123' })
  id: string;

  @ApiProperty({ example: 'j.smith@whirlpool.com' })
  email: string;

  @ApiProperty({ example: 'John Smith' })
  displayName: string;
}
