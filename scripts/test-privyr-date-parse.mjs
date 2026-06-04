import { parseLeadRows, detectDateCreatedColumn } from "../src/lib/parse-leads.ts";
import { dateCreatedToISO } from "../src/lib/lead-date-created.ts";

const cases = [
  {
    label: "Privyr Date Added",
    rows: [
      {
        Name: "Mark Christie",
        "WhatsApp Number": "60123456789",
        "Date Added": "4 Jun 2024, 10:30 am",
      },
    ],
  },
  {
    label: "BOM + Date Added",
    rows: [
      {
        "\ufeffName": "Ida",
        "WhatsApp Number": "60198765432",
        "Date Added": "24/06/2024",
      },
    ],
  },
];

for (const { label, rows } of cases) {
  const headers = Object.keys(rows[0]);
  const col = detectDateCreatedColumn(headers);
  const parsed = parseLeadRows(rows);
  const iso = parsed[0]?.date_created
    ? dateCreatedToISO(parsed[0].date_created)
    : null;
  const year = iso ? new Date(iso).getFullYear() : null;
  console.log(JSON.stringify({ label, col, date_created: parsed[0]?.date_created, year, ok: year === 2024 }));
}
