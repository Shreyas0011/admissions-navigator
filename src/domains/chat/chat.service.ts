import {
  insertMessage,
  markThreadRead,
  selectAssignedStudent,
  selectCounsellorForUser,
  selectMessages,
  selectStudentForUser,
  selectUnreadForCounsellor,
} from "./chat.repo";

export type ChatParty = {
  studentId: string;
  counsellorId: string;
  senderType: "STUDENT" | "COUNSELLOR";
  counterpartName: string;
  studentName: string;
};

/**
 * Chat is strictly between a student and the counsellor currently assigned to
 * them. Admins are not part of private conversations.
 */
async function resolveParty(userId: string, studentId?: string): Promise<ChatParty> {
  const student = await selectStudentForUser(userId);
  if (student) {
    if (!student.counsellor_id) throw new Error("No counsellor is assigned to you yet");
    if (studentId && studentId !== student.id) throw new Error("Forbidden");
    return {
      studentId: student.id,
      counsellorId: student.counsellor_id,
      senderType: "STUDENT",
      counterpartName: student.counsellors?.full_name ?? "Your counsellor",
      studentName: student.full_name,
    };
  }

  const counsellor = await selectCounsellorForUser(userId);
  if (!counsellor) throw new Error("Forbidden: this account has no chat access");
  if (!studentId) throw new Error("Pick a student to open the conversation");

  const assigned = await selectAssignedStudent(counsellor.id, studentId);
  if (!assigned) throw new Error("Forbidden: this student is not allocated to you");

  return {
    studentId: assigned.id,
    counsellorId: counsellor.id,
    senderType: "COUNSELLOR",
    counterpartName: assigned.full_name,
    studentName: assigned.full_name,
  };
}

export async function getThread(userId: string, studentId?: string) {
  const party = await resolveParty(userId, studentId);
  const messages = await selectMessages(party.studentId, party.counsellorId);
  await markThreadRead(party.studentId, party.counsellorId, party.senderType);
  return {
    me: party.senderType,
    counterpartName: party.counterpartName,
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      mine: m.sender_type === party.senderType,
      createdAt: m.created_at,
    })),
  };
}

export async function sendMessage(userId: string, body: string, studentId?: string) {
  const party = await resolveParty(userId, studentId);
  const clean = body.trim().slice(0, 2000);
  if (!clean) throw new Error("Write a message");
  await insertMessage({
    student_id: party.studentId,
    counsellor_id: party.counsellorId,
    sender_type: party.senderType,
    sender_user_id: userId,
    body: clean,
  });
  return { ok: true as const };
}

export async function listCounsellorUnread(userId: string) {
  const counsellor = await selectCounsellorForUser(userId);
  if (!counsellor) return {} as Record<string, number>;
  return selectUnreadForCounsellor(counsellor.id);
}
