export interface JwtPayload {
  sub: string; //userId
  email: string;
  iat?: number;
  exp?: number;
}

export interface JwtPayloadWithRefresh extends JwtPayload {
  refreshToken?: string;
}
