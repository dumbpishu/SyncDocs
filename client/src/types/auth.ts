export type User = {
  _id: string;
  email: string;
  username: string;
  fullName?: string;
  avatar?: string;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthUserResponse = {
  user: User;
};
