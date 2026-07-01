export interface User {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  password: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
}