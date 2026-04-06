export const ADMIN_COACH_ROLE = 'admin_coach';
export const COACH_ROLE = 'coach';
export const STUDENT_ROLE = 'student';

export const MAIN_ADMIN_FULL_NAME = 'Göksel Atak';

export function isAdminCoach(profile?: { role?: string | null; full_name?: string | null } | null) {
  return (
    profile?.role === ADMIN_COACH_ROLE ||
    profile?.full_name?.trim().toLocaleLowerCase('tr-TR') === MAIN_ADMIN_FULL_NAME.toLocaleLowerCase('tr-TR')
  );
}
