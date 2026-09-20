DO
$$
DECLARE
null_count BIGINT;
BEGIN
SELECT count(*)
INTO null_count
FROM permissions
WHERE scope_assignable IS NULL;
IF
null_count > 0 THEN
        RAISE EXCEPTION 'Cannot require NOT NULL for permissions.scope_assignable: % NULL rows remain.', null_count;
END IF;
END $$;
--> statement-breakpoint
DO
$$
DECLARE
null_count BIGINT;
BEGIN
SELECT count(*)
INTO null_count
FROM roles
WHERE scope_assignable IS NULL;
IF
null_count > 0 THEN
        RAISE EXCEPTION 'Cannot require NOT NULL for roles.scope_assignable: % NULL rows remain.', null_count;
END IF;
END $$;
--> statement-breakpoint
DO
$$
DECLARE
null_count BIGINT;
BEGIN
SELECT count(*)
INTO null_count
FROM role_permissions
WHERE role_scope_assignable IS NULL;
IF
null_count > 0 THEN
        RAISE EXCEPTION 'Cannot require NOT NULL for role_permissions.role_scope_assignable: % NULL rows remain.', null_count;
END IF;
END $$;
--> statement-breakpoint
DO
$$
DECLARE
null_count BIGINT;
BEGIN
SELECT count(*)
INTO null_count
FROM role_permissions
WHERE permission_scope_assignable IS NULL;
IF
null_count > 0 THEN
        RAISE EXCEPTION 'Cannot require NOT NULL for role_permissions.permission_scope_assignable: % NULL rows remain.', null_count;
END IF;
END $$;
--> statement-breakpoint
ALTER TABLE permissions
    ALTER COLUMN scope_assignable SET NOT NULL;
--> statement-breakpoint
ALTER TABLE roles
    ALTER COLUMN scope_assignable SET NOT NULL;
--> statement-breakpoint
ALTER TABLE role_permissions
    ALTER COLUMN role_scope_assignable SET NOT NULL;
--> statement-breakpoint
ALTER TABLE role_permissions
    ALTER COLUMN permission_scope_assignable SET NOT NULL;
