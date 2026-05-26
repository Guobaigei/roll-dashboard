type TableProps = {
  headers: string[];
  rows: string[][];
};

export function Table({ headers, rows }: TableProps) {
  return (
    <div className="ui-table-container">
      <table className="ui-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Static rows safely keyed by array index
            <tr key={idx}>
              {row.map((val, cellIdx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Static cells safely keyed by array index
                <td key={cellIdx} className={cellIdx === 0 ? "highlight-cell" : ""}>
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
