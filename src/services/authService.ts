export class AuthService {
  getCurrentUser() {
    const user = localStorage.getItem('authUser');
    return user ? JSON.parse(user) : null;
  }

  logout() {
    localStorage.removeItem('authUser');
    localStorage.removeItem('activeRole');
    localStorage.removeItem('workspaceRole');
    localStorage.removeItem('userId');
  }

  updateProfile(updatedData: any) {
    const currentUser = this.getCurrentUser();

    if (!currentUser) return null;

    const updatedUser = {
      ...currentUser,
      ...updatedData,
    };

    localStorage.setItem(
      'authUser',
      JSON.stringify(updatedUser)
    );

    return updatedUser;
  }

  changePassword(
    currentPassword: string,
    newPassword: string
  ) {
    const currentUser = this.getCurrentUser();

    if (!currentUser) {
      throw new Error('User not found');
    }

    if (currentUser.password !== currentPassword) {
      throw new Error('Current password is incorrect');
    }

    currentUser.password = newPassword;

    localStorage.setItem(
      'authUser',
      JSON.stringify(currentUser)
    );

    return true;
  }
}

const authService = new AuthService();

export default authService;