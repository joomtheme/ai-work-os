-- AI Work OS Core Schema

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE missions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agents (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    capabilities JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mission_runs (
    id UUID PRIMARY KEY,
    mission_id UUID REFERENCES missions(id),
    agent_id UUID REFERENCES agents(id),
    status TEXT DEFAULT 'queued',
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE memories (
    id UUID PRIMARY KEY,
    agent_id UUID REFERENCES agents(id),
    type TEXT NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
