import { database } from "../config/database.js";
import {
  createParticipantSchema,
  participantIdSchema,
} from "../schemas/participantSchema.js";

export async function createParticipant(request, response, next) {
  try {
    const validation = createParticipantSchema.safeParse(request.body);

    if (!validation.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid participant data",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const {
      fullName,
      email,
      currentRole,
      experienceLevel,
      notes,
    } = validation.data;

    const result = await database.query(
      `
        INSERT INTO participants (
          full_name,
          email,
          current_rol,
          experience_level,
          notes
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          full_name AS "fullName",
          email,
          current_rol AS "currentRole",
          experience_level AS "experienceLevel",
          notes,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [
        fullName,
        email?.toLowerCase() ?? null,
        currentRole ?? null,
        experienceLevel ?? null,
        notes ?? null,
      ],
    );

    return response.status(201).json({
      success: true,
      message: "Participant created successfully",
      participant: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return response.status(409).json({
        success: false,
        message: "A participant with this email already exists",
      });
    }

    return next(error);
  }
}

export async function getParticipants(request, response, next) {
  try {
    const result = await database.query(`
      SELECT
        participants.id,
        participants.full_name AS "fullName",
        participants.email,
        participants.current_rol AS "currentRole",
        participants.experience_level AS "experienceLevel",
        participants.notes,
        participants.created_at AS "createdAt",
        participants.updated_at AS "updatedAt",
        COUNT(session_participants.id)::INTEGER AS "sessionCount"
      FROM participants
      LEFT JOIN session_participants
        ON session_participants.participant_id = participants.id
      GROUP BY participants.id
      ORDER BY participants.full_name ASC
    `);

    return response.status(200).json({
      success: true,
      participants: result.rows,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getParticipantById(request, response, next) {
  try {
    const idValidation = participantIdSchema.safeParse(request.params.id);

    if (!idValidation.success) {
      return response.status(400).json({
        success: false,
        message: "Invalid participant ID",
      });
    }

    const result = await database.query(
      `
        SELECT
          id,
          full_name AS "fullName",
          email,
          current_rol AS "currentRole",
          experience_level AS "experienceLevel",
          notes,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM participants
        WHERE id = $1
      `,
      [request.params.id],
    );

    if (result.rows.length === 0) {
      return response.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    return response.status(200).json({
      success: true,
      participant: result.rows[0],
    });
  } catch (error) {
    return next(error);
  }
}