const LINKS = [
  { page: "events", label: "Events" },
  { page: "groups", label: "Study Groups" },
  { page: "messages", label: "Messages" },
  { page: "notifications", label: "Notifications" },
];

function Nav({ page, unread }) {
  return (
    <nav aria-label="Main">
      {LINKS.map((link) => (
        <a
          key={link.page}
          href={`#/${link.page}`}
          className={page === link.page ? "nav-link active" : "nav-link"}
          aria-current={page === link.page ? "page" : undefined}
        >
          {link.label}
          {link.page === "notifications" && unread > 0 && (
            <span className="badge" aria-label={`${unread} unread`}>{unread}</span>
          )}
        </a>
      ))}
    </nav>
  );
}

export default Nav;
