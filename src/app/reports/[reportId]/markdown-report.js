function isHeading(line) {
  return /^#{1,6}\s+/.test(line);
}

function isUnorderedList(line) {
  return /^-\s+/.test(line);
}

function isOrderedList(line) {
  return /^\d+\.\s+/.test(line);
}

function isTableStart(lines, index) {
  return lines[index]?.trim().startsWith("|") && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[index + 1]?.trim() ?? "");
}

function tableCells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function paragraphStartsBlock(lines, index) {
  const line = lines[index] ?? "";
  return (
    line.trim() === "" ||
    line.startsWith("```") ||
    isHeading(line) ||
    isUnorderedList(line) ||
    isOrderedList(line) ||
    isTableStart(lines, index)
  );
}

export function MarkdownReport({ markdown }) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let index = 0;
  let key = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <pre key={`block-${key++}`}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    if (isHeading(line)) {
      const [, hashes, text] = line.match(/^(#{1,6})\s+(.*)$/);
      const level = Math.min(hashes.length, 4);
      const Heading = `h${level}`;
      blocks.push(<Heading key={`block-${key++}`}>{text}</Heading>);
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const headers = tableCells(lines[index]);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      blocks.push(
        <div className="table-scroll report-table-scroll" key={`block-${key++}`}>
          <table className="matrix-table report-table">
            <thead>
              <tr>
                {headers.map((header, headerIndex) => (
                  <th key={`${header}-${headerIndex}`}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {headers.map((header, cellIndex) => (
                    <td key={`${header}-${cellIndex}`}>{row[cellIndex] ?? ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (isUnorderedList(line) || isOrderedList(line)) {
      const ordered = isOrderedList(line);
      const items = [];
      while (index < lines.length && (ordered ? isOrderedList(lines[index]) : isUnorderedList(lines[index]))) {
        items.push(lines[index].replace(ordered ? /^\d+\.\s+/ : /^-\s+/, ""));
        index += 1;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={`block-${key++}`}>
          {items.map((item, itemIndex) => (
            <li key={`${item.slice(0, 24)}-${itemIndex}`}>{item}</li>
          ))}
        </List>
      );
      continue;
    }

    const paragraphLines = [];
    while (index < lines.length && !paragraphStartsBlock(lines, index)) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={`block-${key++}`}>{paragraphLines.join(" ")}</p>);
  }

  return <article className="report-prose">{blocks}</article>;
}
