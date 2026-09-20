import { UserRole } from '../types/auth';

export interface UserDisplayInfo {
  displayName: string;
  initial: string;
  roleBadgeLabel: string;
  idLabel: string;
  idValue: string | null;
  sessionBadgeLabel: string;
}

export function getUserDisplayInfo(user: {
  mobileNumber?: string;
  role: string | UserRole;
  roleName?: string;
  firstName?: string | null;
  lastName?: string | null;
  farmerReferenceId?: string | null;
}): UserDisplayInfo {
  const role = (user.role === 'ADMIN' ? 'SYSTEM_ADMIN' : user.role) as UserRole;
  const isGenericFarmerName =
    !user.firstName ||
    (user.firstName === 'Farmer' && (user.lastName === 'User' || !user.lastName));

  let displayName = '';
  let initial = '';
  let roleBadgeLabel = user.roleName || role;
  let idLabel = '';
  let idValue: string | null = null;
  let sessionBadgeLabel = '';

  switch (role) {
    case 'CENTRE_MANAGER':
      displayName = isGenericFarmerName ? 'Centre Manager' : `${user.firstName} ${user.lastName}`;
      initial = isGenericFarmerName ? 'M' : displayName[0].toUpperCase();
      roleBadgeLabel = 'Centre Manager';
      idLabel = 'MANAGER ID';
      idValue = user.farmerReferenceId
        ? user.farmerReferenceId.replace(/^(FARM|FRM)-/, 'MGR-')
        : 'MGR-2026-3001';
      sessionBadgeLabel = 'Manager Console';
      break;

    case 'PROCUREMENT_OFFICER':
      displayName = isGenericFarmerName ? 'Procurement Officer' : `${user.firstName} ${user.lastName}`;
      initial = isGenericFarmerName ? 'P' : displayName[0].toUpperCase();
      roleBadgeLabel = 'Procurement Officer';
      idLabel = 'OFFICER ID';
      idValue = user.farmerReferenceId
        ? user.farmerReferenceId.replace(/^(FARM|FRM)-/, 'OFF-')
        : 'OFF-2026-4001';
      sessionBadgeLabel = 'Officer Console';
      break;

    case 'SYSTEM_ADMIN':
    case 'ADMIN':
      displayName = isGenericFarmerName ? 'System Administrator' : `${user.firstName} ${user.lastName}`;
      initial = isGenericFarmerName ? 'A' : displayName[0].toUpperCase();
      roleBadgeLabel = 'System Admin';
      idLabel = 'ADMIN ID';
      idValue = user.farmerReferenceId
        ? user.farmerReferenceId.replace(/^(FARM|FRM)-/, 'ADM-')
        : 'ADM-2026-0001';
      sessionBadgeLabel = 'Admin Console';
      break;

    case 'DISTRICT_ADMIN':
      displayName = isGenericFarmerName ? 'District Administrator' : `${user.firstName} ${user.lastName}`;
      initial = isGenericFarmerName ? 'D' : displayName[0].toUpperCase();
      roleBadgeLabel = 'District Admin';
      idLabel = 'ADMIN ID';
      idValue = user.farmerReferenceId
        ? user.farmerReferenceId.replace(/^(FARM|FRM)-/, 'DST-')
        : 'DST-2026-0005';
      sessionBadgeLabel = 'District Console';
      break;

    case 'FARMER':
    default:
      displayName = isGenericFarmerName ? 'Farmer User' : `${user.firstName} ${user.lastName}`;
      initial = displayName[0].toUpperCase();
      roleBadgeLabel = 'Farmer';
      idLabel = 'FARMER ID';
      idValue = user.farmerReferenceId || 'FRM-2026-8812';
      sessionBadgeLabel = 'Farmer Portal';
      break;
  }

  return {
    displayName,
    initial,
    roleBadgeLabel,
    idLabel,
    idValue,
    sessionBadgeLabel
  };
}
