import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/xlcheck")({
  ssr: false,
  component: () => {
    const [state, setState] = useState("loading");
    useEffect(() => {
      import("@/lib/bulk-upload")
        .then(async (m) => {
          const { Workbook } = await import("exceljs");
          const b = new Workbook();
          b.addWorksheet("x").addRow(["a"]);
          const buf = await b.xlsx.writeBuffer();
          setState(`ok ${typeof m.downloadTemplate} ${buf.byteLength}`);
        })
        .catch((e) => setState(`err ${String(e)}`));
    }, []);
    return <p id="xlstate">{state}</p>;
  },
});
