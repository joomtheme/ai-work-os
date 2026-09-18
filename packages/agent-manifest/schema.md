# Agent Manifest Schema

Agent definitions describe identity, role, capabilities, and runtime requirements.

## Fields

- name
- version
- role
- capabilities
- tools
- permissions

Example:

```yaml
agent:
  name: developer-agent
  version: 1.0.0
  capabilities:
    - coding
    - testing
```
