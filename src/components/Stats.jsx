function Stats({ items }) {
  return (
    <section className="stats">
      {items.map((item) => (
        <div className="stat-card" key={item.label}>
          <h3>{item.value}</h3>
          <p>{item.label}</p>
        </div>
      ))}
    </section>
  );
}

export default Stats;
