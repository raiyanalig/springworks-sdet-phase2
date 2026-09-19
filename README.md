\# Springworks SDET Hackathon — Phase 2



\## Overview



This repository contains automated regression tests for the five bugs identified during Phase 1 of the Springworks SDET Hackathon.



The tests are designed against the expected application behavior and are verified against the downloaded application.



\## Bugs Covered



1\. `stale-or-mismatched-aggregate`

2\. `missing-boundary-check`

3\. `off-by-one-boundary`

4\. `missing-required-field`

5\. `case-sensitivity-mismatch`



\## Technology



\- Node.js

\- JavaScript

\- Playwright Test

\- Playwright API testing



\## Project Structure



```text

.

├── data.js

├── isolation.js

├── package.json

├── package-lock.json

├── server.js

├── public/

│   ├── app.js

│   ├── index.html

│   ├── report-widget.js

│   └── style.css

└── tests/
      └── phase2-bugs.spec.js

