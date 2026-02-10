-- ========================================
-- COMPLETE CHAT MIGRATION SCRIPT
-- Run this to fix your existing chat_messages table
-- ========================================

-- STEP 1: Backup your existing data first!
-- Run this command before making changes:
-- CREATE TABLE chat_messages_backup AS SELECT * FROM chat_messages;

-- STEP 2: Update existing messages to have proper receiver_id
-- For customer messages, set receiver to the admin user (id = 11)
UPDATE chat_messages 
SET receiver_id = 11 
WHERE sender_type = 'customer' AND (receiver_id = 0 OR receiver_id IS NULL);

-- For any admin messages without a receiver, you'll need to set them manually
-- This query helps you identify which ones need fixing:
SELECT id, sender_id, receiver_id, message, created_at 
FROM chat_messages 
WHERE sender_type = 'admin' AND (receiver_id = 0 OR receiver_id IS NULL);

-- If you have admin messages that need a receiver, update them like this:
-- UPDATE chat_messages SET receiver_id = 1 WHERE id = X; -- Replace X with actual message IDs

-- STEP 3: Add foreign key constraints
-- First, verify all sender_id and receiver_id reference valid users
SELECT 'Invalid sender_id found' as issue, id, sender_id 
FROM chat_messages 
WHERE sender_id NOT IN (SELECT id FROM users);

SELECT 'Invalid receiver_id found' as issue, id, receiver_id 
FROM chat_messages 
WHERE receiver_id NOT IN (SELECT id FROM users);

-- If the above queries return any rows, fix them before adding constraints

-- Add the foreign key constraints
ALTER TABLE chat_messages
ADD CONSTRAINT fk_chat_sender 
FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE chat_messages
ADD CONSTRAINT fk_chat_receiver 
FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;

-- STEP 4: Add indexes for better performance
CREATE INDEX idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_receiver ON chat_messages(receiver_id);
CREATE INDEX idx_chat_conversation ON chat_messages(sender_id, receiver_id);

-- STEP 5: Verify the migration
-- Check all messages now have valid sender and receiver
SELECT 
    COUNT(*) as total_messages,
    SUM(CASE WHEN sender_id > 0 AND receiver_id > 0 THEN 1 ELSE 0 END) as valid_messages,
    SUM(CASE WHEN receiver_id = 0 OR receiver_id IS NULL THEN 1 ELSE 0 END) as messages_without_receiver
FROM chat_messages;

-- View a sample of the corrected data
SELECT 
    cm.id,
    cm.sender_id,
    s.username as sender_username,
    cm.receiver_id,
    r.username as receiver_username,
    cm.sender_type,
    cm.message,
    cm.created_at
FROM chat_messages cm
LEFT JOIN users s ON cm.sender_id = s.id
LEFT JOIN users r ON cm.receiver_id = r.id
ORDER BY cm.created_at DESC
LIMIT 10;

-- STEP 6: (OPTIONAL) If you want to restore backup in case of issues:
-- DROP TABLE chat_messages;
-- RENAME TABLE chat_messages_backup TO chat_messages;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Count messages by type
SELECT 
    sender_type,
    COUNT(*) as message_count,
    COUNT(DISTINCT sender_id) as unique_senders,
    COUNT(DISTINCT receiver_id) as unique_receivers
FROM chat_messages
GROUP BY sender_type;

-- Check for orphaned messages (shouldn't exist after adding foreign keys)
SELECT 'Orphaned by sender' as issue, cm.*
FROM chat_messages cm
LEFT JOIN users u ON cm.sender_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'Orphaned by receiver' as issue, cm.*
FROM chat_messages cm
LEFT JOIN users u ON cm.receiver_id = u.id
WHERE u.id IS NULL;

-- View conversation threads
SELECT 
    LEAST(sender_id, receiver_id) as user1_id,
    GREATEST(sender_id, receiver_id) as user2_id,
    COUNT(*) as message_count,
    MAX(created_at) as last_message_at
FROM chat_messages
GROUP BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
ORDER BY last_message_at DESC;

-- ========================================
-- NOTES
-- ========================================
-- After running this migration:
-- 1. All customer messages will have receiver_id = 11 (admin)
-- 2. Foreign keys ensure data integrity
-- 3. Indexes improve query performance
-- 4. Use the new PHP files provided to interact with the chat system
-- ========================================