// RBI & Admin Permissions Config
export const ADMIN_USERS = ['139822', '115019', 'CE25000014', '138922'];

export const isUserAdmin = (userDetails) => {
  let user = userDetails;
  if (!user) {
    try {
      const stored = typeof window !== 'undefined' && window.sessionStorage ? window.sessionStorage.getItem('userDetails') : null;
      if (stored) user = JSON.parse(stored);
    } catch {
      user = null;
    }
  }
  const currentUserId = String(
    user?.pfId ||
    user?.EmployeeId ||
    user?.employeeId ||
    user?.pfNumber ||
    (typeof window !== 'undefined' && window.sessionStorage ? window.sessionStorage.getItem('userId') : '') ||
    ''
  ).trim();

  const userRole = String(
    user?.role ||
    user?.LocationType ||
    (typeof window !== 'undefined' && window.sessionStorage ? window.sessionStorage.getItem('role') : '') ||
    ''
  ).toUpperCase().trim();

  if (user?.isAdmin === true) return true;
  if (ADMIN_USERS.includes(currentUserId)) return true;
  if (userRole === 'ADMIN') return true;
  return false;
};
