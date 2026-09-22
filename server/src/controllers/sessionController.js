import { database } from "../config/database.js";
import {  createSessionSchema,
          sessionIdSchema,
          updateSessionSchema
} from "../schemas/sessionSchema.js";
import { completeSessionSchema } from "../schemas/feedbackSchema.js";

export async function getSessions(request, response, next) {
  try {
    const result = await database.query(`
      SELECT
        id,
        title,
        interview_type AS "interviewType",
        difficulty,
        status,
        scheduled_at AS "scheduledAt",
        duration_minutes AS "durationMinutes",
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        completed_at AS "completedAt"
      FROM interview_sessions
      ORDER BY created_at DESC
    `);

    response.status(200).json({
      success: true,
      sessions: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function createSession(request, response, next) {
  try {
    const validationResult = createSessionSchema.safeParse(request.body);

    if (!validationResult.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid session data",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const {
      title,
      interviewType,
      difficulty,
      scheduledAt,
      durationMinutes,
      notes,
    } = validationResult.data;

    const result = await database.query(
      `
        INSERT INTO interview_sessions (
          title,
          interview_type,
          difficulty,
          scheduled_at,
          duration_minutes,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          title,
          interview_type AS "interviewType",
          difficulty,
          status,
          scheduled_at AS "scheduledAt",
          duration_minutes AS "durationMinutes",
          notes,
          created_at AS "createdAt",
          updated_at AS "updatedAt",
          completed_at AS "completedAt"
      `,
      [
        title,
        interviewType,
        difficulty,
        scheduledAt ?? null,
        durationMinutes ?? null,
        notes ?? null,
      ],
    );

    return response.status(201).json({
      success: true,
      message: "Interview session created successfully",
      session: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateSession(request, response, next) {
  try {
    const idValidation = sessionIdSchema.safeParse(request.params.id);

    if (!idValidation.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    const validationResult = updateSessionSchema.safeParse(request.body);

    if (!validationResult.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid session data",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const data = validationResult.data;
    const assignments = [];
    const values = [];

    function addField(column, value) {
      values.push(value);
      assignments.push(`${column} = $${values.length}`);
    }

    if (data.title !== undefined) {
      addField("title", data.title);
    }

    if (data.interviewType !== undefined) {
      addField("interview_type", data.interviewType);
    }

    if (data.difficulty !== undefined) {
      addField("difficulty", data.difficulty);
    }

    if (data.scheduledAt !== undefined) {
      addField("scheduled_at", data.scheduledAt);
    }

    if (data.durationMinutes !== undefined) {
      addField("duration_minutes", data.durationMinutes);
    }

    if (data.notes !== undefined) {
      addField("notes", data.notes);
    }

    values.push(request.params.id);
    const idParameter = `$${values.length}`;

    const result = await database.query(
      `
        UPDATE interview_sessions
        SET
          ${assignments.join(", ")},
          updated_at = NOW()
        WHERE id = ${idParameter}
        RETURNING
          id,
          title,
          interview_type AS "interviewType",
          difficulty,
          status,
          scheduled_at AS "scheduledAt",
          duration_minutes AS "durationMinutes",
          notes,
          completed_at AS "completedAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      values,
    );

    if (result.rows.length === 0) {
      return response.status(404).json({
        success: false,
        message: "Interview session not found",
      });
    }

    return response.status(200).json({
      success: true,
      message: "Interview session updated successfully",
      session: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
}

export async function completeSession(request, response, next) {
  const client = await database.connect();

  try {
    const idValidation = sessionIdSchema.safeParse(
      request.params.id,
    );

    if (!idValidation.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    const feedbackValidation = completeSessionSchema.safeParse(
      request.body,
    );

    if (!feedbackValidation.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid feedback data",
        errors: feedbackValidation.error.flatten().fieldErrors,
      });
    }

    const {
      candidateId,
      reviewerId,
      overallScore,
      strengths,
      improvementAreas,
      outcome,
      recommendation,
      additionalComments,
    } = feedbackValidation.data;

    await client.query("BEGIN");

    const sessionResult = await client.query(
      `
        SELECT id, status
        FROM interview_sessions
        WHERE id = $1
        FOR UPDATE
      `,
      [request.params.id],
    );

    if (sessionResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return response.status(404).json({
        success: false,
        message: "Interview session not found",
      });
    }

    if (sessionResult.rows[0].status === "completed") {
      await client.query("ROLLBACK");

      return response.status(409).json({
        success: false,
        message: "Interview session is already completed",
      });
    }

    const candidateResult = await client.query(
      `
        SELECT id
        FROM session_participants
        WHERE interview_session_id = $1
          AND participant_id = $2
          AND participant_role = 'candidate'
      `,
      [request.params.id, candidateId],
    );

    if (candidateResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return response.status(400).json({
        success: false,
        message:
          "The selected candidate is not assigned to this session",
      });
    }

    const reviewerResult = await client.query(
      `
        SELECT id
        FROM session_participants
        WHERE interview_session_id = $1
          AND participant_id = $2
          AND participant_role = 'interviewer'
      `,
      [request.params.id, reviewerId],
    );

    if (reviewerResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return response.status(400).json({
        success: false,
        message:
          "The selected reviewer is not an interviewer in this session",
      });
    }

    const feedbackResult = await client.query(
      `
        INSERT INTO interview_feedback (
          interview_session_id,
          candidate_id,
          reviewer_id,
          overall_score,
          strengths,
          improvement_areas,
          outcome,
          recommendation,
          additional_comments
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING
          id,
          interview_session_id AS "interviewSessionId",
          candidate_id AS "candidateId",
          reviewer_id AS "reviewerId",
          overall_score AS "overallScore",
          strengths,
          improvement_areas AS "improvementAreas",
          outcome,
          recommendation,
          additional_comments AS "additionalComments",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [
        request.params.id,
        candidateId,
        reviewerId,
        overallScore,
        strengths,
        improvementAreas,
        outcome,
        recommendation ?? null,
        additionalComments ?? null,
      ],
    );

    const completedSessionResult = await client.query(
      `
        UPDATE interview_sessions
        SET
          status = 'completed',
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          title,
          interview_type AS "interviewType",
          difficulty,
          status,
          scheduled_at AS "scheduledAt",
          duration_minutes AS "durationMinutes",
          notes,
          completed_at AS "completedAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [request.params.id],
    );

    await client.query("COMMIT");

    return response.status(200).json({
      success: true,
      message: "Interview completed and feedback recorded",
      session: completedSessionResult.rows[0],
      feedback: feedbackResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
}

export async function getSessionById(request, response, next) {
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
          id,
          title,
          interview_type AS "interviewType",
          difficulty,
          status,
          scheduled_at AS "scheduledAt",
          duration_minutes AS "durationMinutes",
          notes,
          completed_at AS "completedAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM interview_sessions
        WHERE id = $1
      `,
      [request.params.id],
    );

    if (result.rows.length === 0) {
      return response.status(404).json({
        success: false,
        message: "Interview session not found",
      });
    }

    return response.status(200).json({
      success: true,
      session: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
}