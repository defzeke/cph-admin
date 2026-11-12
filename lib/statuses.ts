// Allowed values, matching the CHECK constraints in db/schema.sql. No DB import, so client code can use it.
export const MEMBER_CATEGORIES = ["Executive", "Consultant", "Lead", "Chapter Lead", "Ambassador"] as const;
export const DEADLINE_STATUSES = ["Open", "In Progress", "Done"] as const;
// applications.status in the forms DB (free text there, lowercase); the forms app inserts "pending".
export const APPLICATION_STATUSES = ["pending", "interview", "accepted", "declined"] as const;
