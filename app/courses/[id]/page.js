import db from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../components/SiteNav";
import Footer from "../../components/Footer";

export const dynamic = "force-dynamic";

function formatDate(d) {
  if (!d) return "Date to be confirmed";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default async function CourseDetail({ params }) {
  const { id } = await params;
  const course = await db.queryOne(
    `SELECT co.*, c.name as category_name, c.color as category_color
     FROM courses co
     LEFT JOIN categories c ON c.id = co.category_id
     WHERE co.id = $1 AND co.status = 'published'`,
    [id]
  );

  if (!course) notFound();

  const steps = await db.queryAll(
    `SELECT s.id, s.title, s.brief, s.date, s.time, s.status, s.course_order,
            t.id as trainer_id, t.name as trainer_name, t.photo as trainer_photo
     FROM sessions s
     LEFT JOIN trainers t ON t.id = s.trainer_id
     WHERE s.course_id = $1 AND s.status IN ('approved','completed')
     ORDER BY s.course_order ASC, s.date ASC`,
    [id]
  );

  return (
    <>
      <SiteNav />
      <div style={{ maxWidth: 820, margin: "40px auto 0", padding: "0 16px" }}>
        <Link href="/" className="back-link" style={{ display: "inline-block", textDecoration: "none" }}>← All programs</Link>
      </div>
      <div className="detail-card" style={{ maxWidth: 820, margin: "12px auto 40px", padding: 0, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 20, overflow: "hidden" }}>
        {course.image && (
          <img src={course.image} alt="" style={{ width: "100%", maxHeight: 320, objectFit: "cover", display: "block" }} />
        )}
        <div style={{ padding: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--purple)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            📚 Multi-part course {course.category_name && `· ${course.category_name}`}
          </div>
          <h1 style={{ fontSize: 28, color: "var(--navy)", margin: "0 0 14px" }}>{course.title}</h1>
          <p style={{ color: "var(--navy-soft)", lineHeight: 1.7, marginBottom: 28 }}>{course.description}</p>

          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 22 }}>
            <h3 style={{ margin: "0 0 12px" }}>Sessions in this course {steps.length > 0 && `(${steps.length})`}</h3>
            {steps.length === 0 && <div className="empty-note">No sessions have been scheduled for this course yet.</div>}
            <div className="course-steps" style={{ flexDirection: "column" }}>
              {steps.map((s, i) => (
                <Link key={s.id} href={`/programs/${s.id}`} className="course-step" style={{ textDecoration: "none", color: "inherit", width: "100%" }}>
                  <span className="course-step-num">{i + 1}</span>
                  <span style={{ flex: 1 }}>
                    <b>{s.title}</b><br />
                    {formatDate(s.date)} {s.time ? `· ${s.time}` : ""} {s.status === "completed" && "· Completed"}
                    {s.trainer_name && <><br /><span style={{ fontSize: 12.5 }}>with {s.trainer_name}</span></>}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
