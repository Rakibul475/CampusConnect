import { getClass } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import ProfessorClass from "./ProfessorClass";
import { ErrorNote, Loading } from "./Status";
import StudentClass from "./StudentClass";

function ClassPage({ classId, userId }) {
  const { data: cls, error, loading } = useAsync(() => getClass(classId), [classId]);

  if (loading && !cls) return <Loading />;
  if (error) return <ErrorNote error={error} />;
  if (!cls) {
    return (
      <section className="card narrow">
        <h2>Class not found</h2>
        <p>It may have been deleted, or you're not in it. <a href="#/">Back to your classes</a></p>
      </section>
    );
  }

  return cls.owner_id === userId ? (
    <ProfessorClass cls={cls} />
  ) : (
    <StudentClass cls={cls} userId={userId} />
  );
}

export default ClassPage;
