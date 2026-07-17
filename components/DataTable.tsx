export default function DataTable({columns, rows}: {columns: string[], rows: React.ReactNode[][]}) {
  return <div className="table-wrap card"><table><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></div>
}
