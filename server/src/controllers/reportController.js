import { database } from "../config/database.js";
import { reportQuerySchema } from "../schemas/reportSchema.js";

export async function getOverviewReport(
  request,
  response,
  next,
) {
  try {
    const validation = reportQuerySchema.safeParse(
      request.query,
    );

    if (!validation.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid report parameters",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const participantId =
      validation.data.participantId ?? null;

    const participantFilter = `
      (
        $1::uuid IS NULL
        OR EXISTS (
          SELECT 1
          FROM session_participants
          WHERE session_participants.interview_session_id =
                interview_sessions.id
            AND session_participants.participant_id = $1
            AND session_participants.participant_role = 'candidate'
        )
      )
    `;

    const summaryResult = await database.query(
      `
        SELECT
          COUNT(DISTINCT interview_sessions.id)::INTEGER
            AS "totalSessions",

          COUNT(DISTINCT interview_sessions.id)
            FILTER (
              WHERE interview_sessions.status = 'completed'
            )::INTEGER
            AS "completedSessions",

          COUNT(DISTINCT interview_sessions.id)
            FILTER (
              WHERE interview_sessions.status = 'planned'
            )::INTEGER
            AS "plannedSessions",

          COUNT(DISTINCT interview_sessions.id)
            FILTER (
              WHERE interview_sessions.status = 'in_progress'
            )::INTEGER
            AS "inProgressSessions",

          ROUND(
            AVG(interview_feedback.overall_score),
            2
          ) AS "averageScore"

        FROM interview_sessions

        LEFT JOIN interview_feedback
          ON interview_feedback.interview_session_id =
             interview_sessions.id
          AND (
            $1::uuid IS NULL
            OR interview_feedback.candidate_id = $1
          )

        WHERE ${participantFilter}
      `,
      [participantId],
    );

    const activityResult = await database.query(
      `
        SELECT
          TO_CHAR(
            DATE_TRUNC('month', interview_sessions.created_at),
            'YYYY-MM'
          ) AS month,

          COUNT(*)::INTEGER AS "totalSessions",

          COUNT(*)
            FILTER (
              WHERE interview_sessions.status = 'completed'
            )::INTEGER
            AS "completedSessions"

        FROM interview_sessions

        WHERE ${participantFilter}
          AND interview_sessions.created_at >=
              DATE_TRUNC('month', NOW()) - INTERVAL '5 months'

        GROUP BY DATE_TRUNC(
          'month',
          interview_sessions.created_at
        )

        ORDER BY DATE_TRUNC(
          'month',
          interview_sessions.created_at
        ) ASC
      `,
      [participantId],
    );

    const scoreTrendResult = await database.query(
      `
        SELECT
          interview_sessions.id AS "sessionId",
          interview_sessions.title,
          interview_sessions.completed_at AS "completedAt",
          interview_feedback.overall_score AS "overallScore"

        FROM interview_feedback

        INNER JOIN interview_sessions
          ON interview_sessions.id =
             interview_feedback.interview_session_id

        WHERE
          (
            $1::uuid IS NULL
            OR interview_feedback.candidate_id = $1
          )
          AND interview_sessions.status = 'completed'

        ORDER BY interview_sessions.completed_at ASC
      `,
      [participantId],
    );

    const outcomeResult = await database.query(
      `
        SELECT
          interview_feedback.outcome,
          COUNT(*)::INTEGER AS count

        FROM interview_feedback

        WHERE
          $1::uuid IS NULL
          OR interview_feedback.candidate_id = $1

        GROUP BY interview_feedback.outcome
        ORDER BY count DESC
      `,
      [participantId],
    );

    const typePerformanceResult = await database.query(
      `
        SELECT
          interview_sessions.interview_type AS "interviewType",
          COUNT(interview_feedback.id)::INTEGER
            AS "feedbackCount",

          ROUND(
            AVG(interview_feedback.overall_score),
            2
          ) AS "averageScore"

        FROM interview_feedback

        INNER JOIN interview_sessions
          ON interview_sessions.id =
             interview_feedback.interview_session_id

        WHERE
          $1::uuid IS NULL
          OR interview_feedback.candidate_id = $1

        GROUP BY interview_sessions.interview_type
        ORDER BY "averageScore" DESC
      `,
      [participantId],
    );

    const summary = summaryResult.rows[0];

    const completionRate =
      summary.totalSessions > 0
        ? Number(
            (
              (summary.completedSessions /
                summary.totalSessions) *
              100
            ).toFixed(1),
          )
        : 0;

    return response.status(200).json({
      success: true,
      participantId,
      summary: {
        ...summary,
        averageScore:
          summary.averageScore === null
            ? null
            : Number(summary.averageScore),
        completionRate,
      },
      activityByMonth: activityResult.rows,
      scoreTrend: scoreTrendResult.rows,
      outcomeDistribution: outcomeResult.rows,
      performanceByType: typePerformanceResult.rows.map(
        (item) => ({
          ...item,
          averageScore:
            item.averageScore === null
              ? null
              : Number(item.averageScore),
        }),
      ),
    });
  } catch (error) {
    return next(error);
  }
}