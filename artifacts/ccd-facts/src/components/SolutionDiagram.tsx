/**
 * Simple product flow for the “A solution” pathway zone — not an exam graph.
 */
export function SolutionDiagram() {
  const steps = ["Blocks", "Lessons", "Plans", "Calendar"];
  return (
    <div className="solution-diagram" aria-hidden>
      <p className="solution-diagram-brand">CCDesigner</p>
      <div className="solution-diagram-flow">
        {steps.map((label, i) => (
          <div key={label} className="solution-diagram-step-wrap">
            {i > 0 ? <span className="solution-diagram-arrow">→</span> : null}
            <span className="solution-diagram-step">{label}</span>
          </div>
        ))}
      </div>
      <p className="solution-diagram-hubs">+ Partner Hubs</p>
    </div>
  );
}
