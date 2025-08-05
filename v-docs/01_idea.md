# 01 – Project Idea / Product Canvas

**Project Name:** seo-blog-checker

## 1. Executive Summary

A Node.js-based script that automates SEO quality evaluation of WordPress blog posts using Google's Gemini AI. The tool extracts content via WordPress REST API, evaluates it against configurable criteria using Gemini, and generates detailed Markdown reports suitable for both technical and non-technical stakeholders.

## 2. Problem Statement

- **Pain Point:** Manual SEO evaluation is time-consuming, subjective, and inconsistent across different evaluators
- **Affected Users:** SEO specialists, content creators, and product teams who need reliable SEO insights
- **Desired Change:** Automated, AI-powered SEO evaluation that provides consistent, objective analysis with clear, actionable reports

## 3. Target Users / Personas

| Persona | Description | Primary Needs |
|---------|-------------|---------------|
| SEO Specialist | Technical user who needs detailed SEO analysis | Comprehensive evaluation metrics, technical insights, batch processing |
| Content Creator | Writer who needs SEO guidance | Readable reports, actionable feedback, content optimization tips |
| Product Manager | Non-technical stakeholder who needs SEO insights | Clear visual reports, business impact metrics, trend analysis |

## 4. Value Proposition

- **Cost Reduction:** Automate repetitive SEO analysis tasks, reducing manual effort by 80%
- **Quality Improvement:** Consistent, objective evaluation using AI eliminates human bias
- **Scalability:** Process multiple blog posts simultaneously with configurable evaluation criteria
- **Strategic Insights:** Data-driven SEO recommendations improve content performance and organic traffic

## 5. Goals & Objectives (SMART)

| Goal | Success Criteria | Priority |
|------|------------------|----------|
| G1 | Successfully extract WordPress content via REST API | High |
| G2 | Generate accurate SEO evaluations using Gemini AI | High |
| G3 | Create readable Markdown reports for non-technical users | Medium |
| G4 | Support multiple configuration files for different use cases | Medium |
| G5 | Process batch requests efficiently | Low |

## 6. Non-Goals / Out of Scope

- Real-time SEO monitoring
- Automatic content optimization
- Integration with other CMS platforms beyond WordPress
- Web-based UI (command-line only for MVP)
- Historical trend analysis

## 7. Assumptions & Constraints

- WordPress site has REST API enabled
- Gemini API access and sufficient quota
- Local execution environment
- Content is in English (initial version)

## 8. Success Metrics / KPIs

| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|-------------------|
| Processing Speed | 0 | <30 seconds per post | Execution time measurement |
| Report Quality | 0 | 90% user satisfaction | User feedback surveys |
| Configuration Flexibility | 0 | Support 5+ config variations | Number of working configs |

## 9. Milestones & Timeline

| Milestone | Description | Target Date |
|-----------|-------------|-------------|
| M1 | Core extraction and evaluation working | 2024-01-31 |
| M2 | Markdown report generation complete | 2024-02-15 |
| M3 | Multiple config file support | 2024-02-28 |
| M4 | User testing and refinement | 2024-03-15 |

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Gemini API rate limits | Medium | High | Implement retry logic and caching |
| WordPress API changes | Low | Medium | Version-specific API handling |
| Configuration complexity | Medium | Medium | Provide clear examples and validation |

## 11. Stakeholders & Communication Plan

| Role | Name | Contact | Engagement |
|------|------|---------|------------|
| Product Owner | Conor Breen | | Weekly sync |
| Tech Lead | Conor Breen | | Code review |

## 12. Glossary

| Term | Definition |
|------|------------|
| SEO | Search Engine Optimization |
| REST API | Representational State Transfer Application Programming Interface |
| Gemini | Google's AI model for content evaluation |
| Slug | URL-friendly version of a page title |
