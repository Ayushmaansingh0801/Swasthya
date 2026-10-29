# ROLLBACK_GUIDE.md

## App rollback
- Revert to previous Git commit and redeploy.
- Keep database backups before major changes.

## Database rollback
- Restore from Atlas snapshot or mongorestore from dump.
- Never drop production DB without authorization.

## Env rollback
- Revert env vars in hosting dashboard.
- Restart service.

## Emergency
- Set MAINTENANCE_MODE or disable new signups.
- Contact hosting support.
