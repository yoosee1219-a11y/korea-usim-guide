# Auto Translate Skill

Fully automated translation workflow with monitoring and reporting.

## What this skill does:

1. **Start translation** in background
2. **Monitor progress** in real-time
3. **Auto-verify** when complete
4. **Auto-commit** and push to Git
5. **Auto-report** final results

## Usage:

Just run this skill and let it handle everything automatically.

## Workflow:

```bash
# 1. Start background translation
node scripts/translate-missing.js &

# 2. Monitor every 30 seconds
while translation_running; do
  check_progress
  report_status
  sleep 30
done

# 3. When complete, auto-verify
node scripts/check-missing.js

# 4. Auto-commit
git add .
git commit -m "feat: auto-translated blogs"

# 5. Auto-push
git push origin master

# 6. Generate report
echo "✅ All done! Report ready."
```

## Expected Behavior:

- NO user interaction needed
- Continuous progress updates
- Automatic verification
- Automatic Git operations
- Final completion report

This is what you wanted - fully autonomous execution!
