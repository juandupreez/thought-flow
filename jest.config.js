module.exports = {
  testMatch: [
    // Unit Tests
    // '**/src/test/unit/1_concept-matching/basic-concept-matching.test.ts',
    // '**/src/test/unit/2_rules/basic-rule-mechanics.test.ts',
    // '**/src/test/unit/question-answering/parrot-questions.test.ts',



    // Integration Tests: DI 1.0
    // '**/src/test/integration/di/1.0/quickrun.test.ts',
    '**/src/test/integration/di/1.0/ConceptGraphDao.test.ts',
    // '**/src/test/integration/di/1.0/Reader.test.ts',


  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  }
}
