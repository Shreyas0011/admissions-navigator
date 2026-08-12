import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveEventFn, saveSessionFn } from "@/domains/events/events.functions";
import { listProgrammesFn, listVenuesFn } from "@/domains/programmes/programmes.functions";
import { STAGES } from "@/config/constants";

type SessionDraft = { startsAt: string; endsAt: string; capacity: string; venueId: string };

const ANY = "__any__";
const emptySession = (): SessionDraft => ({ startsAt: "", endsAt: "", capacity: "40", venueId: ANY });

/** Event builder: event details -> sessions & venues -> strategy -> publish. */
export function EventForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const { data: programmes } = useQuery({ queryKey: ["programmes"], queryFn: () => listProgrammesFn() });
  const { data: venues } = useQuery({ queryKey: ["venues"], queryFn: () => listVenuesFn() });

  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("WOC");
  const [programmeId, setProgrammeId] = useState(ANY);
  const [targetStage, setTargetStage] = useState(ANY);
  const [strategy, setStrategy] = useState("LEAST_FILLED");
  const [publish, setPublish] = useState(true);
  const [sessions, setSessions] = useState<SessionDraft[]>([emptySession()]);

  const create = useMutation({
    mutationFn: async () => {
      const event = await saveEventFn({
        data: {
          title,
          eventType: eventType as never,
          programmeId: programmeId === ANY ? null : programmeId,
          targetStage: targetStage === ANY ? null : (targetStage as never),
          allocationStrategy: strategy as never,
          autoApprove: true,
          allowCancellation: true,
          cancellationCutoffHours: 24,
          isOpen: publish,
        },
      });
      const eventId = (event as { id: string }).id;
      for (const s of sessions.filter((x) => x.startsAt && x.endsAt)) {
        await saveSessionFn({
          data: {
            eventId,
            venueId: s.venueId === ANY ? null : s.venueId,
            startsAt: new Date(s.startsAt).toISOString(),
            endsAt: new Date(s.endsAt).toISOString(),
            capacity: Number(s.capacity),
            reservedSeats: 0,
            waitlistEnabled: true,
            waitlistSize: 20,
            isOpen: true,
          },
        });
      }
      return eventId;
    },
    onSuccess: () => {
      toast.success("Event created");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function patch(index: number, next: Partial<SessionDraft>) {
    setSessions((prev) => prev.map((s, i) => (i === index ? { ...s, ...next } : s)));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-2 block">Event title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="WOC Orientation" />
        </div>
        <Picker label="Type" value={eventType} onChange={setEventType}
          options={["WOC", "ACC", "EXAM", "OTHER"].map((v) => ({ value: v, label: v }))} />
        <Picker label="Programme" value={programmeId} onChange={setProgrammeId}
          options={[{ value: ANY, label: "All programmes" }, ...(programmes ?? []).map((p) => ({ value: p.id, label: p.name }))]} />
        <Picker label="Target stage" value={targetStage} onChange={setTargetStage}
          options={[{ value: ANY, label: "Any stage" }, ...STAGES.map((s) => ({ value: s.value, label: s.label }))]} />
        <Picker label="Allocation strategy" value={strategy} onChange={setStrategy}
          options={["FIRST_AVAILABLE", "LEAST_FILLED", "ROUND_ROBIN", "MANUAL"].map((v) => ({ value: v, label: v.replace(/_/g, " ") }))} />
        <Picker label="Publish now" value={publish ? "yes" : "no"} onChange={(v) => setPublish(v === "yes")}
          options={[{ value: "yes", label: "Publish (open self-registration)" }, { value: "no", label: "Keep as draft" }]} />
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Sessions</h4>
        {sessions.map((s, index) => (
          <div key={index} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-4">
            <DateTimeField
              label="Starts"
              value={s.startsAt}
              onChange={(v) => patch(index, { startsAt: v })}
            />
            <DateTimeField
              label="Ends"
              value={s.endsAt}
              onChange={(v) => patch(index, { endsAt: v })}
            />
            <div>
              <Label className="mb-2 block">Capacity</Label>
              <Input type="number" value={s.capacity} onChange={(e) => patch(index, { capacity: e.target.value })} />
            </div>
            <Picker label="Venue" value={s.venueId} onChange={(v) => patch(index, { venueId: v })}
              options={[{ value: ANY, label: "Venue TBC" }, ...(venues ?? []).map((v) => ({ value: v.id, label: `${v.name} (${v.capacity})` }))]} />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => setSessions((p) => [...p, emptySession()])}>
          Add session
        </Button>
      </div>

      <Button
        className="h-11 w-full"
        disabled={title.trim().length < 3 || create.isPending}
        onClick={() => create.mutate()}
      >
        {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
        Create event
      </Button>
    </div>
  );
}

function Picker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
