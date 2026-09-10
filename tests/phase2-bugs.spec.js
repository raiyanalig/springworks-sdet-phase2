const { test, expect } = require('@playwright/test');

const BASE_URL =
    process.env.BASE_URL || 'http://localhost:3010';


/*
===========================================================
PHASE 2 — REGRESSION TESTS FOR REPORTED BUGS

Each test is intentionally written so that the CURRENT
buggy implementation should FAIL.

Bugs covered:
1. stale-or-mismatched-aggregate
2. missing-boundary-check
3. off-by-one-boundary
4. missing-required-field
5. case-sensitivity-mismatch
===========================================================
*/


test.beforeEach(async ({ request }) => {

    // /api/reset is provided as test tooling by the challenge.
    // This gives every test a clean deterministic state.
    const response = await request.post(
        `${BASE_URL}/api/reset`
    );

    expect(response.ok()).toBeTruthy();
});


/*
===========================================================
BUG 1
POST /api/candidates/bulk
stale-or-mismatched-aggregate
===========================================================

Bug:
summary.accepted is based on the existing candidate count
instead of only the rows in the current request.

Initial seed contains 2 candidates.

One new valid row should therefore produce:

total    = 1
accepted = 1
rejected = 0
*/

test(
    'BUG 1 - summary counts must represent only current request',
    async ({ request }) => {

        const unique = Date.now();

        const response = await request.post(
            `${BASE_URL}/api/candidates/bulk`,
            {
                data: {
                    rows: [
                        {
                            name: `Aggregate Test ${unique}`,
                            email: `aggregate_${unique}@example.com`,
                            phone: '9876543210'
                        }
                    ]
                }
            }
        );

        const body = await response.json();

        console.log(
            '\nBUG 1 RESPONSE:\n',
            JSON.stringify(body, null, 2)
        );

        expect(response.ok()).toBeTruthy();

        // Exactly one row was submitted.
        expect(body.summary.total).toBe(1);

        // Exactly one row was accepted.
        expect(body.summary.accepted).toBe(1);

        // No rows were rejected.
        expect(body.summary.rejected).toBe(0);
    }
);


/*
===========================================================
BUG 2
POST /api/candidates/bulk
missing-boundary-check

Bug report:
+91XXXXXXXXXX is an explicitly supported phone format.

The current implementation incorrectly removes only two
characters from "+91..." instead of the complete "+91"
prefix, causing the valid number to be rejected.
===========================================================
*/

test(
    'BUG 2 - supported +91 phone format must be accepted',
    async ({ request }) => {

        const unique = Date.now();

        const phone = '+919123456789';

        const response = await request.post(
            `${BASE_URL}/api/candidates/bulk`,
            {
                data: {
                    rows: [
                        {
                            name: `Phone Boundary ${unique}`,
                            email: `phone_boundary_${unique}@example.com`,
                            phone
                        }
                    ]
                }
            }
        );

        const body = await response.json();

        console.log(
            '\nBUG 2 RESPONSE:\n',
            JSON.stringify(body, null, 2)
        );

        expect(response.ok()).toBeTruthy();

        const result = body.results[0];

        // According to the reported contract this is valid.
        expect(result.accepted).toBe(true);

        expect(result.candidate).toBeDefined();
    }
);


/*
===========================================================
BUG 3
POST /api/candidates/bulk
off-by-one-boundary

Bug report:
Blank lines must be ignored completely.

The frontend converts a blank line into an empty row object.
That empty row should not become a candidate result.
===========================================================
*/

test(
    'BUG 3 - blank rows must not be processed as candidates',
    async ({ request }) => {

        const unique = Date.now();

        const response = await request.post(
            `${BASE_URL}/api/candidates/bulk`,
            {
                data: {
                    rows: [
                        {
                            name: `Valid Row ${unique}`,
                            email: `blank_line_${unique}@example.com`,
                            phone: '9876543210'
                        },

                        // Represents a blank line produced by the UI parser.
                        {
                            name: '',
                            email: '',
                            phone: ''
                        }
                    ]
                }
            }
        );

        const body = await response.json();

        console.log(
            '\nBUG 3 RESPONSE:\n',
            JSON.stringify(body, null, 2)
        );

        expect(response.ok()).toBeTruthy();

        /*
         * There was one real candidate row.
         * The blank line should be ignored.
         */
        expect(body.summary.total).toBe(1);

        expect(body.results).toHaveLength(1);

        expect(body.results[0].accepted).toBe(true);
    }
);


/*
===========================================================
BUG 4
POST /api/candidates/bulk
missing-required-field

Bug:
A candidate with an empty phone field is accepted and
persisted.

Expected:
The row must be rejected.
===========================================================
*/

test(
    'BUG 4 - missing phone must be rejected',
    async ({ request }) => {

        const unique = Date.now();

        const response = await request.post(
            `${BASE_URL}/api/candidates/bulk`,
            {
                data: {
                    rows: [
                        {
                            name: `Missing Phone ${unique}`,
                            email: `missing_phone_${unique}@example.com`,
                            phone: ''
                        }
                    ]
                }
            }
        );

        const body = await response.json();

        console.log(
            '\nBUG 4 RESPONSE:\n',
            JSON.stringify(body, null, 2)
        );

        expect(response.ok()).toBeTruthy();

        const result = body.results[0];

        expect(result.accepted).toBe(false);

        expect(result.reason).toBeTruthy();

        expect(result.candidate).toBeUndefined();
    }
);


/*
===========================================================
BUG 5
POST /api/candidates/bulk
case-sensitivity-mismatch

Bug:
An existing email is detected as a duplicate only when
the casing is exactly identical.

Expected:
Duplicate email comparison should be case-insensitive.
===========================================================
*/

test(
    'BUG 5 - duplicate email detection must be case-insensitive',
    async ({ request }) => {

        const unique = Date.now();

        const originalEmail =
            `Duplicate_${unique}@example.com`;

        const differentCaseEmail =
            `duplicate_${unique}@EXAMPLE.COM`;


        // First candidate.
        const firstResponse = await request.post(
            `${BASE_URL}/api/candidates/bulk`,
            {
                data: {
                    rows: [
                        {
                            name: `First Duplicate ${unique}`,
                            email: originalEmail,
                            phone: '9876543210'
                        }
                    ]
                }
            }
        );

        const firstBody = await firstResponse.json();

        console.log(
            '\nBUG 5 FIRST RESPONSE:\n',
            JSON.stringify(firstBody, null, 2)
        );

        expect(firstResponse.ok()).toBeTruthy();

        expect(
            firstBody.results[0].accepted
        ).toBe(true);


        // Second candidate with same email but different casing.
        const secondResponse = await request.post(
            `${BASE_URL}/api/candidates/bulk`,
            {
                data: {
                    rows: [
                        {
                            name: `Second Duplicate ${unique}`,
                            email: differentCaseEmail,
                            phone: '9876543211'
                        }
                    ]
                }
            }
        );

        const secondBody = await secondResponse.json();

        console.log(
            '\nBUG 5 SECOND RESPONSE:\n',
            JSON.stringify(secondBody, null, 2)
        );

        expect(secondResponse.ok()).toBeTruthy();

        /*
         * Same logical email should be treated as duplicate.
         */
        expect(
            secondBody.results[0].accepted
        ).toBe(false);

        expect(
            secondBody.results[0].reason
        ).toBe('Duplicate email');
    }
);