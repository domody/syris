import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { CheckIcon } from "lucide-react"

type ScopeMatrixRow = {
  tool: string
  read: boolean
  write: boolean
  send: boolean
}

const rows: ScopeMatrixRow[] = [
  { tool: "calendar.*", read: true, write: false, send: false },
  { tool: "ha.*", read: true, write: true, send: false },
  { tool: "gmail.*", read: true, write: false, send: true },
  { tool: "ai.*", read: true, write: false, send: false },
]

export function ScopeMatrix() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Tool Scope Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="pb-2 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground" />
              {["read", "write", "send"].map((h) => (
                <th
                  key={h}
                  className="pb-2 text-center font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.tool} className="border-t">
                <td className="py-1.5 font-mono text-[10px] text-muted-foreground">
                  {row.tool}
                </td>
                {([row.read, row.write, row.send] as boolean[]).map((val, j) => (
                  <td key={j} className="py-1.5 text-center">
                    <span className={val ? "text-success" : "text-muted-foreground/30"}>
                      {val ? <CheckIcon className="mx-auto size-3" /> : "—"}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
