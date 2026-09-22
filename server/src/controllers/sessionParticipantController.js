import { database } from "../config/database.js";
import { participantIdSchema } from "../schemas/participantSchema.js";
import { sessionIdSchema } from "../schemas/sessionSchema.js";
import { assignParticipantSchema } from "../schemas/sessionParticipantSchema.js";

export async function assignParticipant(request, response, next) {
  let client;
  let transactionOpen = false;
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

    client = await database.connect();
    await client.query("BEGIN");
    transactionOpen = true;

    // Serialize assignments for this person, even when requests target different sessions.
    const participantResult = await client.query(
      "SELECT id FROM participants WHERE id = $1 FOR UPDATE",
      [participantId],
    );
    if (participantResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionOpen = false;
      return response.status(404).json({ success: false, message: "Participant not found" });
    }

    const targetSessionResult = await client.query(
      `
        SELECT
          id,
          title,
          scheduled_at AS "scheduledAt",
          COALESCE(duration_minutes, 60) AS "durationMinutes",
          status
        FROM interview_sessions
        WHERE id = $1
        FOR SHARE
      `,
      [request.params.id],
    );

    if (targetSessionResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionOpen = false;
      return response.status(404).json({
        success: false,
        message: "Interview session not found",
      });
    }

    const targetSession = targetSessionResult.rows[0];

    const existingAssignment = await client.query(
      "SELECT id FROM session_participants WHERE interview_session_id = $1 AND participant_id = $2",
      [request.params.id, participantId],
    );
    if (existingAssignment.rows.length > 0) {
      await client.query("ROLLBACK");
      transactionOpen = false;
      return response.status(409).json({
        success: false,
        message: "This participant is already assigned to the session",
      });
    }

    if (targetSession.scheduledAt && ["planned", "in_progress"].includes(targetSession.status)) {
      const conflictResult = await client.query(
        `
          SELECT
            existing_session.id,
            existing_session.title,
            existing_session.scheduled_at AS "scheduledAt",
            COALESCE(
              existing_session.duration_minutes,
              60
            ) AS "durationMinutes",
            existing_session.status,
            session_participants.participant_role AS "participantRole"

          FROM session_participants

          INNER JOIN interview_sessions AS existing_session
            ON existing_session.id =
              session_participants.interview_session_id

          WHERE session_participants.participant_id = $1

            AND existing_session.id <> $2

            AND existing_session.status IN (
              'planned',
              'in_progress'
            )

            AND existing_session.scheduled_at IS NOT NULL

            AND existing_session.scheduled_at <
              $3::timestamptz +
              make_interval(mins => $4::integer)

            AND existing_session.scheduled_at +
              make_interval(
                mins => COALESCE(
                  existing_session.duration_minutes,
                  60
                )
              ) > $3::timestamptz

          ORDER BY existing_session.scheduled_at ASC
          LIMIT 1
        `,
        [
          participantId,
          request.params.id,
          targetSession.scheduledAt,
          targetSession.durationMinutes,
        ],
      );

      if (conflictResult.rows.length > 0) {
        const conflictingSession = conflictResult.rows[0];

        await client.query("ROLLBACK");
        transactionOpen = false;
        return response.status(409).json({
          success: false,
          code: "SCHEDULE_CONFLICT",
          message:
            "This participant already has another interview during this time.",
          conflictingSession,
        });
      }
    }


    const result = await client.query(
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

    await client.query("COMMIT");
    transactionOpen = false;
    return response.status(201).json({
      success: true,
      message: "Participant assigned to session",
      assignment: result.rows[0],
    });
  } catch (error) {
    if (transactionOpen) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        return next(rollbackError);
      }
    }
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
  } finally {
    client?.release();
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
          session_participants.participant_role AS "participantRole",
          COALESCE((
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', feedback.id,
                'candidateId', feedback.candidate_id,
                'reviewerId', feedback.reviewer_id,
                'reviewerName', reviewer.full_name,
                'overallScore', feedback.overall_score,
                'strengths', feedback.strengths,
                'improvementAreas', feedback.improvement_areas,
                'outcome', feedback.outcome,
                'recommendation', feedback.recommendation,
                'additionalComments', feedback.additional_comments,
                'createdAt', feedback.created_at
              ) ORDER BY feedback.created_at DESC, feedback.id
            )
            FROM interview_feedback AS feedback
            LEFT JOIN participants AS reviewer
              ON reviewer.id = feedback.reviewer_id
            WHERE feedback.interview_session_id = interview_sessions.id
              AND feedback.candidate_id = $1
          ), '[]'::jsonb) AS feedback
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
