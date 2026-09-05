import { useEffect, useState } from "react";
import "./PipelineKanban.css";

const STATUS_ORDER = ["Draft", "Pending Approval", "Negotiation", "Confirmed"];

export default function PipelineKanban() {
  const [quotations, setQuotations] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/quotations")
      .then((res) => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then((data) => setQuotations(data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p>Error: {error}</p>;

  // group quotations by status
  const columns = STATUS_ORDER.map((status) => ({
    status,
    items: quotations.filter((q) => q.status === status),
  }));

  return (
    <section className="pipeline-kanban">
      <h2>Quotation Pipeline</h2>
      {columns.map((col) => (
        <div key={col.status} className="column">
          <h3>{col.status}</h3>
          <ul>
            {col.items.map((q) => (
              <li key={q.id}>
                <strong>#{q.id}</strong> {q.customer_name || "Customer"} – {"$" + (q.total_price ?? q.lines.reduce((sum, line) => sum + (line.quantity * line.product?.price ?? 0), 0))}
              </li>
            ))}
            {col.items.length === 0 && <li>No quotations</li>}
          </ul>
        </div>
      ))}
    </section>
  );
}