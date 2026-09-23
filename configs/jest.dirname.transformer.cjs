const ts = require("typescript");
const path = require("node:path");

module.exports = {
    name: "commonjs-dirname-for-jest-esm",
    version: 1,
    factory: () => () => (sourceFile) => {
        if (!/\b__dirname\b/.test(sourceFile.text)) {
            return sourceFile;
        }
        const declaration = ts.factory.createVariableStatement(
            undefined,
            ts.factory.createVariableDeclarationList(
                [
                    ts.factory.createVariableDeclaration(
                        "__dirname",
                        undefined,
                        undefined,
                        ts.factory.createStringLiteral(path.dirname(sourceFile.fileName)),
                    ),
                ],
                ts.NodeFlags.Const,
            ),
        );
        return ts.factory.updateSourceFile(sourceFile, [declaration, ...sourceFile.statements]);
    },
};
