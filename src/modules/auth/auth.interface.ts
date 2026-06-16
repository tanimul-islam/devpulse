export type TLoginPaylaod = {
  email: string;
  password: string;
};

export type TUserRow = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  created_at: Date;
  updated_at: Date;
};

export type TJwtPayload = {
  id: number;
  name: string;
  email: string;
  role: string;
};
