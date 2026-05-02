export type User = {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  phone: string;
  role: "administrator" | "reception" | "provider";
  providerId?: string | null;
  isActive: boolean;
  createdAt: string;
};

export type UserAccountWriteInput = {
  fullName: string;
  email: string;
  phone: string;
};
