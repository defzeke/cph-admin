import { pool } from "./pg";

// Reads the tables written by cph-membership-forms (see its db/schema.sql).

export type ApplicationRow = {
  id: string;
  created_at: Date;
  status: string;
  first_name: string;
  last_name: string;
  college_campus: string;
  role: string;
  department: string;
};

export async function listApplications() {
  const { rows } = await pool.query<ApplicationRow>(
    `SELECT a.id::text AS id, a.created_at, a.status, p.first_name, p.last_name, p.college_campus,
            r.name AS role, d.name AS department
     FROM applications a
     JOIN registration_personal_info p ON p.id = a.user_id
     JOIN department_roles r ON r.id = a.role_id
     JOIN departments d ON d.id = r.department_id
     ORDER BY a.created_at DESC, a.id DESC`,
  );
  return rows;
}

export async function getApplication(id: string) {
  const { rows: [app] } = await pool.query<
    ApplicationRow & {
      email: string;
      pup_webmail: string | null;
      phone: string;
      discord_username: string;
      facebook_link: string;
      facebook_shared_post: string;
      linkedin_link: string | null;
      course_year_section: string;
      certificate_link: string;
    }
  >(
    `SELECT a.id::text AS id, a.created_at, a.status, p.first_name, p.last_name, p.college_campus,
            r.name AS role, d.name AS department, p.email, p.pup_webmail, p.phone, p.discord_username,
            p.facebook_link, p.facebook_shared_post, p.linkedin_link, p.course_year_section, p.certificate_link
     FROM applications a
     JOIN registration_personal_info p ON p.id = a.user_id
     JOIN department_roles r ON r.id = a.role_id
     JOIN departments d ON d.id = r.department_id
     WHERE a.id = $1`,
    [id],
  );
  if (!app) return null;
  // Answers keep the question they answered, even if that question was edited (deactivated) later.
  const { rows: answers } = await pool.query<{ question: string; answer: string }>(
    `SELECT q.prompt AS question, x.answer
     FROM department_answers x JOIN department_questions q ON q.id = x.question_id
     WHERE x.application_id = $1
     ORDER BY q.position, q.id`,
    [id],
  );
  return { ...app, answers };
}

export type QuestionRow = {
  department_slug: string;
  department: string;
  closed: boolean;
  role_id: string;
  role: string;
  question_id: string | null;
  prompt: string | null;
  answers: number;
};

export async function listQuestions() {
  const { rows } = await pool.query<QuestionRow>(
    `SELECT d.slug AS department_slug, d.name AS department, d.closed, r.id::text AS role_id, r.name AS role,
            q.id::text AS question_id, q.prompt,
            (SELECT count(*)::int FROM department_answers x WHERE x.question_id = q.id) AS answers
     FROM departments d
     JOIN department_roles r ON r.department_id = d.id
     LEFT JOIN department_questions q ON q.role_id = r.id AND q.active
     ORDER BY d.id, r.position, r.id, q.position, q.id`,
  );
  return rows;
}
