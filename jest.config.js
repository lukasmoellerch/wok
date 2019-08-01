module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  collectCoverage: true,
  coverageReporters: ["json", "html", "lcov"]
};
