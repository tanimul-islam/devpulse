enum Roles {
  contributor = "contributor",
  maintainer = "maintainer",
}

export interface IUser {
  name: string;
  email: string;
  password: string;
  role?: Roles;
}
