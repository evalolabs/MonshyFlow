# Security Guidelines for CI/CD

## ⚠️ Important: Protecting CI/CD from Malicious Contributors

This document explains security measures to protect the CI/CD pipeline from malicious code.

## Current Protection

✅ **CODEOWNERS**: All `.github/workflows/**` files require review from @evalolabs  
✅ **No Secrets in Workflows**: No hardcoded secrets in workflow files  
✅ **Read-Only Permissions**: Workflows have minimal permissions

## Potential Risks

### 1. Workflow File Modification
**Risk**: Contributors can modify `.github/workflows/*.yml` files  
**Mitigation**: 
- CODEOWNERS requires @evalolabs review
- **BUT**: Workflows can still run before merge if not properly protected

### 2. Code Injection
**Risk**: Malicious code in `package.json`, `pnpm-lock.yaml`, or test files  
**Mitigation**:
- Use `--frozen-lockfile` (already implemented)
- Review all dependency changes carefully
- Use Dependabot for security updates

### 3. Supply Chain Attacks
**Risk**: Malicious packages installed via `pnpm install`  
**Mitigation**:
- Review all new dependencies
- Use `pnpm audit` regularly
- Lock file is protected by CODEOWNERS

## Recommended Security Measures

### 1. GitHub Repository Settings

**Branch Protection Rules** (must be set in GitHub UI):
- Require pull request reviews before merging
- Require status checks to pass (including CI workflows)
- Require branches to be up to date
- **Do not allow bypassing** the above settings
- Require CODEOWNERS review

**Workflow Permissions** (already implemented):
- Set to read-only by default
- Only grant write permissions when absolutely necessary

### 2. Workflow Security

All workflows should:
- ✅ Use `permissions: read-only` (or minimal required)
- ✅ Use `--frozen-lockfile` for package installs
- ✅ Not run on forks unless explicitly approved
- ✅ Not expose secrets in logs

### 3. Code Review Checklist

When reviewing PRs that modify:
- `.github/workflows/**` - **CRITICAL**: Review carefully for malicious code
- `package.json` / `pnpm-lock.yaml` - Check for suspicious dependencies
- Test files - Ensure tests don't execute malicious code

### 4. Monitoring

- Monitor CI/CD runs for unusual behavior
- Review failed workflows for potential attacks
- Set up alerts for workflow modifications

## What Contributors CANNOT Do

Even with malicious intent, contributors **cannot**:
- ❌ Access repository secrets (not exposed to PR workflows)
- ❌ Modify protected branches directly (requires PR + review)
- ❌ Bypass CODEOWNERS (requires @evalolabs approval)
- ❌ Deploy to production (no deployment secrets in workflows)

## What Contributors CAN Do (and how we protect)

- ✅ Modify workflow files → **Protected by CODEOWNERS + Review**
- ✅ Add dependencies → **Protected by CODEOWNERS + Review**
- ✅ Modify test files → **Protected by Review + Tests run in isolated environment**

## Best Practices for Maintainers

1. **Always review workflow changes carefully**
2. **Never approve PRs that modify workflows without understanding the changes**
3. **Use branch protection rules** (set in GitHub UI)
4. **Monitor CI/CD runs** for suspicious activity
5. **Keep dependencies updated** (use Dependabot)

## Reporting Security Issues

If you discover a security vulnerability, please report it to @evalolabs privately.

---

**Last Updated**: 2025-01-XX

