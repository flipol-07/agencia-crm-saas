---
title: Internal Team Chat
status: approved
---

# Internal Team Chat Feature (WhatsApp-style)

## 1. Overview
Implement a real-time internal chat feature allowing users to send private 1-on-1 messages to other users within the organization/platform. The interface should mimic WhatsApp (sidebar with conversations, active chat window).

## 2. Database Schema

### `team_chats` (Conversations)
Stores the existence of a conversation. For 1:1 chats, it exists if the two users have a chat.
- `id` (uuid, PK)
- `created_at` (timestamptz)
- `updated_at` (timestamptz) - used for sorting active chats
- `last_message_preview` (text) - cache for list view
- `is_group` (boolean) - default false (future proofing)

### `team_chat_participants` (Many-to-Many)
Links users to chats.
- `chat_id` (uuid, FK `team_chats`)
- `user_id` (uuid, FK `profiles`)
- `joined_at`
- PK: (chat_id, user_id)

### `team_messages`
The actual messages.
- `id` (uuid, PK)
- `chat_id` (uuid, FK `team_chats`)
- `sender_id` (uuid, FK `profiles`)
- `content` (text)
- `created_at` (timestamptz)
- `read_at` (timestamptz, nullable)

## 3. Security (RLS)
- **Chats**: Viewable if `auth.uid()` is in `team_chat_participants`.
- **Messages**: Viewable if `auth.uid()` is a participant of the parent chat.
- **Insert**: Allowed if `auth.uid()` is a participant (or creating a new valid 1:1 chat).

## 4. Frontend Components
New Feature Module: `src/features/team-chat/`

### Components
- `TeamChatLayout`: Main container (Sidebar + Chat Area).
- `ChatList`: Sidebar listing active conversations.
- `UserSelectorModal`: Modal to start a new chat (lists all profiles).
- `ChatWindow`:
    - `MessageList`: Renders bubbles.
    - `MessageInput`: Text area + Send button.

### Hooks
- `useTeamChat`: Manages real-time subscriptions and state (messages, active chat).

## 5. Implementation Steps
1.  **Migration**: Create tables and RLS policies.
2.  **Types**: Generate TypeScript definitions.
3.  **Visuals**: Create the Layout and Sidebar.
4.  **Logic**: Implement `UserSelectorModal` to creating/finding a `team_chat`.
5.  **Real-time**: Implement messaging and subscription logic.
6.  **Polish**: Styling to look like "WhatsApp".

## 6. Access
Route: `/chat` (or `/team-chat` to distinguish from AI/Contacts. Let's use `/team-chat` internally but maybe expose as "Chat Interno" in UI).
*Decision*: The user requested "apartado de chat". I will add it to the Sidebar as "Chat de Equipo".

## 7. Notes
- Use `useBillingProfile` logic (conceptually) to get user names/avatars.
- Messages must be encrypted? No requirement. Standard storage.
- Real-time is critical.
