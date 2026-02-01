# Implementation Plan - Multi-User Billing System

## Objective
Enable independent billing for each team member (Freelancers/Autónomos). Each user will have their own:
1.  Billing details (NIF, Address, Legal Name).
2.  Invoice sequence numbering (e.g., User A is at invoice #50, User B at #100).
3.  Ability to select the "Issuer" when creating an invoice.

## 1. Database Schema Changes

### `profiles` Table Update
Add billing-specific columns to the `profiles` table to store individual freelancer data.

- `billing_name` (text): Legal name for invoices.
- `billing_tax_id` (text): NIF/CIF.
- `billing_address` (text): Fiscal address.
- `invoice_prefix` (text): Optional prefix (e.g., "FULL-").
- `next_invoice_number` (int): The next number to be used (auto-increments).
- `billing_iban` (text): Bank account for payments (optional but useful).

### `invoices` Table Update
Add a reference to the issuer.

- `issuer_profile_id` (uuid): FK to `profiles`. RLS should allow reading if you are the issuer or an admin.

## 2. Frontend Changes

### Settings Page (`/settings`)
Refactor the settings page to focus on **Personal Billing Settings** instead of global "Company Settings".
- Form to edit `billing_name`, `billing_tax_id`, `billing_address`, `next_invoice_number`.
- "Global Settings" might remain for shared CRM things, but billing section moves to Profile.

### Invoice Creation (`/invoices/new`)
- Add a "Issuer" dropdown (Selector).
    - Default: Current User.
    - Options: All team members (since it's a small trusted team).
- When a user is selected:
    - Display their "Current Invoice Number" (Read from `next_invoice_number`).
    - Allow manual override of this number (user requirement: "tú apuntarías ese número").
- On Save:
    - Create Invoice with `issuer_profile_id`.
    - Update `profiles.next_invoice_number` = `used_number + 1`.

## 3. PDF Generation
- Update the Invoice PDF generator to use the **Issuer's** details (fetched via `issuer_profile_id`) instead of the global `settings` table.

## 4. Migration & Types
- Update `src/types/database.ts`.
- Run SQL migrations via Supabase MCP.
