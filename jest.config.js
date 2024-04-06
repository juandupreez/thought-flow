module.exports = {
  testMatch: [
    // Unit Tests
    // '**/src/test/unit/question-answering.test.ts',
    '**/src/test/unit/util/ConceptMatcher.test.ts',
    '**/src/test/unit/rules/BasicRule.test.ts',



    // Integration Tests: DI 1.0
    // '**/src/test/integration/di/1.0/quickrun.test.ts',
    // '**/src/test/integration/di/1.0/ConceptGraphModelDao.test.ts',
    // '**/src/test/integration/di/1.0/Reader.test.ts',


  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  }
}
