import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignupDto } from './dto/SignupDto';
import { AuthResponseDto } from './dto/AuthResponseDto';

@ApiTags('Authentication')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description: 'Create a new user account with email and password',
  })
  @ApiBody({ type: SignupDto })
  async signup(@Body() dto: SignupDto): Promise<any> {
    return this.authService.signup(dto);
  }
}
