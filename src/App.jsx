import "./App.css";
import AuthPage from "./components/AuthPage";
import ClassPage from "./components/ClassPage";
import GroupPage from "./components/GroupPage";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import JoinPage from "./components/JoinPage";
import SetupNeeded from "./components/SetupNeeded";
import { Loading } from "./components/Status";
import { supabase } from "./lib/supabase";
import { useHashRoute } from "./lib/useHashRoute";
import { useSession } from "./lib/useSession";

function Routes() {
  const route = useHashRoute();
  const { loading, user, profile } = useSession();

  let page;
  if (loading) page = <Loading />;
  else if (!user) page = <AuthPage joining={route.name === "join"} />;
  else if (route.name === "join") page = <JoinPage code={route.code} />;
  else if (route.name === "class") page = <ClassPage key={route.classId} classId={route.classId} userId={user.id} />;
  else if (route.name === "group")
    page = <GroupPage key={route.groupId} classId={route.classId} groupId={route.groupId} userId={user.id} />;
  else page = <HomePage userId={user.id} />;

  return (
    <>
      <Header profile={profile} />
      <main>{page}</main>
    </>
  );
}

function App() {
  return (
    <div className="app">
      {supabase ? (
        <Routes />
      ) : (
        <>
          <Header />
          <main><SetupNeeded /></main>
        </>
      )}

      <footer>
        <p>
          CampusConnect is an independent student project, not an official
          Sacramento State service.
        </p>
        <p>
          <a href="https://github.com/Rakibul475/CampusConnect" target="_blank" rel="noreferrer">
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
