import { database } from "../config/database.js";
import { searchSchema } from "../schemas/searchSchema.js";

export async function search(request, response, next) {
  try {
    const validation = searchSchema.safeParse(request.query);

    if (!validation.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid search parameters",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { q, type } = validation.data;
    const searchPattern = `%${q}%`;

    const results = {
      sessions: [],
      participants: [],
      feedback: [],
    };

    if (type === "all" || type === "sessions") {
      const sessionResult = await database.query(
        `
          SELECT
            id,
            title,
            interview_type AS "interviewType",
            difficulty,
            status,
            scheduled_at AS "scheduledAt",
            completed_at AS "completedAt",
            duration_minutes AS "durationMinutes",
            notes
          FROM interview_sessions
          WHERE status = 'completed'
            AND (
              title ILIKE $1
              OR interview_type ILIKE $1
              OR difficulty ILIKE $1
              OR COALESCE(notes, '') ILIKE $1
            )
          ORDER BY completed_at DESC NULLS LAST
          LIMIT 25
        `,
        [searchPattern],
      );

      results.sessions = sessionResult.rows;
    }

    if (type === "all" || type === "participants") {
      const participantResult = await database.query(
        `
          SELECT
            id,
            full_name AS "fullName",
            email,
            current_role AS "currentRole",
            experience_level AS "experienceLevel",
            notes
          FROM participants
          WHERE
            full_name ILIKE $1
            OR COALESCE(email, '') ILIKE $1
            OR COALESCE(current_role, '') ILIKE $1
            OR COALESCE(experience_level, '') ILIKE $1
            OR COALESCE(notes, '') ILIKE $1
          ORDER BY full_name ASC
          LIMIT 25
        `,
        [searchPattern],
      );

      results.participants = participantResult.rows;
    }

    if (type === "all" || type === "feedback") {
      const feedbackResult = await database.query(
        `
          SELECT
            feedback.id,
            feedback.overall_score AS "overallScore",
            feedback.strengths,
            feedback.improvement_areas AS "improvementAreas",
            feedback.outcome,
            feedback.recommendation,
            feedback.additional_comments AS "additionalComments",
            feedback.created_at AS "createdAt",

            interview_sessions.id AS "sessionId",
            interview_sessions.title AS "sessionTitle",

            candidate.id AS "candidateId",
            candidate.full_name AS "candidateName",

            reviewer.id AS "reviewerId",
            reviewer.full_name AS "reviewerName"

          FROM interview_feedback AS feedback

          INNER JOIN interview_sessions
            ON interview_sessions.id =
               feedback.interview_session_id

          INNER JOIN participants AS candidate
            ON candidate.id = feedback.candidate_id

          LEFT JOIN participants AS reviewer
            ON reviewer.id = feedback.reviewer_id

          WHERE
            feedback.strengths ILIKE $1
            OR feedback.improvement_areas ILIKE $1
            OR feedback.outcome ILIKE $1
            OR COALESCE(feedback.recommendation, '') ILIKE $1
            OR COALESCE(feedback.additional_comments, '') ILIKE $1
            OR interview_sessions.title ILIKE $1
            OR candidate.full_name ILIKE $1
            OR COALESCE(reviewer.full_name, '') ILIKE $1

          ORDER BY feedback.created_at DESC
          LIMIT 25
        `,
        [searchPattern],
      );

      results.feedback = feedbackResult.rows;
    }

    return response.status(200).json({
      success: true,
      query: q,
      type,
      totalResults:
        results.sessions.length +
        results.participants.length +
        results.feedback.length,
      results,
    });
  } catch (error) {
    return next(error);
  }
}