import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'docs/api/schema.graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/gql/**/*', '!src/mocks/**/*'],
  ignoreNoDocuments: true,
  generates: {
    'src/gql/': {
      preset: 'client',
      presetConfig: { fragmentMasking: false },
      config: {
        scalars: { Date: 'string', DateTime: 'string' },
        enumsAsTypes: true,
        useTypeImports: true,
        nonOptionalTypename: false,
        skipTypename: false,
      },
    },
    // 목 리졸버용 스키마 전체 타입. 화면 코드는 쓰지 않는다 (src/gql 연산 타입만 쓴다).
    'src/mocks/__generated__/schema-types.ts': {
      plugins: ['typescript'],
      config: {
        scalars: { Date: 'string', DateTime: 'string' },
        enumsAsTypes: true,
        useTypeImports: true,
        avoidOptionals: { field: true, inputValue: false, object: true },
        maybeValue: 'T | null',
      },
    },
  },
};

export default config;
