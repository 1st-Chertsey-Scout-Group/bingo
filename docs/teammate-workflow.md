# Teammate Workflow (Manual Mode)

Alternative to the `/implement` loop — you drive each step manually using agent teams.

## Setup

Your `.claude/settings.json` has `teammateMode: "tmux"` and agent teams enabled. Each teammate runs in its own tmux pane.

## How It Works

Ask Claude to spawn teammates using the agent teams system. Claude uses `TeamCreate` to set up a team, then spawns agents via `Agent` with `team_name` and `name` parameters. Each agent appears in its own tmux pane.

## Examples

### Implement a single step

> Spawn an implement agent to do step 042

Claude creates a teammate that reads the step doc, implements it, and commits.

### Run reviews in parallel

> Spawn a product-review agent and a technical-review agent to audit the codebase

Claude spawns both — each gets its own pane and works independently.

### Implement a range

> Spawn an implement agent to do steps 042 through 050, pausing for my review after each

The agent works through the range sequentially, pausing between each for your input in its pane.

## Typical Session

```
# 1. Ask Claude to spawn an implement agent for step 042
# 2. Watch the tmux pane — agent implements and commits
# 3. Review the changes in your main session
git diff HEAD~1

# 4. Not happy? Send feedback to the agent or fix in your main session

# 5. Happy? Ask Claude to spawn review agents
# 6. Move on to the next step
```

## Managing Teammates

- `/agents` — opens the agent management UI (see running agents, stop them)
- **Switch tmux panes** — `Ctrl+B` then arrow keys
- **Kill a pane** — `Ctrl+B` then `x` in the pane you want to close

## When to Use This vs /implement

| Use `/implement` when                     | Use teammates when                             |
| ----------------------------------------- | ---------------------------------------------- |
| Working through steps sequentially        | Jumping to a specific step out of order        |
| Want an automated loop with review pauses | Want full manual control per step              |
| Solo session, focused build               | Running reviews in parallel while implementing |
