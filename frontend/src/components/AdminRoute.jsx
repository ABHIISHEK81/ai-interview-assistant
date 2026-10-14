import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const ADMIN_ALLOWED_ROLES = ['admin', 'super_admin', 'content_manager', 'support'];

/**
 * AdminRoute Guard
 * Strictly restricts the Admin Governance Chamber to administrators who have
 * explicitly authenticated and verified their email and password via /admin/login.
 */
export default function AdminRoute({ children }) {
  const { adminUser, adminToken, isAdminAuthenticated, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Strict administrator verification:
  // Must have an active admin session, valid admin bearer token, and verified administrative role.
  const isVerifiedAdmin = Boolean(
    isAdminAuthenticated &&
    adminToken &&
    adminUser &&
    ADMIN_ALLOWED_ROLES.includes(adminUser.role)
  );

  if (!isVerifiedAdmin) {
    // If a candidate (or unverified visitor) tries to access any admin panel route:
    return (
      <Navigate 
        to="/admin/login" 
        state={{ 
          from: location,
          accessDenied: true,
          message: isAuthenticated 
            ? 'Administrator Verification Required: Candidate accounts cannot access the Governance Chamber. Please authenticate with verified administrator credentials.'
            : 'Administrator Verification Required: Please enter your administrator email and password to proceed.',
        }} 
        replace 
      />
    );
  }

  return children;
}

