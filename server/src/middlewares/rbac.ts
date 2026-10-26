import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Membership } from '../models/Membership';
import { Organization } from '../models/Organization';
import mongoose from 'mongoose';

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
      return;
    }

    // Platform Super Admin has access to all admin-level routes
    if (req.user.role === 'platform_super_admin') {
      next();
      return;
    }

    const effectiveRole = req.workspaceRole || req.user.role;

    if (!allowedRoles.includes(effectiveRole) && !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Permission denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${effectiveRole}`,
      });
      return;
    }

    next();
  };
}

export function requireOrganizationAccess(orgIdParam: string = 'organizationId') {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (req.user.role === 'platform_super_admin') {
      next();
      return;
    }

    const orgId = req.params[orgIdParam] || req.body[orgIdParam] || req.query[orgIdParam] || req.activeWorkspaceId?.toString();

    if (!orgId || !mongoose.Types.ObjectId.isValid(orgId)) {
      res.status(400).json({ success: false, error: 'Valid Organization ID is required.' });
      return;
    }

    // Check if user is the direct owner of the organization
    const org = await Organization.findById(orgId);
    if (!org) {
      res.status(404).json({ success: false, error: 'Organization not found.' });
      return;
    }

    if (org.ownerId && org.ownerId.toString() === (req.user._id as mongoose.Types.ObjectId).toString()) {
      next();
      return;
    }

    // Check active membership
    const membership = await Membership.findOne({
      userId: req.user._id,
      organizationId: org._id,
      status: 'active',
    });

    if (!membership) {
      res.status(403).json({
        success: false,
        error: 'Access denied: You are not an active member of this organization.',
      });
      return;
    }

    req.workspaceRole = membership.role;
    req.activeWorkspaceId = org._id as mongoose.Types.ObjectId;
    next();
  };
}
