import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { academicYearInputSchema, programmeInputSchema, venueInputSchema } from "./schema";

export const listProgrammesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listProgrammes } = await import("./programmes.service");
    return listProgrammes();
  });

export const getProgrammeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { getProgrammeDetail } = await import("./programmes.service");
    return getProgrammeDetail(data.id);
  });

export const saveProgrammeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => programmeInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { saveProgramme } = await import("./programmes.service");
    return saveProgramme(data);
  });

export const listAcademicYearsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listAcademicYears } = await import("./programmes.service");
    return listAcademicYears();
  });

export const createAcademicYearFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => academicYearInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { createAcademicYear } = await import("./programmes.service");
    return createAcademicYear(data);
  });

export const listVenuesFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listVenues } = await import("./programmes.service");
    return listVenues();
  });

export const saveVenueFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => venueInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { requireAdmin } = await import("@/domains/users/access.server");
    await requireAdmin(context.supabase, context.userId);
    const { saveVenue } = await import("./programmes.service");
    return saveVenue(data);
  });

/** Public: the application form needs the list of programmes accepting applications. */
export const listOpenProgrammesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { listOpenProgrammes } = await import("./programmes.service");
  return listOpenProgrammes();
});
