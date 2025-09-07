# Contributing to pinia-plugin-storage

Thank you for your interest in contributing to `pinia-plugin-storage`! 🍍✨

We welcome all types of contributions - from bug reports and feature requests to documentation improvements and code changes. This project thrives on community collaboration, and we're open to anyone taking on leadership roles.

## Before You Start

### 💬 Discussion First, Please!

**Important**: Before opening a pull request, please start a discussion first. This helps us:

- Align on the approach and implementation details
- Avoid duplicate work
- Ensure the contribution fits the project's direction
- Save your time and effort

You can start discussions by:
- Opening an [Issue](../../issues) to discuss bugs, features, or improvements
- Starting a [Discussion](../../discussions) for broader topics or questions
- Reaching out in existing issues or discussions

## Ways to Contribute

### 🐛 Bug Reports

Found a bug? Help us fix it!

1. Check if the bug has already been reported in [Issues](../../issues)
2. If not, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Your environment (browser, Node.js version, etc.)
   - Minimal code example if possible

### 💡 Feature Requests

Have an idea for a new feature?

1. Check [existing issues](../../issues) and [discussions](../../discussions)
2. Open a new discussion to propose your feature
3. Include:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach
   - Examples of how it would be used

### 📚 Documentation

Documentation improvements are always welcome:

- Fix typos or unclear explanations
- Add more examples
- Improve API documentation
- Create tutorials or guides

### 🔧 Code Contributions

Ready to write some code? Great!

1. **Start with discussion** (see above)
2. Fork the repository
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit with clear, descriptive messages
7. Push to your fork and open a pull request

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm

### Getting Started

```bash
# Clone your fork
git clone https://github.com/yourusername/pinia-plugin-storage.git
cd pinia-plugin-storage

# Install dependencies
npm install

# Build the plugin
npm run build

# Run type checking
npm run type-check

# Test with the demo
npm run dev:demo
```

### Project Structure

```
src/
├── adapters/          # Storage adapters (localStorage, cookies, etc.)
├── core/              # Core functionality (resolvers, error handling)
├── operations/        # Hydration, persistence, synchronization
├── utils/             # Utility functions
├── index.ts           # Main export
├── plugin.ts          # Pinia plugin implementation
└── types.ts           # TypeScript type definitions

demo/                  # Demo application for testing
docs/                  # Documentation
```

### Code Standards

- Follow the existing code style
- Use TypeScript
- Write clear, self-documenting code
- Add comments for complex logic
- Include JSDoc comments for public APIs

### Testing

Before submitting:

1. **Build successfully**: `npm run build`
2. **Type check passes**: `npm run type-check`
3. **Demo works**: `npm run dev:demo`
4. **Test your changes** with different storage adapters
5. **Test in different browsers** if applicable

## Pull Request Process

### Before Opening a PR

- ✅ Discussion has happened (issue/discussion created)
- ✅ Code builds without errors
- ✅ Type checking passes
- ✅ Changes have been tested
- ✅ Documentation updated if needed

### PR Guidelines

1. **Reference the discussion**: Link to the issue or discussion in your PR
2. **Clear title and description**: Explain what changes you made and why
3. **Small, focused changes**: Keep PRs focused on a single feature or fix
4. **Update documentation**: Include relevant documentation updates
5. **Be responsive**: Address feedback promptly and constructively

### What to Expect

- We'll review your PR as soon as possible
- We may ask questions or request changes
- Once approved, we'll merge your contribution
- You'll be credited as a contributor! 🎉

## Leadership and Governance

### Open Leadership

This project welcomes community leadership:

- **No gatekeeping**: We're open to capable contributors taking on leadership roles
- **Collaborative decision-making**: Important decisions are discussed openly
- **Merit-based**: Leadership is earned through consistent, quality contributions
- **Succession planning**: The project should outlive any single maintainer

### Becoming a Maintainer

Interested in becoming a maintainer? Here's how:

1. **Consistent contributions**: Regular, quality contributions over time
2. **Community engagement**: Help others, participate in discussions
3. **Technical expertise**: Deep understanding of the codebase
4. **Alignment with project values**: Commitment to open, collaborative development

Reach out in discussions if you're interested!

## Code of Conduct

### Our Standards

- **Be respectful**: Treat everyone with kindness and respect
- **Be inclusive**: Welcome contributors from all backgrounds
- **Be constructive**: Provide helpful feedback and suggestions
- **Be patient**: Everyone learns at their own pace
- **Be collaborative**: Work together towards common goals

### What We Don't Tolerate

- Harassment, discrimination, or hate speech
- Personal attacks or inflammatory language
- Spam or off-topic content
- Violations of privacy or confidentiality

## Questions?

- 💬 Start a [Discussion](../../discussions)
- 🐛 Open an [Issue](../../issues)
- 📧 Contact the maintainers

## Recognition

All contributors will be recognized in our documentation and release notes. Thank you for helping make `pinia-plugin-storage` better! 🙏

---

> "The best way to predict the future is to implement it together." 

Happy coding! 🚀
