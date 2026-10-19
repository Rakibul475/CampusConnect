import { useEffect, useRef, useState } from "react";
import { joinClass } from "../lib/api";
import { classPath, navigate } from "../lib/useHashRoute";
import { ErrorNote, Loading } from "./Status";

function JoinPage({ code }) {
  const [error, setError] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    joinClass(code)
      .then((classId) => navigate(classPath(classId)))
      .catch(setError);
  }, [code]);

  return (
    <section className="card narrow">
      <h2>Joining class {code.toUpperCase()}</h2>
      {error ? (
        <>
          <ErrorNote error={error} />
          <a href="#/">Back to your classes</a>
        </>
      ) : (
        <Loading label="Joining..." />
      )}
    </section>
  );
}

export default JoinPage;
