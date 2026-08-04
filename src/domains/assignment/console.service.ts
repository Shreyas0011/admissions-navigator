import { listCounsellorsWithWorkload } from "@/domains/counsellors/counsellors.server";
import { listProgrammes } from "@/domains/programmes/programmes.service";
import { selectAssignmentLog, selectPools, selectUnassignedStudents } from "./assignment.repo";
import { selectAllRules, selectPolicies } from "./policies.repo";

/** One read for the whole Assignment Engine console. */
export async function getEngineConsole() {
  const [policies, pools, rules, counsellors, programmes, log, queue] = await Promise.all([
    selectPolicies(),
    selectPools(),
    selectAllRules(),
    listCounsellorsWithWorkload(),
    listProgrammes(),
    selectAssignmentLog(30),
    selectUnassignedStudents(50),
  ]);

  return {
    policies,
    pools: pools.map((p) => ({
      ...p,
      memberIds: p.counsellor_pool_members.map((m) => m.counsellor_id),
    })),
    rules,
    counsellors,
    programmes: programmes.map((p) => ({ id: p.id, name: p.name, code: p.code })),
    log,
    queueSize: queue.length,
  };
}
