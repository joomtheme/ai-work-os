# Agent Runtime

The Agent Runtime executes AI workers inside AI Work OS.

## Responsibilities

- Agent lifecycle management
- Tool execution
- Context handling
- Policy enforcement
- Result reporting
- Developer-created agent package loading
- Runtime compatibility layer

## Lifecycle

```text
Create
 ↓
Validate Manifest
 ↓
Load Context
 ↓
Plan
 ↓
Execute
 ↓
Verify
 ↓
Report
```

## Platform Role

The runtime is the bridge between community-built AI teams and user workspaces.
