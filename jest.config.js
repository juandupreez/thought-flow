module.exports = {
  testMatch: [
    // Unit Tests
    
    '**/src/test/unit/concept-graph/concept-graph-model.test.ts',
    '**/src/test/unit/concept-matching/basic-concept-matching.test.ts',
    '**/src/test/unit/concept-matching/basic-matching-with-query-included-in-result.test.ts',
    '**/src/test/unit/rules/basic-rule-mechanics.test.ts',
    '**/src/test/unit/collections/sequence-mechanics.test.ts',
    // '**/src/test/unit/control-unit/fetch-decode-execute-cycle.test.ts',



    // Integration Tests: 
    // '**/src/test/integration/neo4j-quickrun-query.test.ts',

    // DI 1.0
    // '**/src/test/integration/di/1.0/data-load/load-from-files.test.ts',
    // '**/src/test/integration/di/1.0/reading-and-writing/reading-words.test.ts',


  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  }
}
