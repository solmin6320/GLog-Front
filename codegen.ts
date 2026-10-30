import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'docs/api/schema.graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/gql/**/*', '!src/mocks/**/*', '!src/test/**/*'],
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
  },
};

export default config;
