# Incident Response Plan — SmartProcure Platform

## 1. Incident Classification Matrix

| Severity Level | Definition | Response SLA | Escalation Path |
| :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Core MSP procurement or DBT payment system down across multiple mandis. | $< 15$ mins | Lead Architect, Backend SRE, Security Lead |
| **SEV-2 (High)** | Queue management or slot booking service impaired in a single district. | $< 30$ mins | Mandi Operations Manager, Systems Engineer |
| **SEV-3 (Medium)** | Notification delivery failure or non-critical UI dashboard glitch. | $< 2$ hours | Software Engineer, Support Team |
| **SEV-4 (Low)** | Minor reporting discrepancy or translation typo. | Next Sprint | Frontend / QA Engineer |

---

## 2. Incident Lifecycle Procedures
1. **Detection & Triage**: Automated Winston error log alert or Prometheus health metric breach.
2. **Containment**: Route traffic to fallback nodes; switch offline PWA mode for mandi gate check-ins.
3. **Remediation & Recovery**: Apply zero-downtime hotfix or roll back deployment via Git commit hash.
4. **Post-Mortem**: Document root cause, timeline, and preventive actions in `INCIDENT_REPORTS.md`.
