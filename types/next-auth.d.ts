declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      isApproved: boolean;
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    isApproved: boolean;
    image?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    name: string;
    role: string;
    isApproved: boolean;
    image?: string;
  }
}