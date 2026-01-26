# Contributing to MonshyFlow

Thank you for your interest in contributing to MonshyFlow! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Documentation](#documentation)

## 📜 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please read our [Code of Conduct](./CODE_OF_CONDUCT.md).

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- MongoDB (or Azure Cosmos DB)
- Git
- Docker (optional, for containerized development)

### Setting Up Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/MonshyFlow.git
   cd MonshyFlow
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/evalolabs/MonshyFlow.git
   ```

4. **Install dependencies:**
   ```bash
   pnpm install
   ```

5. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Start development services:**
   ```bash
   # Using Docker (recommended)
   docker-compose up -d
   
   # Or manually
   pnpm dev
   ```

## 🔄 Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes
- `chore/` - Maintenance tasks

Examples:
- `feature/add-custom-node-type`
- `fix/workflow-execution-error`
- `docs/update-api-documentation`

### Making Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Write clean, maintainable code
   - Follow the coding standards
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes:**
   ```bash
   # Frontend tests
   cd frontend
   pnpm test
   
   # E2E tests
   pnpm test:e2e
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```
   
   Use conventional commit messages:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `style:` - Formatting
   - `refactor:` - Code refactoring
   - `test:` - Tests
   - `chore:` - Maintenance

5. **Keep your branch updated:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

6. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request** on GitHub

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` types - use proper types or `unknown`
- Use interfaces for object shapes
- Use enums for constants

### React/Frontend

- Use functional components with hooks
- Follow React best practices
- Use TypeScript for props and state
- Keep components small and focused
- Use meaningful component and variable names

### Backend

- Follow dependency injection patterns (tsyringe)
- Use proper error handling
- Log important events
- Validate input data
- Follow the existing service/controller pattern

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings (TypeScript/JavaScript)
- Add trailing commas in multi-line objects/arrays
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### File Organization

- Group related files together
- Use index files for clean imports
- Follow the existing project structure
- Keep files focused on a single responsibility

## 🧪 Testing

### Frontend Tests

```bash
cd frontend
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests with Playwright
```

### Writing Tests

- Write tests for new features
- Maintain or improve test coverage
- Test edge cases and error conditions
- Use descriptive test names

### Test Structure

```typescript
describe('ComponentName', () => {
  it('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## 📤 Submitting Changes

### Pull Request Process

1. **Update your branch** with the latest changes from `main`
2. **Ensure all tests pass**
3. **Update documentation** if needed
4. **Create a descriptive PR:**
   - Clear title and description
   - Reference related issues
   - Describe what changed and why
   - Include screenshots for UI changes

### PR Checklist

- [ ] Code follows the project's coding standards
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Code is self-documenting or commented
- [ ] No hardcoded secrets or credentials
- [ ] Branch is up to date with `main`

### Review Process

- Maintainers will review your PR
- Address any feedback or requested changes
- Be patient and respectful during reviews
- Respond to comments promptly

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms
- Explain "why" not just "what"
- Keep README files updated

### Documentation Files

- Update relevant `.md` files
- Add examples for new features
- Update API documentation if needed
- Keep the main README accurate

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Verify it's a bug, not a feature request
3. Try to reproduce the issue

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 0.1.0]

**Additional context**
Any other relevant information.
```

## 💡 Feature Requests

We welcome feature requests! Please:

1. Check if the feature already exists
2. Open a discussion or issue
3. Describe the use case
4. Explain the expected behavior
5. Consider implementation complexity

## 🎯 Areas for Contribution

- **New Node Types** - Add support for new integrations
- **UI/UX Improvements** - Enhance the workflow builder
- **Documentation** - Improve guides and examples
- **Testing** - Increase test coverage
- **Performance** - Optimize execution and rendering
- **Accessibility** - Improve a11y features
- **Internationalization** - Add translations

## ❓ Questions?

- Open a [GitHub Discussion](https://github.com/evalolabs/MonshyFlow/discussions)
- Check existing [Issues](https://github.com/evalolabs/MonshyFlow/issues)
- Read the [Documentation](./docs/README.md)

## 🙏 Thank You!

Your contributions make MonshyFlow better for everyone. We appreciate your time and effort!

---

**Happy Coding! 🚀**

