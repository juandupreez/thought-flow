module.exports = {
  testMatch: [
    // Unit Tests
    // '**/src/test/unit/question-answering.test.ts',

    // '**/src/test/unit/util/ConceptMatcher.test.ts',


    // Integration Tests
    // '**/src/test/integration/di/1.0/quickrun.test.ts',
    '**/src/test/integration/di/1.0/ConceptGraphModelDao.test.ts',
    // '**/src/test/integration/di/1.0/Neo4jConceptMatcher.test.ts',


  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  }
}
