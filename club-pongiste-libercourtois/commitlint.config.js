module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation changes
        "style", // Code style changes (formatting, missing semi colons, etc)
        "refactor", // Code refactoring
        "perf", // Performance improvements
        "test", // Add or modify tests
        "chore", // Maintenance tasks
        "ci", // CI/CD changes
        "build", // Build system changes
        "revert", // Revert changes
      ],
    ],
    "subject-case": [2, "always", "lower-case"],
    "header-max-length": [2, "always", 72],
  },
};
