import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { joinLocalInput, label12h, splitLocalInput, timeSlots } from "@/lib/datetime";

const SLOTS = timeSlots(15);

/**
 * Date picker + 12-hour AM/PM time picker.
 * Emits/accepts a `datetime-local` string ("YYYY-MM-DDTHH:mm").
 */
export function DateTimeField({
  label,
  value,
  onChange,
  id,
}: {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  id?: string;
}) {
  const { date, time } = splitLocalInput(value);
  const options = time && !SLOTS.some((s) => s.value === time)
    ? [{ value: time, label: label12h(time) }, ...SLOTS]
    : SLOTS;

  return (
    <div>
      {label && (
        <Label htmlFor={id} className="mb-2 block">
          {label}
        </Label>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          type="date"
          className="flex-1"
          value={date}
          onChange={(e) => onChange(joinLocalInput(e.target.value, time || "09:00"))}
        />
        <Select
          value={time || undefined}
          onValueChange={(next) => onChange(joinLocalInput(date, next))}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {options.map((slot) => (
              <SelectItem key={slot.value} value={slot.value}>
                {slot.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
