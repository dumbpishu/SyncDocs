export {};

declare global {
    namespace Express {
        interface Request {
            user?: {
                _id: string;
                email?: string;
                username?: string;
            };
        }
    }
}
