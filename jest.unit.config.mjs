import common from "./configs/jest.base.config.mjs";

const config = {
    ...common,

    testMatch: ["**/*.unit.spec.ts"],

    moduleNameMapper: {
        "^~context/application/(commands|queries)/(.*)\\.js$": "<rootDir>/src/context/application/$1/$2.ts",
        ...common.moduleNameMapper,
    },

    collectCoverageFrom: [
        "<rootDir>/src/common/transaction-manager/entities/**/*.ts",
        "<rootDir>/src/context/domain/entities/**/*.ts",
        "!src/**/*.schema.ts",
        "!**/*.unit.spec.ts",
        "!src/**/*.dto.ts",
        "!src/**/index.ts",
        "!src/**/*.d.ts",
        "!src/main.ts",
    ],

    coverageThreshold: {
        global: { statements: 0, lines: 0, functions: 0, branches: 0 },
    },
};

export default config;
