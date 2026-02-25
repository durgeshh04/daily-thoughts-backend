import { Injectable } from '@nestjs/common';
import { SignupDto } from './dto/SignupDto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AuthService {
  constructor(private db: DatabaseService) {}
  async signup(dto: SignupDto) {
    try {
      return 'signup method called';
    } catch (error) {
      console.log('Signup failed', error);
      throw error;
    }
  }
}
