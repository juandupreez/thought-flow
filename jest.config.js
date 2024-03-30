module.exports = {
  testMatch: [

    // '**/src/test/question-answering.test.ts',

    '**/src/test/util/ConceptMatcher.test.ts',

  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  }
}
