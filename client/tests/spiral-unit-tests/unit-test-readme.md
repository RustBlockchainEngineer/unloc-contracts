## Spiral Unit Tests

Each `.spec.ts` file in this directory contains a single unit test. The unit tests are completely compartmentalized and do not share any state from test to test. 

There is an initialization file `utils/test-setup.sepc.ts` that is run before the entire test suite to initialize the global state account, the token mints, and airdrop the test users SOL for transaction fees. There are also two files with helper functions and various constants used throughout the different unit tests. 

Since each test file is its own unit test, they were made to be as concise as possible to increase their readability. Each test has extensive documentation describing what the purpose of each test is, as well as comments throughout the test code itself. Logging messages have been mostly removed through the code to avoid clutter and information overflow in the terminal when running the tests.

To run the tests, simply run `anchor test` in the terminal and all of the test files will execute. If you'd like to customize this command to execute a specific test, you can change the path in the `[scripts]` section of the `Anchor.toml` file accordingly.