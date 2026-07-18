declare global {
  namespace Express {
    interface Request {
      csrfSessionIdentifier?: string;
      oauthState?: string;
    }
  }
}

export {};
