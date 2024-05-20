import {
  AbortError,
  AuthenticationError,
  AuthorizationError,
  ConstraintFailureError,
  ContendedTransactionError,
  InvalidRequestError,
  QueryCheckError,
  QueryFailure,
  QueryRuntimeError,
  QueryTimeoutError,
  ServiceInternalError,
  ThrottlingError,
} from "../../src";
import { getServiceError } from "../../src/errors";

describe("query", () => {
  it.each`
    httpStatus   | code                                | errorClass
    ${400}       | ${"invalid_query"}                  | ${QueryCheckError}
    ${400}       | ${"unbound_variable"}               | ${QueryRuntimeError}
    ${400}       | ${"index_out_of_bounds"}            | ${QueryRuntimeError}
    ${400}       | ${"type_mismatch"}                  | ${QueryRuntimeError}
    ${400}       | ${"invalid_argument"}               | ${QueryRuntimeError}
    ${400}       | ${"invalid_bounds"}                 | ${QueryRuntimeError}
    ${400}       | ${"invalid_regex"}                  | ${QueryRuntimeError}
    ${400}       | ${"invalid_schema"}                 | ${QueryRuntimeError}
    ${400}       | ${"invalid_document_id"}            | ${QueryRuntimeError}
    ${400}       | ${"document_id_exists"}             | ${QueryRuntimeError}
    ${400}       | ${"document_not_found"}             | ${QueryRuntimeError}
    ${400}       | ${"document_deleted"}               | ${QueryRuntimeError}
    ${400}       | ${"invalid_function_invocation"}    | ${QueryRuntimeError}
    ${400}       | ${"invalid_index_invocation"}       | ${QueryRuntimeError}
    ${400}       | ${"null_value"}                     | ${QueryRuntimeError}
    ${400}       | ${"invalid_null_access"}            | ${QueryRuntimeError}
    ${400}       | ${"invalid_cursor"}                 | ${QueryRuntimeError}
    ${400}       | ${"permission_denied"}              | ${QueryRuntimeError}
    ${400}       | ${"invalid_effect"}                 | ${QueryRuntimeError}
    ${400}       | ${"invalid_write"}                  | ${QueryRuntimeError}
    ${400}       | ${"internal_failure"}               | ${QueryRuntimeError}
    ${400}       | ${"divide_by_zero"}                 | ${QueryRuntimeError}
    ${400}       | ${"invalid_id"}                     | ${QueryRuntimeError}
    ${400}       | ${"invalid_secret"}                 | ${QueryRuntimeError}
    ${400}       | ${"invalid_time"}                   | ${QueryRuntimeError}
    ${400}       | ${"invalid_unit"}                   | ${QueryRuntimeError}
    ${400}       | ${"invalid_date"}                   | ${QueryRuntimeError}
    ${400}       | ${"limit_exceeded"}                 | ${QueryRuntimeError}
    ${400}       | ${"stack_overflow"}                 | ${QueryRuntimeError}
    ${400}       | ${"invalid_computed_field_access"}  | ${QueryRuntimeError}
    ${400}       | ${"disabled_feature"}               | ${QueryRuntimeError}
    ${400}       | ${"invalid_receiver"}               | ${QueryRuntimeError}
    ${400}       | ${"invalid_timestamp_field_access"} | ${QueryRuntimeError}
    ${400}       | ${"invalid_request"}                | ${InvalidRequestError}
    ${400}       | ${"abort"}                          | ${AbortError}
    ${400}       | ${"constraint_failure"}             | ${ConstraintFailureError}
    ${401}       | ${"unauthorized"}                   | ${AuthenticationError}
    ${403}       | ${"forbidden"}                      | ${AuthorizationError}
    ${409}       | ${"contended_transaction"}          | ${ContendedTransactionError}
    ${429}       | ${"limit_exceeded"}                 | ${ThrottlingError}
    ${440}       | ${"time_out"}                       | ${QueryTimeoutError}
    ${503}       | ${"time_out"}                       | ${QueryTimeoutError}
    ${500}       | ${"internal_error"}                 | ${ServiceInternalError}
    ${400}       | ${"some unhandled code"}            | ${QueryRuntimeError}
    ${401}       | ${"some unhandled code"}            | ${QueryRuntimeError}
    ${403}       | ${"some unhandled code"}            | ${QueryRuntimeError}
    ${409}       | ${"some unhandled code"}            | ${QueryRuntimeError}
    ${429}       | ${"some unhandled code"}            | ${QueryRuntimeError}
    ${440}       | ${"some unhandled code"}            | ${QueryRuntimeError}
    ${500}       | ${"some unhandled code"}            | ${QueryRuntimeError}
    ${503}       | ${"some unhandled code"}            | ${QueryRuntimeError}
    ${999}       | ${"some unhandled code"}            | ${QueryRuntimeError}
    ${undefined} | ${"some unhandled code"}            | ${QueryRuntimeError}
  `(
    "QueryFailures with status '$httpStatus' and code '$code' are correctly mapped to $errorClass",
    ({ httpStatus, code, errorClass }) => {
      const failure: QueryFailure = {
        error: {
          message: "error message",
          code,
          abort: "oops",
          constraint_failures: [{ message: "oops" }],
        },
      };

      const error = getServiceError(failure, httpStatus);
      expect(error).toBeInstanceOf(errorClass);
      expect(error.httpStatus).toEqual(httpStatus);
      expect(error.code).toEqual(code);

      const error_no_status = getServiceError(failure);
      expect(error_no_status).toBeInstanceOf(errorClass);
      expect(error_no_status.httpStatus).toBeUndefined();
      expect(error_no_status.code).toEqual(code);
    },
  );
});
