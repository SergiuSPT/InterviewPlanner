import { database } from "../config/database.js";
import { participantIdSchema } from "../schemas/participantSchema.js";
import { sessionIdSchema } from "../schemas/sessionSchema.js";
import { assignParticipantSchema } from "../schemas/sessionParticipantSchema.js";

export async function assignParticipant(request, response, next) {
  try {
    const sessionIdValidation = sessionIdSchema.safeParse(
      request.params.id,
    );

    if (!sessionIdValidation.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    const bodyValidation = assignParticipantSchema.safeParse(
      request.body,
    );

    if (!bodyValidation.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid participant assignment",
        errors: bodyValidation.error.flatten().fieldErrors,
      });
    }

    const { participantId, participantRole } = bodyValidation.data;

    const result = await database.query(
      `
        INSERT INTO session_participants (
          interview_session_id,
          participant_id,
          participant_role
        )
        VALUES ($1, $2, $3)
        RETURNING
          id,
          interview_session_id AS "interviewSessionId",
          participant_id AS "participantId",
          participant_role AS "participantRole",
          created_at AS "createdAt"
      `,
      [
        request.params.id,
        participantId,
        participantRole,
      ],
    );

    return response.status(201).json({
      success: true,
      message: "Participant assigned to session",
      assignment: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return response.status(409).json({
        success: false,
        message: "This participant is already assigned to the session",
      });
    }

    if (error.code === "23503") {
      return response.status(404).json({
        success: false,
        message: "Interview session or participant not found",
      });
    }

    return next(error);
  }
}

export async function getSessionParticipants(
  request,
  response,
  next,
) {
  try {
    const idValidation = sessionIdSchema.safeParse(request.params.id);

    if (!idValidation.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    const result = await database.query(
      `
        SELECT
          participants.id,
          participants.full_name AS "fullName",
          participants.email,
          participants.current_rol AS "currentRole",
          participants.experience_level AS "experienceLevel",
          participants.notes,
          session_participants.participant_role AS "participantRole",
          session_participants.created_at AS "assignedAt"
        FROM session_participants
        INNER JOIN participants
          ON participants.id = session_participants.participant_id
        WHERE session_participants.interview_session_id = $1
        ORDER BY participants.full_name ASC
      `,
      [request.params.id],
    );

    return response.status(200).json({
      success: true,
      participants: result.rows,
    });
  } catch (error) {
    return next(error);
  }
}

export async function removeParticipant(request, response, next) {
  try {
    const sessionValidation = sessionIdSchema.safeParse(
      request.params.id,
    );

    const participantValidation = participantIdSchema.safeParse(
      request.params.participantId,
    );

    if (
      !sessionValidation.success ||
      !participantValidation.success
    ) {
      return response.status(400).json({
        success: false,
        message: "Invalid session or participant ID",
      });
    }

    const result = await database.query(
      `
        DELETE FROM session_participants
        WHERE interview_session_id = $1
          AND participant_id = $2
        RETURNING id
      `,
      [
        request.params.id,
        request.params.participantId,
      ],
    );

    if (result.rows.length === 0) {
      return response.status(404).json({
        success: false,
        message: "Participant assignment not found",
      });
    }

    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function getParticipantHistory(
  request,
  response,
  next,
) {
  try {
    const idValidation = participantIdSchema.safeParse(
      request.params.id,
    );

    if (!idValidation.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid participant ID",
      });
    }

    const participantResult = await database.query(
      `
        SELECT
          id,
          full_name AS "fullName",
          email,
          current_rol AS "currentRole",
          experience_level AS "experienceLevel"
        FROM participants
        WHERE id = $1
      `,
      [request.params.id],
    );

    if (participantResult.rows.length === 0) {
      return response.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    const historyResult = await database.query(
      `
        SELECT
          interview_sessions.id,
          interview_sessions.title,
          interview_sessions.interview_type AS "interviewType",
          interview_sessions.difficulty,
          interview_sessions.status,
          interview_sessions.scheduled_at AS "scheduledAt",
          interview_sessions.duration_minutes AS "durationMinutes",
          interview_sessions.completed_at AS "completedAt",
          session_participants.participant_role AS "participantRole"
        FROM session_participants
        INNER JOIN interview_sessions
          ON interview_sessions.id =
             session_participants.interview_session_id
        WHERE session_participants.participant_id = $1
        ORDER BY
          interview_sessions.scheduled_at DESC NULLS LAST,
          interview_sessions.created_at DESC
      `,
      [request.params.id],
    );

    return response.status(200).json({
      success: true,
      participant: participantResult.rows[0],
      sessions: historyResult.rows,
    });
  } catch (error) {
    return next(error);
  }
}