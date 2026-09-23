BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    interview_type VARCHAR(30) NOT NULL
        CHECK (interview_type IN (
            'technical',
            'behavioral',
            'system_design'
        )),
    difficulty VARCHAR(20) NOT NULL
        CHECK (difficulty IN (
            'junior',
            'mid',
            'senior'
        )),
    status VARCHAR(20) NOT NULL DEFAULT 'planned'
        CHECK (status IN (
            'planned',
            'in_progress',
            'completed',
            'cancelled'
        )),
    scheduled_at TIMESTAMPTZ,
    duration_minutes INTEGER
        CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255),
    current_rol VARCHAR(150),
    experience_level VARCHAR(20)
        CHECK (
            experience_level IS NULL
            OR experience_level IN ('junior', 'mid', 'senior')
        ),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_session_id UUID NOT NULL
        REFERENCES interview_sessions(id)
        ON DELETE CASCADE,
    participant_id UUID NOT NULL
        REFERENCES participants(id)
        ON DELETE CASCADE,
    participant_role VARCHAR(20) NOT NULL
        CHECK (participant_role IN ('candidate', 'interviewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (interview_session_id, participant_id)
);

CREATE TABLE IF NOT EXISTS interview_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_session_id UUID NOT NULL
        REFERENCES interview_sessions(id)
        ON DELETE CASCADE,
    candidate_id UUID NOT NULL
        REFERENCES participants(id)
        ON DELETE CASCADE,
    reviewer_id UUID
        REFERENCES participants(id)
        ON DELETE SET NULL,
    overall_score INTEGER NOT NULL
        CHECK (overall_score BETWEEN 1 AND 5),
    strengths TEXT NOT NULL,
    improvement_areas TEXT NOT NULL,
    outcome VARCHAR(30) NOT NULL
        CHECK (outcome IN (
            'passed',
            'needs_improvement',
            'failed'
        )),
    recommendation VARCHAR(30)
        CHECK (
            recommendation IS NULL
            OR recommendation IN (
                'strong_hire',
                'hire',
                'neutral',
                'no_hire',
                'strong_no_hire'
            )
        ),
    additional_comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS interview_sessions_status_index
    ON interview_sessions(status);

CREATE INDEX IF NOT EXISTS interview_sessions_scheduled_at_index
    ON interview_sessions(scheduled_at);

CREATE UNIQUE INDEX IF NOT EXISTS participants_email_unique_index
    ON participants(LOWER(email))
    WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS session_participants_session_index
    ON session_participants(interview_session_id);

CREATE INDEX IF NOT EXISTS session_participants_participant_index
    ON session_participants(participant_id);

CREATE INDEX IF NOT EXISTS feedback_session_index
    ON interview_feedback(interview_session_id);

CREATE INDEX IF NOT EXISTS feedback_candidate_index
    ON interview_feedback(candidate_id);

CREATE INDEX IF NOT EXISTS feedback_reviewer_index
    ON interview_feedback(reviewer_id);

COMMIT;
