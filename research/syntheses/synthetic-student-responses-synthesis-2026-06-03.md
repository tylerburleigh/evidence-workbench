# Synthetic Student Responses Synthesis

Date: 2026-06-03
Domain: synthetic-student-responses
Scope: Published baseline claims and subsequent literature-update records for the ten review questions in the synthetic student responses literature review. This report synthesizes existing public graph records only; it does not add new source, finding, or claim records.

## Evidence Inventory

The current graph answers all ten scoped review questions at baseline level. Each baseline claim is medium confidence and should be read as a targeted evidence-map result, not as a systematic review or a deployment policy.

Current published inventory:

- 10 baseline claims covering all 10 review questions.
- 92 baseline claim-linked finding references.
- 43 unique source records referenced across current synthesis/report artifacts, including 40 from baseline claim support maps and 3 model-choice student-simulation validity update sources.
- 18 synthetic-student-response publication events.
- 237 published graph targets across those events.
- 99 SSR evidence-appraisal lane records, all complete, with 0 blocking review records.
- Claim-level applicability facets remain populated for the nine original baseline claims; the sparse-data supplementation bundle adds artifact and finding facets plus a qualitative claim boundary.

Applicability facet mentions across the nine baseline claims that carry claim-level facets:

| Facet | Mentions |
| --- | --- |
| research_or_development | 9 |
| formative_feedback | 8 |
| in_term_or_classroom_assessment | 6 |
| summative_assessment | 7 |
| admissions_or_selection | 3 |
| no_direct_learner_consequence | 9 |
| feedback_or_instructional_support | 8 |
| high_stakes_individual_decision | 3 |
| institutional_or_accountability_decision | 2 |
| not_reported | 1 |
| training_augmentation | 4 |
| pre_pilot_validation | 4 |
| calibration_or_development | 5 |
| quality_evaluation | 4 |
| validation_or_benchmarking | 3 |
| stress_testing | 3 |
| generation_method_mapping | 1 |

These are claim-level facet mentions, not counts of independent studies. A single claim can carry multiple applicability values.

## Question Status

Short answer: yes, the project answered every question it set out to answer at baseline level. It answered some questions well enough for current synthesis use, and others only directionally because the source base is heterogeneous, targeted, or thin for operational scoring claims.

| Review question | Status | How well answered | Main boundary | Claim trace |
| --- | --- | --- | --- | --- |
| Use in Automated Scorer Validation | answered_directionally | Establishes a clear boundary: synthetic data is defensible for pre-pilot checks, challenge sets, fairness stress tests, augmentation, and scoring-adjacent item-development workflows, while real or independently human-scored responses remain central for scorer-accuracy validation. | Direct operational synthetic-only validation evidence remains limited; SMART is item-difficulty/scoring-adjacent evidence, not synthetic-only scorer validation. | ssr-scoring-validation-use-baseline-claim |
| Synthetic Response Generation Methods | answered_well | Identifies multiple generation families: rubric/profile-conditioned LLM generation, generative-agent learner simulation, example/error-conditioned prompting, corruption-based generation, and prompt-strategy simulated essays. | It maps method families; it does not rank them for every scoring use. | ssr-generation-methods-baseline-claim |
| Synthetic Response Quality Evaluation | answered_directionally | Shows that quality is evaluated through multiple non-equivalent signals: distributional realism, downstream utility, human-response consistency, expert score preservation, profile alignment, psychometric alignment, dialogue fidelity, grade-level language, knowledge scope, cognitive authenticity, and error-pattern plausibility. | Metrics are not interchangeable and do not automatically imply scoring validity, real-response interchangeability, or scorer-validation readiness. | ssr-quality-evaluation-baseline-claim |
| Model and Generation Effects | answered_directionally | Shows model/workflow sensitivity across several task types, including bounded LLM-version, multi-model, ensemble, post-training, profile, history-aware, multi-agent, DPO, IRT-aligned, cognitive-prototype, misconception-faithfulness, epistemic-state, and teacher-perceived authenticity evidence. | Evidence does not support one cross-task model ranking or a general claim that one model family, instruction style, or post-training approach is best. | ssr-model-generation-effects-baseline-claim |
| Prompt Engineering Effects | answered_directionally | Shows prompt ingredients matter for generated response behavior, including essay prompt strategies, grade enforcement, profile/role prompting, examples, targeted input conditioning, and lesson/task-context prompts. | Evidence supports task-bound prompt sensitivity, not universal prompt prescriptions. | ssr-prompt-engineering-effects-baseline-claim |
| Comparison With Real Student Responses | answered_directionally | Shows real-response comparisons are increasingly used, including same-task real responses, learning histories, lesson ideas, human-scored open-ended responses, IRT item difficulty, and dialogue/utterance comparators. | Comparator designs and metrics differ enough that conclusions remain task-bound; this does not establish interchangeability. | ssr-real-response-comparison-baseline-claim |
| Synthetic Response Scoring Agreement | answered_well | Establishes that label provenance and agreement checks are central before synthetic responses can support scoring work. | Synthetic labels are not equivalent to independent human labels unless audited or benchmarked. | ssr-synthetic-response-scoring-agreement-baseline-claim |
| Sparse Data Supplementation | answered_directionally | Shows direct examples where synthetic, simulated, transformed, feature-space, or image-augmented response data supplement sparse, imbalanced, or subgroup-limited datasets across essays, science short responses, math constructed responses, chemistry reasoning, programming ASAG, and student scientific models. | The pass is targeted rather than systematic; Martin/Graulich remains qualitative after a 2026-06-03 full-text retrieval attempt found only abstract/metadata access from this workspace; Bonthu remains abstract-level; feature-space/image augmentation is not synthetic prose; synthetic augmentation is not synthetic-only scorer validation. | ssr-sparse-data-supplementation-baseline-claim |
| Acceptable Uses in Automated Scoring | answered_well | Establishes a defensible acceptable-use boundary around supporting, diagnostic, developmental, operational QA/test-suite, and controlled training-augmentation roles, including direct operational examples. | Does not support synthetic-only final validation, deployment readiness, subgroup fairness validation, cut-score evidence, or substitution for real/human-scored responses. | ssr-acceptable-scoring-uses-baseline-claim |
| Assessment Stakes and Use Boundaries | answered_well | Directly answers the stakes question: acceptable use depends on assessment purpose, consequence level, and workflow role; direct operational evidence now supports limited training augmentation in one state summative assessment and simulated-response machine-scoring QA in operational summative workflows. | High-stakes and operational contexts still require stronger real/human validation for scoring-model claims; lower-stakes uses still need transparency, comparator, label, and oversight controls. | ssr-assessment-stakes-boundaries-baseline-claim |

## Cross-Cutting Conclusions

1. Synthetic student responses are strongest as supporting evidence, not replacement validation data.

The evidence base supports synthetic responses for pre-pilot checks, challenge sets, stress tests, training augmentation, calibration, prototype feedback testing, operational machine-scoring QA/test suites, and diagnostic development work. The New Mexico MSSA technical report adds a narrow operational state summative training-augmentation example: LLM-generated Writing responses were used as limited training augmentation for sparse high-score examples after review and approval. New Meridian and Maine add a different operational lane: simulated responses used to check scoring rules, scanning rules, item authoring, or machine-scored output. Zhang et al. strengthen the peer-reviewed research case for GPT essay training augmentation under held-out real-student evaluation. None of these sources support treating synthetic responses alone as final scorer validation, deployment-readiness evidence, subgroup fairness evidence, cut-score evidence, or a substitute for real or independently human-scored response data.

Trace: ssr-scoring-validation-use-baseline-claim; ssr-acceptable-scoring-uses-baseline-claim; ssr-assessment-stakes-boundaries-baseline-claim. Representative support: frohn-llm-cr-validation-framework-finding-2026; frohn-acceptable-prepilot-use-finding-2026; new-mexico-mssa-operational-synthetic-training-boundary-finding-2026; new-meridian-operational-simulated-response-test-suite-finding-2026; maine-science-operational-simulated-response-review-finding-2026; zhang-gpt-essay-training-augmentation-validity-boundary-finding-2026; walsh-acceptable-fairness-stress-test-finding-2026; frohn-llm-cr-live-scoring-2025-source; new-mexico-mssa-technical-report-2025-source; new-meridian-standard-processes-2020-source; maine-science-assessment-2024-technical-report-source; zhang-gpt-essay-augmentation-2026-source; walsh-sjt-automated-scoring-2026-source.

2. Sparse-data supplementation is a distinct research role, not a validation shortcut.

The sparse-data baseline and non-LLM constructed-response update show synthetic, transformed, simulated, feature-space, or image-augmented data used to supplement minority classes, underrepresented high scores, small datasets, score-distribution gaps, subgroup analyses, or generation-quality calibration. This role appears outside essay scoring in science short responses, NAEP mathematics constructed responses, chemistry reasoning, student text-response datasets, programming ASAG, and scientific-model scoring. The paper-facing literature review now treats this as a separate manuscript-style subsection with an explicit transition into the present study's rationale: synthetic responses can support training, balancing, stress testing, or calibration, but not stand-alone scorer validation. The strongest interpretation is training augmentation or research benchmarking under explicit boundaries, especially when evaluated on real held-out responses or compared with authentic additional responses. Wolfe and Barber add generation-quality validation before future augmentation use; Lun, Krisnawati, and Li add stronger non-LLM/non-essay examples; Martin and Graulich and Bonthu broaden the qualitative map but still need full-text extraction before numeric or method-specific synthesis.

Trace: ssr-sparse-data-supplementation-baseline-claim. Representative support: fang-gpt4-minority-class-scoring-finding-2025; morris-coedit-high-score-math-finding-2025; cochran-gpt35-small-data-finding-2023; lun-mda-asas-non-llm-short-answer-augmentation-finding-2020; krisnawati-smote-cross-prompt-asag-finding-2025; li-smote-scientific-models-imbalance-finding-2025; bonthu-non-llm-asag-augmentation-finding-2023; zhang-gpt-essay-augmentation-finding-2026; yoo-case-score-balance-finding-2025; wolfe-barber-realism-validation-finding-2026; martin-graulich-chatbot-chemistry-finding-2024; fang-gpt4-imbalanced-automatic-scoring-2025; morris-naep-math-constructed-response-2025; cochran-gpt35-student-text-augmentation-2023; lun-mda-asas-short-answer-augmentation-2020; krisnawati-cross-prompt-asag-smote-2025; li-scientific-models-smote-2025; bonthu-transfer-augmentation-asag-2023; zhang-gpt-generated-essay-augmentation-2026; yoo-dress-rubric-essay-scoring-2025; wolfe-barber-realistic-essay-augmentation-2026; martin-graulich-science-assessment-2024.

3. Stakes change what is acceptable.

High-stakes, summative, admissions, and deployment-readiness contexts should treat synthetic responses mainly as pre-pilot, diagnostic, training, calibration, operational rule-QA, or stress-test evidence. Controlled operational training augmentation can be acceptable when the evidence base documents review or approval, sparse-data rationale, real-response validation boundaries, and monitoring, but the current direct support is narrow. Operational simulated-response QA/test suites can be acceptable for checking rule-based machine-scoring implementation, but that evidence is not validation of a statistical or LLM scoring model. Lower-stakes formative and in-term contexts can justify broader exploratory use, especially for prototype feedback testing and scorer-development augmentation, but only when learner consequences are limited and response origin, label source, comparator data, and human oversight are explicit.

Trace: ssr-assessment-stakes-boundaries-baseline-claim; ssr-acceptable-scoring-uses-baseline-claim. Representative support: standards-stakes-intended-use-boundary-finding-2026; ets-ai-assessment-guardrails-finding-2026; usdoe-formative-feedback-boundary-finding-2026; new-mexico-mssa-operational-synthetic-training-boundary-finding-2026; new-meridian-operational-simulated-response-test-suite-finding-2026; maine-science-operational-simulated-response-review-finding-2026; rezayi-formative-hybrid-synthetic-training-boundary-finding-2026; djagba-classroom-synthetic-augmentation-validity-boundary-finding-2026; wang-high-stakes-off-topic-synthetic-detection-boundary-finding-2026.

4. Label provenance is a gating issue.

Synthetic responses are weak scoring evidence when their labels are generated, assumed, or prompt-assigned without audit. The strongest scoring-adjacent uses preserve a distinction between synthetic-response generation and label validation through expert scoring, human benchmarks, manual relabeling, or real-response test sets.

Trace: ssr-synthetic-response-scoring-agreement-baseline-claim; ssr-acceptable-scoring-uses-baseline-claim. Representative support: frohn-synthetic-prepilot-scoring-agreement-finding-2026; wolfe-human-scored-simulated-essays-finding-2026; bexte-generated-answer-label-noise-finding-2026; nebhi-majority-vote-synthetic-response-annotation-finding-2026.

5. Real-response comparison remains necessary but not sufficient.

The reviewed studies compare synthetic responses to real student data in several ways, including real essays, learning histories, item responses, NAEP response patterns, undergraduate responses, and tutoring-dialogue turns. Those comparisons are useful, but they are not equivalent across constructs or tasks. The paper-facing literature review now makes this a realism/model-effects subsection: the central question is not whether responses are generically realistic, but which comparator and quality construct they satisfy. A positive comparison in one setting does not establish general real/synthetic interchangeability.

The validity-conditions update adds four useful comparators. Nguyen and Cao compare generated science ideas with lesson ideas derived from pilot implementation and teacher consultation. Cao et al. evaluate mathematics simulated-learner authenticity against a defined learner profile, prior utterance data, and expert coding. Scarlatos et al.'s SMART pipeline compares synthetic-response item-difficulty estimates with human-scored real-response IRT estimates. Wu et al. use programming learning records to ground cognitive-level and mistake-pattern simulation. Together these sources sharpen the condition: realism is validity-relevant only when the comparator matches the intended claim.

Trace: ssr-real-response-comparison-baseline-claim; ssr-quality-evaluation-baseline-claim. Representative support: agent4edu-real-response-comparison-finding-2026; wolfe-real-essay-comparison-finding-2026; lu-real-student-mcq-comparison-finding-2026; srivatsa-naep-real-response-comparison-finding-2026; liu-human-respondent-irt-comparison-finding-2026; scarlatos-real-dialogue-comparison-finding-2026; duan-history-real-turn-comparison-finding-2026; nguyen-cao-science-thinking-realism-model-effects-finding-2026; cao-nguyen-authenticity-workflow-comparison-finding-2026; scarlatos-smart-irt-validity-boundary-finding-2026; wu-cognitive-level-imperfection-realism-finding-2026.

6. Quality evaluation is multidimensional.

Quality signals include realism, distributional fit, psychometric alignment, expert ratings, response consistency, downstream model utility, and dialogue fidelity. These are different constructs. A synthetic response set can look realistic while still being unsuitable for a particular scoring-validity or fairness-validity claim. The no-new-search synthesis pass strengthens the prose framing but does not change the evidence rating: quality evaluation remains answered directionally because existing studies use heterogeneous tasks and metrics.

Trace: ssr-quality-evaluation-baseline-claim; ssr-model-generation-effects-baseline-claim; ssr-prompt-engineering-effects-baseline-claim. Representative support: ipci-quality-evaluation-finding-2026; agent4edu-quality-evaluation-finding-2026; wolfe-quality-evaluation-finding-2026; lu-generative-students-quality-evaluation-finding-2026; srivatsa-proxy-student-irt-evaluation-finding-2026; scarlatos-dialogue-simulation-quality-finding-2026.

7. Model and prompt effects are real but task-bound.

The current evidence shows that model choice, post-training, prompt structure, grade enforcement, examples, role/profile conditioning, ensemble or resampling strategy, history-aware profiles, and workflow design affect synthetic response behavior. It does not yet support broad claims such as one model being best overall, instruction-tuned or education-oriented models being generally superior, or one prompt recipe being generally valid for automated scoring. The clean gap is controlled head-to-head comparison: same task, same rubric or response target, same score distribution, same comparator, and separable model, prompt, decoding, and post-training variables.

The new controlled-comparison sources strengthen this conclusion while preserving the boundary. Nguyen and Cao give direct six-model evidence for open-ended science ideas; Cao et al. show few-shot, fine-tuned, multi-agent, and DPO workflows trade off authenticity and pedagogical affordances; SMART shows DPO/IRT alignment can improve item-difficulty prediction with human-scored anchors; Wu et al. show cognitive prototypes and self-refinement matter for producing imperfect programming responses. These are model/workflow effects, not a general ranking of language models.

The model-choice student-simulation validity update adds three narrower boundaries. Do et al. show that prompted off-the-shelf instruction-tuned simulators can fail misconception faithfulness even when they are capable problem solvers; Yuan et al. argue that valid simulation should specify the learner's epistemic state rather than rely on surface realism; and Martynova et al. show teacher-observed authenticity gaps in GPT-3.5-turbo simulated learners. Together, these sources support desk-based reporting and task-specific selection criteria, not a first-hand model bakeoff or an actionable ranking of current model families.

Trace: ssr-model-generation-effects-baseline-claim; ssr-prompt-engineering-effects-baseline-claim. Representative support: agent4edu-model-generation-effects-finding-2026; srivatsa-model-prompt-irt-effects-finding-2026; scarlatos-post-training-effects-finding-2026; liu-llm-respondents-model-ensemble-finding-2026; duan-history-profile-rl-effects-finding-2026; wolfe-prompt-engineering-effects-finding-2026; lu-generative-students-prompt-architecture-finding-2026; watts-copilot-prompt-conditioning-finding-2026; nguyen-cao-science-thinking-realism-model-effects-finding-2026; cao-nguyen-authenticity-workflow-comparison-finding-2026; scarlatos-smart-irt-validity-boundary-finding-2026; wu-cognitive-level-imperfection-realism-finding-2026; do-misconception-faithfulness-off-the-shelf-limit-finding-2026; yuan-epistemic-fidelity-model-choice-boundary-finding-2026; martynova-teacher-authenticity-failure-finding-2025.

## Strength of Evidence

Stronger baseline answers:

- The field uses multiple distinct synthetic-response generation methods.
- Acceptable scoring uses are mostly developmental, diagnostic, or supporting.
- Sparse or imbalanced data supplementation is directly evidenced across essay and non-essay response formats, including older/non-LLM short-answer and constructed-response examples.
- Validity-relevant realism claims are stronger when tied to explicit real-response, lesson-idea, human-scored, IRT, cognitive-profile, or expert-coded comparators.
- Student-simulation realism claims are stronger when the intended learner state, misconception, or behavior pattern is specified and evaluated directly.
- Assessment stakes matter and must be separated from operational role.
- Operational simulated-response QA/test suites are a distinct use category from LLM training augmentation and final scorer validation.
- Label provenance and label audit are central for any scoring-adjacent use.

Directional baseline answers:

- Which quality metrics matter most for automated scoring.
- Whether realism, psychometric fidelity, dialogue fidelity, label fidelity, and downstream training utility predict one another.
- Whether model or prompt effects replicate under aligned tasks.
- Whether instruction-tuned, education-oriented, post-trained, or profile-conditioned models outperform prompted general models when evaluation conditions are held constant.
- Whether off-the-shelf model selection alone can preserve misconception faithfulness, learner-state fidelity, or teacher-perceived authenticity without task-specific evaluation.
- Whether cognitive-level realism and error-pattern realism predict downstream scorer behavior.
- How much real-response similarity is enough for a specific scorer-development claim.
- Whether synthetic responses improve scorer performance beyond real-data baselines in operational settings beyond narrow controlled training-augmentation cases.

Weak or still-open areas:

- Whether operational high-stakes training-augmentation examples generalize beyond the New Mexico MSSA workflow.
- Whether operational simulated-response QA/test-suite practices are common across vendors and states, and how they are documented.
- Whether synthetic augmentation consistently improves downstream scorer performance beyond real-data baselines for specific sparse classes or response formats.
- Full-text extraction for Bonthu et al. before detailed programming-ASAG method or numeric synthesis.
- Whether synthetic augmentation compares favorably with collecting a cost-equivalent set of additional authentic student responses.
- Synthetic-only operational high-stakes validation.
- Detailed numeric synthesis for Martin/Graulich before full-text extraction; a 2026-06-03 follow-up attempt was blocked at abstract/metadata access in this workspace.
- Grade-bearing classroom uses where synthetic data may affect student grades.
- State accountability, certification, licensure, placement, promotion, or admissions decisions beyond diagnostic stress testing.
- Subgroup fairness validation rather than fairness stress testing.
- Vendor or testing-program policies for synthetic-response use.
- Quantitative cross-study estimates of effects, because the current extracted evidence is too heterogeneous for a clean meta-analytic claim.

## Open Questions

The research raised several follow-up questions that are worth treating as new targeted bundles or a later systematic pass:

1. How common and reproducible are controlled operational training-augmentation workflows beyond the New Mexico MSSA example?
2. How common are simulated-response machine-scoring QA/test-suite practices across state reports and vendors, and what controls are normally documented?
3. What is acceptable in lower-stakes but grade-bearing classroom assessment, where the assessment is local but still consequential for the learner?
4. Can synthetic responses support subgroup fairness validation, or are they only defensible for diagnostic fairness and robustness stress testing?
5. Which real-response comparator designs are sufficient for which claims: realism, training utility, scorer agreement, feedback quality, fairness, or deployment readiness?
6. Which quality metrics actually predict downstream scorer performance or feedback quality?
7. How should generated labels, prompt-assigned labels, LLM annotations, and synthetic rubric labels be audited at scale?
8. Do model and prompt effects replicate when the same task, rubric, target score distribution, real-response comparator, decoding settings, and post-training conditions are held constant?
9. What policies do vendors, testing programs, districts, or assessment organizations use for synthetic-response data in automated scoring development, training, QA, monitoring, and validation?
10. What minimum reporting checklist should synthetic-response studies provide: response origin, generation method, prompt/model settings, label source, real comparator, validation-set composition, rubric space, assessment purpose, consequence level, and operational use?
11. Which response formats and augmentation forms show consistent gains from sparse-data augmentation when evaluated on held-out real student responses?
12. How often are high-score, minority-class, or subgroup-targeted synthetic responses independently human-scored before use?
13. Are there studies that hold the scorer fixed while varying validation data source: real-only, synthetic-only, and mixed validation sets?
14. Do synthetic programming or constructed-response error distributions match real student error distributions closely enough to support scorer stress testing?

## Tool Fit

This synthesis fits inside the tool's intended workflow. The report is a descriptive synthesis layer over already-published graph records, stored under `research/syntheses/`. It does not publish new evidence, change claim confidence, or turn a workflow recommendation into a public claim.

What transcends this research use case:

- The evidence-synthesis skill is broadly useful for any domain after baseline coverage exists.
- Applicability facets are broadly useful infrastructure because many domains need to separate population, setting, purpose, consequence, and operational role.
- A reusable synthesis inventory pattern is broadly useful: list covered scope units, classify answer quality, summarize cross-cutting conclusions, name gaps, and trace every conclusion.

What should stay domain-specific for now:

- The acceptable-use boundaries for synthetic student responses.
- The assessment-stakes interpretation.
- The response-origin, label-source, rubric-space, comparator, and scorer-use distinctions.
- Any policy language about synthetic responses in formative, in-term, summative, admissions, or high-stakes settings.

The tool-level enhancement worth considering later is a synthesis inventory helper that can prefill counts, claim IDs, source IDs, appraisal-lane status, and publication-event IDs. That should wait until this pattern repeats across domains. For now, the skill plus domain adapter plus Markdown report is the right level of structure.

## Next Actions

1. Use this report as the current synthesis memo for the synthetic-student-responses domain.
2. Keep `research/syntheses/synthetic-student-responses-sparse-data-supplementation-synthesis-2026-06-03.md` unindexed as the sidecar trace for the sparse-data supplementation pass.
3. Obtain the Martin/Graulich full text through a user-provided PDF, institutional access, or another primary full-text route before using it in quantitative or method-specific synthesis.
4. Obtain Bonthu et al. full text before using it for detailed programming-ASAG method comparison or numeric synthesis.
5. Search additional operational technical reports, state documentation, vendor documentation, and program policies before generalizing the New Mexico training-augmentation example or the New Meridian/Maine rule-QA examples.
6. Open a targeted bundle for subgroup fairness validation versus diagnostic fairness stress testing.
7. Consider a numeric extraction pass only after deciding which task families are comparable enough to quantify.
8. If manuscript reviewers need a stronger direct scorer-validation claim, open a targeted bundle on fixed-scorer real-only, synthetic-only, and mixed validation-set comparisons.
9. Defer broad tool automation until at least one more domain uses the evidence-synthesis workflow and reveals the same inventory needs.

## Traceability

Baseline claims:

- ssr-scoring-validation-use-baseline-claim: supports the boundary between pre-pilot/stress-test/augmentation uses and real-response scorer validation. Sources: frohn-llm-cr-live-scoring-2025-source; walsh-sjt-automated-scoring-2026-source; yoo-dress-rubric-aes-2025-source; wolfe-calibrating-realistic-essays-2026-source; scarlatos-smart-irt-simulated-students-2025-source.
- ssr-generation-methods-baseline-claim: supports the generation-method family map. Sources: ipci-knowledge-profiles-response-generation-2025-source; agent4edu-learner-response-generation-2025-source; watts-scientific-argumentation-chatbot-2025-source; yoo-dress-rubric-aes-2025-source; wolfe-calibrating-realistic-essays-2026-source.
- ssr-quality-evaluation-baseline-claim: supports the multidimensional quality-evaluation conclusion. Sources: ipci-knowledge-profiles-response-generation-2025-source; agent4edu-learner-response-generation-2025-source; wolfe-calibrating-realistic-essays-2026-source; lu-generative-students-item-evaluation-2024-source; srivatsa-llm-student-ability-simulation-2025-source; scarlatos-simulated-students-dialogue-2026-source; nguyen-cao-science-thinking-simulation-2026-source; cao-nguyen-math-simulated-learners-2026-source; scarlatos-smart-irt-simulated-students-2025-source; wu-embracing-imperfection-student-agents-2025-source.
- ssr-model-generation-effects-baseline-claim: supports the model/workflow sensitivity conclusion. Sources: agent4edu-learner-response-generation-2025-source; srivatsa-llm-student-ability-simulation-2025-source; scarlatos-simulated-students-dialogue-2026-source; liu-llm-respondents-item-evaluation-2025-source; duan-history-aware-profiles-student-simulation-2026-source; nguyen-cao-science-thinking-simulation-2026-source; cao-nguyen-math-simulated-learners-2026-source; scarlatos-smart-irt-simulated-students-2025-source; wu-embracing-imperfection-student-agents-2025-source.
- ssr-prompt-engineering-effects-baseline-claim: supports the task-bound prompt sensitivity conclusion. Sources: wolfe-calibrating-realistic-essays-2026-source; srivatsa-llm-student-ability-simulation-2025-source; lu-generative-students-item-evaluation-2024-source; watts-scientific-argumentation-chatbot-2025-source; nguyen-cao-science-thinking-simulation-2026-source; cao-nguyen-math-simulated-learners-2026-source.
- ssr-real-response-comparison-baseline-claim: supports the real-response comparator and non-interchangeability conclusion. Sources: agent4edu-learner-response-generation-2025-source; wolfe-calibrating-realistic-essays-2026-source; lu-generative-students-item-evaluation-2024-source; srivatsa-llm-student-ability-simulation-2025-source; liu-llm-respondents-item-evaluation-2025-source; scarlatos-simulated-students-dialogue-2026-source; duan-history-aware-profiles-student-simulation-2026-source; nguyen-cao-science-thinking-simulation-2026-source; cao-nguyen-math-simulated-learners-2026-source; scarlatos-smart-irt-simulated-students-2025-source; wu-embracing-imperfection-student-agents-2025-source.
- ssr-synthetic-response-scoring-agreement-baseline-claim: supports the label-provenance and agreement-check conclusion. Sources: frohn-llm-cr-live-scoring-2025-source; wolfe-calibrating-realistic-essays-2026-source; yoo-dress-rubric-aes-2025-source; bexte-zesch-synthetic-content-scoring-2025-source; nebhi-adaptive-writing-aig-scoring-2025-source; benedetto-simulated-exam-responses-2024-source.
- ssr-sparse-data-supplementation-baseline-claim: supports sparse or imbalanced response-data supplementation as a distinct research role. Sources: fang-gpt4-imbalanced-automatic-scoring-2025; morris-naep-math-constructed-response-2025; martin-graulich-science-assessment-2024; cochran-gpt35-student-text-augmentation-2023; lun-mda-asas-short-answer-augmentation-2020; krisnawati-cross-prompt-asag-smote-2025; li-scientific-models-smote-2025; bonthu-transfer-augmentation-asag-2023; zhang-gpt-generated-essay-augmentation-2026; yoo-dress-rubric-essay-scoring-2025; wolfe-barber-realistic-essay-augmentation-2026.
- ssr-acceptable-scoring-uses-baseline-claim: supports acceptable-use boundaries for automated scoring. Sources: frohn-llm-cr-live-scoring-2025-source; yoo-dress-rubric-aes-2025-source; bexte-zesch-synthetic-content-scoring-2025-source; nebhi-adaptive-writing-aig-scoring-2025-source; wolfe-calibrating-realistic-essays-2026-source; walsh-sjt-automated-scoring-2026-source; new-mexico-mssa-technical-report-2025-source; new-meridian-standard-processes-2020-source; maine-science-assessment-2024-technical-report-source; zhang-gpt-essay-augmentation-2026-source; rezayi-communication-skills-synthetic-training-2025-source; djagba-ngss-classroom-augmentation-2026-source; wang-off-topic-spoken-responses-2019-source; scarlatos-smart-irt-simulated-students-2025-source.
- ssr-assessment-stakes-boundaries-baseline-claim: supports the stakes and use-boundary synthesis. Sources: standards-educational-psychological-testing-2014-source; ets-responsible-ai-assessment-principles-2024-source; usdoe-teal-formative-assessment-source; frohn-llm-cr-live-scoring-2025-source; yoo-dress-rubric-aes-2025-source; bexte-zesch-synthetic-content-scoring-2025-source; watts-scientific-argumentation-chatbot-2025-source; walsh-sjt-automated-scoring-2026-source; new-mexico-mssa-technical-report-2025-source; new-meridian-standard-processes-2020-source; maine-science-assessment-2024-technical-report-source; zhang-gpt-essay-augmentation-2026-source; wang-off-topic-spoken-responses-2019-source; rezayi-communication-skills-synthetic-training-2025-source; djagba-ngss-classroom-augmentation-2026-source.

Additional model-choice student-simulation validity records used in the current synthesis narrative:

- do-misconception-faithfulness-2026-source: do-misconception-faithfulness-off-the-shelf-limit-finding-2026.
- yuan-valid-student-simulation-framework-2026-source: yuan-epistemic-fidelity-model-choice-boundary-finding-2026.
- martynova-human-learners-teacher-insights-2025-source: martynova-teacher-authenticity-failure-finding-2025.

Publication events:

- publish-ssr-scoring-validation-use-baseline-2026-06-02-2026-06-02t12-28-53-938z
- publish-ssr-generation-methods-baseline-2026-06-02-2026-06-02t13-26-12-424z
- publish-ssr-quality-evaluation-baseline-2026-06-02-2026-06-02t14-22-41-559z
- publish-ssr-model-generation-effects-baseline-2026-06-02-2026-06-02t17-08-56-355z
- publish-ssr-model-generation-effects-srivatsa-numeric-update-2026-06-02-2026-06-02t18-01-11-165z
- publish-ssr-prompt-engineering-effects-baseline-2026-06-02-2026-06-02t18-35-33-041z
- publish-ssr-real-response-comparison-baseline-2026-06-02-2026-06-02t18-55-01-388z
- publish-ssr-synthetic-response-scoring-agreement-baseline-2026-06-02-2026-06-02t19-40-47-165z
- publish-ssr-acceptable-scoring-uses-baseline-2026-06-02-2026-06-02t20-27-18-938z
- publish-ssr-assessment-stakes-boundaries-baseline-2026-06-02-2026-06-02t23-13-17-951z
- publish-ssr-assessment-stakes-boundaries-consequential-update-2026-06-03-2026-06-03t11-54-31-750z
- publish-ssr-acceptable-scoring-uses-operational-augmentation-update-2026-06-03-2026-06-03t12-07-08-257z
- publish-ssr-operational-practice-policy-update-2026-06-03-2026-06-03t13-26-26-193z
- publish-sparse-data-supplementation-baseline-2026-06-03-2026-06-03t15-21-48-538z
- publish-ssr-non-llm-constructed-response-augmentation-update-2026-06-03-2026-06-03t16-43-08-294z
- publish-ssr-validity-conditions-controlled-comparisons-update-2026-06-03-2026-06-03t19-28-50-265z
- publish-ssr-validity-conditions-claim-hardening-update-2026-06-03-2026-06-03t19-42-15-556z
- publish-ssr-model-choice-student-simulation-validity-update-2026-06-03-2026-06-03t20-20-40-207z

Evidence appraisal status:

- SSR evidence-appraisal lane records matching `data/evidence-appraisals/evidence-appraisal-ssr-*.json`: 99 complete, 0 blocking.
- Appraisal lanes represented: source_fidelity, construct_mapping, method_classification, scorer_validation_relevance, synthesis_overreach, applicability_boundary, and search_protocol.
