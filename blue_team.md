# Blue Team Report (Post Broadcast Application Simulation)

**Department of Computer Science and Engineering**  
**Lab Assignment (Journal Template)**  
**Academic Year:** 2025-26 Sem-II  
**Course Code:** CS 607L  
**Course Title:** Cyber Security Advanced Skill Development Lab  

**Semester:** II  
**Student Name:** Aswin Sureshkumar Nair  
**Roll Number:** 25-08-19  
**Assignment Title:** Blue Team Report (Post Broadcast Application)  
**Submission Date:** 22/02/2026

---

## Index

| Topic | Page No. |
| :--- | :--- |
| 1. Aim & Objective | 1 |
| 2. Background / Theory | 2 |
| 3. Tools & Environment | 3 |
| 4. Procedure / Methodology | 4 |
| 5. Results / Observations | 5 |
| 6. Analysis & Discussion | 8 |
| 7. Conclusion | 9 |
| 8. References | 10 |
| 9. Student Reflection | 11 |
| 10. Signatures | 12 |

---

## 1. Aim & Objective

### Aim
The aim of this project is to evaluate the security posture of the "Post Broadcast Application," a containerized microservices system, and to implement Blue Team defensive strategies to identify, document, and mitigate critical web application vulnerabilities.

### Objectives
*   Evaluate the effectiveness of internal service communication security.
*   Identify and document critical vulnerabilities such as Direct SQL Injection and stored XSS.
*   Simulate a Blue Team response by proposing specific technical mitigations.
*   Analyze the risk associated with insecure credential storage and default configurations.

---

## 2. Background / Theory

The Post Broadcast Application is built on a modern microservices architecture using Docker. It leverages Nginx as a reverse proxy, ExpressJS for the web and service layers, and PostgreSQL for persistent storage. 

Blue Teaming in this context involves understanding the interaction between these services and identifying points of failure in the "defense-in-depth" strategy. Web applications remain a primary target for attackers due to common pitfalls like improper input sanitization and weak session management. This report applies Blue Team principles to assess a realistic containerized environment.

---

## 3. Tools & Environment

| Software (Tools) | Description |
| :--- | :--- |
| **Docker / Docker Compose** | Container orchestration and environment isolation. |
| **Nginx** | Reverse proxy and load balancer. |
| **Node.js (ExpressJS)** | Backend application framework for web, api, and admin services. |
| **PostgreSQL 15** | Relational database management system. |
| **Redis** | In-memory data store for session management. |
| **Visual Studio Code** | IDE for code review and analysis. |

---

## 4. Procedure / Methodology

### 4.1 Environment Setup
The application was deployed using the provided `docker-compose.yml` file, which orchestrates the following services:
*   `nginx`: Listens on port 8080.
*   `web`: Primary user interface and routing logic.
*   `api` & `admin`: Internal services for data management.
*   `db`: PostgreSQL database.
*   `bot`: An automated service simulating admin activity on the message board.

### 4.2 Security Assessment Methodology
The Blue Team performed the following steps:
1.  **Architecture Review**: Analyzed the service interconnections and network configurations.
2.  **Static Analysis**: Reviewed the source code of the `web` service (specifically `routes.js`) to identify insecure coding patterns.
3.  **Vulnerability Identification**: Documented specific endpoints susceptible to attack (e.g., `/admin/query`, `/board`).
4.  **Impact Analysis**: Evaluated the potential damage of exploited vulnerabilities based on the CIA (Confidentiality, Integrity, Availability) triad.

---

## 5. Results / Observations

### 5.1 System Overview
The system exposes a public interface for registration, login, and viewing a message board. Administrative features include user promotion, direct database querying, and management of posts.

### 5.2 Identified Vulnerabilities

| Vulnerability ID | Title | Severity | Location |
| :--- | :--- | :--- | :--- |
| **VULN-01** | Direct SQL Injection | **Critical** | `/admin/query` |
| **VULN-02** | Stored Cross-Site Scripting (XSS) | **High** | `/board` (Post Content) |
| **VULN-03** | Insecure Internal Communication | **Medium** | Service-to-Service Headers |
| **VULN-04** | Cleartext Password Storage | **High** | `users` table |

#### VULN-01: Direct SQL Injection
*   **Description**: The `/admin/query` endpoint executes raw SQL from `req.body.q` using `pool.query(req.body.q)`.
*   **Observation**: Any user with an admin session has total control over the underlying database.

#### VULN-02: Stored XSS
*   **Description**: The message board template uses `<%- ... %>` to render post content without escaping HTML.
*   **Observation**: Malicious scripts can be injected into posts, which are then executed by the `bot` service (and other users), allowing session hijacking.

#### VULN-03: Insecure Internal API Communication
*   **Description**: Internal services rely on static headers (e.g., `x-role: admin`) that are easily spoofed if the internal network is reached.
*   **Observation**: Lack of robust mutual authentication between services.

---

## 6. Analysis & Discussion

The analysis reveals that while the application is functional and uses modern components (Redis for sessions, Nginx proxy), it lacks fundamental security controls. 

*   **Input Validation**: The most significant failure is the lack of input validation and parameterized queries. The application trusts administrative input implicitly.
*   **Defense in Depth**: The reliance on a single header for internal authorization demonstrates a flat security model within the container network.
*   **Credential Management**: Cleartext storage of passwords is a major risk, ensuring that a single database compromise leads to total user identity theft.

The presence of the `bot` service visiting the board every 5 seconds creates a high-frequency target for the Stored XSS vulnerability, making session theft almost certain for any active attacker.

---

## 7. Conclusion

This Blue Team assessment of the Post Broadcast Application demonstrates that architectural complexity (microservices) does not compensate for insecure coding. The "Critical" and "High" vulnerabilities identified provide multiple paths for an attacker to gain full system control. 

To improve defensive resilience, the application must transition to parameterized queries, implement strict HTML escaping, and adopt secure hashing for all credentials. Furthermore, internal service communication should be hardened using stronger authentication mechanisms than simple HTTP headers.

---

## 8. References

1.  MITRE ATT&CK Framework: [https://attack.mitre.org/](https://attack.mitre.org/)
2.  OWASP Top 10 Web Application Security Risks: [https://owasp.org/www-project-top-ten/](https://owasp.org/www-project-top-ten/)
3.  Docker Security Best Practices: [https://docs.docker.com/engine/security/](https://docs.docker.com/engine/security/)
4.  PostgreSQL Documentation: [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)

---

## 9. Student Reflection

Working on this Blue Team report highlighted the stark contrast between a functional application and a secure one. It was enlightening to see how small coding decisions (like using `<%-` vs `<%=`) have massive security implications. The microservices setup provided a realistic environment for understanding how vulnerabilities can cascade through a system. This exercise reinforced the importance of the "Secure by Design" philosophy.

---

## 10. Signatures

| | |
| :--- | :--- |
| **Student Signature:** | _______________________ |
| **Date:** | 22/02/2026 |
| **Instructor Remarks:** | [ ] Complete [ ] Partial [ ] Not Complete |
| **Instructor Signature:** | _______________________ |
| **Date:** | _______________________ |
