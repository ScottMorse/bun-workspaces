export class BunWorkspacesError extends Error {
  name = "BunWorkspacesError";
}

export type DefinedErrors<ErrorName extends string> = {
  [name in ErrorName]: typeof BunWorkspacesError;
};

export const defineErrors = <ErrorName extends string>(
  ...errors: ErrorName[]
): DefinedErrors<ErrorName> =>
  errors.reduce((acc, error) => {
    acc[error] = class extends BunWorkspacesError {
      constructor(message?: string) {
        super(message);
        this.name = error;
      }
      name = error;
    };

    Object.defineProperty(acc[error].prototype.constructor, "name", {
      value: error,
    });

    Object.defineProperty(acc[error].constructor, "name", {
      value: error,
    });

    Object.defineProperty(acc[error].prototype, "name", {
      value: error,
    });

    Object.defineProperty(acc[error], "name", {
      value: error,
    });

    return acc;
  }, {} as DefinedErrors<ErrorName>);
