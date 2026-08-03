import { z } from "zod";

export const programmeStatusSchema = z.enum(["DRAFT", "OPEN", "CLOSED"]);

export const programmeInputSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2, "Programme code is required").max(40),
  name: z.string().trim().min(2, "Programme name is required").max(160),
  department: z.string().trim().min(2, "Department is required").max(120),
  academicYearId: z.string().uuid().nullable().optional(),
  intake: z.coerce.number().int().min(1).max(10000),
  duration: z.string().trim().max(60).optional(),
  description: z.string().trim().max(1000).optional(),
  status: programmeStatusSchema.default("DRAFT"),
  applicationsOpenAt: z.string().trim().max(40).optional(),
  applicationsCloseAt: z.string().trim().max(40).optional(),
});

export type ProgrammeInput = z.infer<typeof programmeInputSchema>;

export const academicYearInputSchema = z.object({
  label: z.string().trim().min(4, "Use a label such as 2027-2028").max(20),
  startsOn: z.string().trim().min(1, "Start date is required"),
  endsOn: z.string().trim().min(1, "End date is required"),
});

export type AcademicYearInput = z.infer<typeof academicYearInputSchema>;

export const venueInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Venue name is required").max(120),
  campus: z.string().trim().min(2).max(120).default("Main Campus"),
  building: z.string().trim().max(120).optional(),
  floor: z.string().trim().max(40).optional(),
  capacity: z.coerce.number().int().min(1).max(5000),
  facilities: z.array(z.string().trim().max(60)).max(20).default([]),
  isActive: z.boolean().default(true),
});

export type VenueInput = z.infer<typeof venueInputSchema>;
