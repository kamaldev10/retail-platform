-- Migration: 0001_common_schema.sql
-- Description: Common Schema for Auth, Users, and Shared System Logs

CREATE SCHEMA IF NOT EXISTS common;

CREATE TABLE IF NOT EXISTS common.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
