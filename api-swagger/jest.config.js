/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  // reflect-metadata нужен для декораторов TypeORM/Nest при импорте сущностей в тестах.
  setupFiles: ['reflect-metadata'],
};
