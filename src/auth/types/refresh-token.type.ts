export type RefreshTokenPayloadType = {
  sub: string;
  sessionId: string;
};
export type CreateRefreshTokenSessionData = {
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
};
