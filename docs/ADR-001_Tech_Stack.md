# ADR-001: Technology Stack Selection

**Status:** Accepted

**Context:**
This document records the architectural decision for the primary technologies used in the Affordability API project. A clear, deliberate choice of technologies is crucial for ensuring the project is maintainable, scalable, and aligns with the team's expertise.

**Decision:**
We have decided to use the following technology stack:
- **Frontend:** React (with Create React App)
- **Backend:** Node.js (with the Serverless Framework on AWS Lambda)
- **Database:** PostgreSQL

**Consequences:**

*   **React (Frontend):**
    *   **Why:** React was chosen for its component-based architecture, which promotes reusability and simplifies complex UIs. Its vast ecosystem and strong community support provide access to a wide range of libraries and tools, accelerating development. Create React App was used to bootstrap the project, providing a modern, optimized build setup with no configuration required.
    *   **Trade-offs:** For our simple MVP, React might be considered overkill. However, it provides a solid foundation for future feature expansion.

*   **Node.js / Serverless Framework (Backend):**
    *   **Why:** A serverless backend was chosen to minimize operational overhead and reduce costs. We only pay for compute time when the functions are actually running. The Serverless Framework simplifies the deployment and management of our AWS Lambda functions and resources. Node.js was selected for its non-blocking I/O model, which is well-suited for I/O-bound operations like handling API requests and database queries. It also allows us to use JavaScript across our entire stack, reducing context-switching for developers.
    *   **Trade-offs:** Serverless architectures can introduce challenges like cold starts and complexity in local testing, but these are acceptable for our current use case.

*   **PostgreSQL (Database):**
    *   **Why:** PostgreSQL was chosen for its reputation as a reliable, feature-rich, and open-source relational database. Its strong support for JSON and structured data makes it flexible enough to handle the data we need to store for landlords, applicants, and affordability reports. The relational model is a good fit for the clear relationships between our data entities.
    *   **Trade-offs:** For a simple MVP, a NoSQL database might have been faster to set up. However, we anticipate that the data relationships will become more complex, and a relational database provides better long-term data integrity.
