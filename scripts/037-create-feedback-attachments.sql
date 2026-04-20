-- Create feedback_attachments table for storing image references
-- Images will be stored in MinIO later, this table stores the paths/references

CREATE TABLE IF NOT EXISTS application.feedback_attachments (
  attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES application.tickets(ticket_id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,  -- Path in MinIO/storage (e.g., "feedback/2024/01/uuid.webp")
  file_name TEXT,           -- Original file name
  file_size INTEGER,        -- File size in bytes
  mime_type TEXT DEFAULT 'image/webp',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by ticket
CREATE INDEX IF NOT EXISTS idx_feedback_attachments_ticket_id 
ON application.feedback_attachments(ticket_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON application.feedback_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON application.feedback_attachments TO service_role;
