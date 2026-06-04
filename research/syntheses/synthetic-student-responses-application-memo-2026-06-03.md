# Synthetic Student Responses Application Memo

Date: 2026-06-03
Domain: synthetic-student-responses
Purpose: Translate the current literature review into a practical position for using synthetic student responses in scoring-related work, with a focused lens on off-the-shelf language-model choice.

## Bottom Line

Synthetic student responses are defensible as development, training-augmentation, balancing, calibration, QA, and stress-test materials. They should not be described as stand-alone validation data for an automated scorer.

For the current work, the most defensible position is:

- Use synthetic responses to fill sparse score categories, probe rubric boundaries, create challenge sets, or support scorer-development experiments.
- Keep final scorer validation on held-out real student responses with human or expert labels.
- Treat language-model choice as a constrained implementation decision. The literature does not identify one generally best model for generating synthetic student responses, and this project is not adding first-hand model-comparison evidence.
- De-emphasize fine-tuning, DPO, and other post-training methods unless prompt-only off-the-shelf generation fails a required use case. Those methods are useful evidence that generation quality can improve, but they are not the practical path for this project.

## Recommended Claim Language

Use:

> Synthetic student responses were used as development and augmentation materials to improve coverage of sparse rubric categories and to stress-test scorer behavior. Scorer validity was evaluated using independent real student responses with human or expert labels.

Avoid:

> Synthetic student responses validated the scorer.

Also avoid:

> The selected LLM is the best model for synthetic student-response generation.

A better model-choice claim is:

> The selected model was chosen as a pragmatic off-the-shelf generation option based on capability, availability, documentation, stability, cost, and governance constraints. The literature does not support treating that choice as evidence that the model is generally best for synthetic student-response generation.

## Practical Workflow

1. Define the role of synthetic responses.

Acceptable roles for this project:

- Fill sparse rubric or score categories.
- Generate boundary cases for scorer review.
- Create QA or stress-test sets.
- Support scorer training or development.
- Calibrate prompt design before data collection or model training.

Do not use synthetic responses as the only validation set, the only fairness evidence, or the only evidence for deployment readiness.

2. Define the target response space before generating.

For each synthetic batch, record:

- Item or prompt.
- Rubric dimension.
- Intended score band or misconception.
- Expected response features.
- Generation model and model version.
- Prompt text and decoding settings.
- Whether labels are intended, model-assigned, human-assigned, or audited.

3. Set desk-based model-selection criteria.

Because this project is not doing first-hand model-comparison research, the model-choice step should define selection criteria rather than run a new experiment. A defensible off-the-shelf model choice should consider:

- Capability for the target response format and grade band.
- Stable model naming, versioning, and documentation.
- Prompt and output logging.
- Data privacy and governance fit.
- Cost and throughput.
- Reproducibility or rerun feasibility.
- Explicit epistemic-state or response-target constraints when the use claims to simulate learner knowledge, misconceptions, or learning over time.
- Existing literature showing that similar model families are sensitive to prompt and task conditions.

The output of this step is a justified implementation choice, not an empirical claim that the chosen model outperforms alternatives.

4. Specify what an implementer should audit.

If synthetic responses are generated later by this project or by another implementer, the audit should check:

- Usable yield: percent of generated responses that are plausible and fit the requested rubric category.
- Label fidelity: percent where human or expert audit agrees with the intended score category.
- Error realism: whether wrong or partial-credit responses contain plausible student errors, not just polished incorrect explanations.
- Distributional fit: whether response length, vocabulary, score distribution, and misconception mix resemble real responses.
- Diversity: low near-duplicate rate within each target category.
- Construct relevance: no artifacts that would teach the scorer to detect the generator instead of the construct.
- Downstream utility: scorer performance on held-out real responses is stable or improves, especially in sparse categories.
- Cost and repeatability: model version can be logged, rerun, and monitored.

5. Preserve real-response validation.

Synthetic data can enter training, calibration, or QA. The held-out evaluation set should remain real student responses, with labels from humans, experts, or an independently validated scoring process.

## Model-Choice Evidence

The model-choice literature is useful, but it mostly supports caution rather than a ranking.

| Evidence | What it says | Practical implication |
| --- | --- | --- |
| Benedetto et al. (2024) | A prompt engineered for GPT-3.5 to simulate skill-level exam responses did not transfer cleanly to other LLMs. | Do not assume a prompt calibrated on one model will work on another. Re-audit after every model change. |
| Gao et al. (2025) / Agent4Edu | GPT-4 outperformed GPT-3.5-turbo in a bounded 100-learner exploratory condition, but the result is entangled with learner profiles, memory, reflection, and action prompts. | Stronger models may help, but workflow and conditioning matter. Do not generalize this into a global GPT-4-style recommendation. |
| Srivatsa et al. (2025) | Across 11 LLMs on NAEP math and reading proxy-student tasks, model and grade-enforcement prompts changed IRT alignment, but no model-prompt pair reliably matched real students. | Grade/ability prompting can improve alignment, but model choice must be validated against the specific task and comparator. |
| Liu et al. (2025) | LLM respondent distributions and item-calibration correlations vary by model; GPT-3.5 and GPT-4 produced different calibration patterns, and LLM distributions were narrower than human distributions. | Compare model output distributions against real data. A high correlation is not enough if variability is unrealistic. |
| Lu and Wang (2024) | GPT-4 simulated-student behavior depends on profile, example, and role prompting. | Structured profile prompting is worth testing, but prompt ingredients need to be logged and audited. |
| Wolfe and Barber (2026) | Essay simulation quality varies by prompt strategy and is evaluated through expert scores, score-distribution checks, and realism ratings. | Prompt design is part of model selection. Choose the model-prompt pair, not the model alone. |
| Nguyen and Cao (2026) | Six LLMs generated K-12 science ideas; realism metrics varied by model and grade context, with non-Mistral models outperforming Mistral-7B on semantic similarity in that task. | A model can be weaker in one response format or grade context. Use same-task calibration instead of literature-level ranking. |
| Scarlatos et al. (2026) | In tutoring-dialogue simulation, prompting performed poorly on several fidelity metrics; SFT and DPO improved some metrics but still had limits. | For interactive student simulation, prompt-only off-the-shelf models may be insufficient. For this project, avoid making dialogue-like or longitudinal learner-state claims unless directly tested. |
| Do et al. (2026) | Across seven instruction-tuned LLMs, prompt-based simulators showed near-zero misconception-faithfulness under contrastive feedback; SFT and RL improved the metric. | Off-the-shelf models may abandon a simulated misconception when corrected. Treat post-training as boundary evidence, not the current project plan. |
| Yuan et al. (2026) | Valid student simulation requires explicit epistemic-state constraints because capable LLMs cannot simply "unknow" expert solution schemas. | If the use is more than one-shot response generation, document what the simulated learner can know, get wrong, and update over time. |
| Martynova et al. (2025) | Teachers who tutored GPT-3.5 simulated students identified authenticity gaps: high language complexity, limited emotion, unnatural attentiveness, repetition, inconsistency, and abrupt tactic changes. | Model choice should consider behavior and language fit, not only correctness or fluency. This is not a current-model ranking because the study used GPT-3.5-turbo. |

## Fine-Tuning Scope

Fine-tuning and preference optimization should be treated as out of scope for the current practical plan.

They matter for interpretation because several studies show that post-training can improve simulated-student fidelity in dialogue or belief-state tasks. That does not mean this project needs fine-tuning. It means the claims should stay narrow:

- We can generate one-shot or batch synthetic responses for sparse categories.
- We can audit those responses for realism, label fidelity, and downstream scorer utility.
- We should not claim to simulate a coherent learner over time unless we build and validate that capability.

If prompt-only generation cannot produce enough plausible low-score, misconception-rich, or partial-credit responses, the next practical step should be prompt redesign and target decomposition before considering fine-tuning.

The newer misconception-faithfulness evidence sharpens this boundary. Do et al. (2026) show that post-training can improve selective belief updating, but the practical lesson for this project is narrower: do not claim an off-the-shelf prompted model faithfully simulates learner misconceptions or learning trajectories unless that behavior has been externally evaluated.

## Decision Rule

Synthetic responses are acceptable for this project if all of the following are true:

- The use is development, augmentation, balancing, calibration, QA, or stress testing.
- The synthetic rows are clearly marked and separated from real validation data.
- Model, prompt, version, decoding settings, and generation date are logged.
- Intended labels are human-audited or independently checked before supervised use.
- A held-out real-response evaluation set remains the basis for scorer-performance claims.
- Performance on real responses does not degrade overall or in the sparse categories the synthetic data were meant to help.
- The final report states the boundary: synthetic responses supported development or augmentation; they did not independently validate the scorer.

Stop or revise the synthetic-response workflow if:

- The model produces responses that are too polished, too correct, or linguistically unlike the target population.
- Human audit finds weak agreement between intended and actual rubric category.
- Errors are generic rather than construct-specific.
- Generated responses contain artifacts that could bias scorer training.
- Output quality changes after a model-version update.
- Synthetic augmentation improves synthetic or mixed validation results but not held-out real-response results.

## Minimal Reporting Checklist

For each synthetic-response batch, report:

- Response origin: synthetic, real, transformed, or feature-space augmentation.
- Generation model and version.
- Prompt and examples.
- Decoding settings.
- Item or task context.
- Intended score band, rubric category, or misconception.
- Label source and label-audit method.
- Number generated, number retained, and exclusion reasons.
- Real-response comparator used for audit.
- Whether synthetic data entered training, calibration, QA, or stress testing.
- Whether validation and test sets were real, synthetic, or mixed.
- Assessment purpose and consequence level.

## Application to Our Current Question

The literature can support this rationale:

Synthetic student responses are useful when real responses are sparse, expensive, or imbalanced, especially for underrepresented score bands or misconception categories. The strongest use is not to replace real evidence, but to make scorer development more robust before final evaluation on real responses.

The language-model choice should be handled as a desk-based implementation recommendation:

1. State that the literature does not identify a generally superior model for synthetic student-response generation.
2. Recommend an off-the-shelf model-selection basis: capability, availability, version stability, documentation, privacy/governance fit, cost, and reproducibility.
3. Treat model and prompt details as required reporting fields.
4. Document response-target or epistemic-state constraints when the intended synthetic data depend on learner knowledge, misconceptions, language level, or staged partial understanding.
5. Require any generated responses used later to be audited for label fidelity, realism, and artifacts by whoever performs the generation.
6. Preserve the boundary that scorer-performance claims still require held-out real responses.

This is more defensible than selecting a model because a paper found it best in another subject, grade, item format, or simulation objective.

## Traceability

Graph-backed source records:

- Benedetto et al. (2024): benedetto-simulated-exam-responses-2024-source
- Gao et al. (2025): agent4edu-learner-response-generation-2025-source
- Srivatsa et al. (2025): srivatsa-llm-student-ability-simulation-2025-source
- Liu et al. (2025): liu-llm-respondents-item-evaluation-2025-source
- Lu and Wang (2024): lu-generative-students-item-evaluation-2024-source
- Wolfe and Barber (2026): wolfe-calibrating-realistic-essays-2026-source
- Nguyen and Cao (2026): nguyen-cao-science-thinking-simulation-2026-source
- Scarlatos et al. (2026): scarlatos-simulated-students-dialogue-2026-source
- Yoo et al. (2025): yoo-dress-rubric-aes-2025-source
- Zhang et al. (2026): zhang-gpt-essay-augmentation-2026-source
- Frohn et al. (2025): frohn-llm-cr-live-scoring-2025-source
- Bexte and Zesch (2025): bexte-zesch-synthetic-content-scoring-2025-source
- Do et al. (2026): do-misconception-faithfulness-2026-source
- Yuan et al. (2026): yuan-valid-student-simulation-framework-2026-source
- Martynova et al. (2025): martynova-human-learners-teacher-insights-2025-source

Graph-backed claims:

- ssr-scoring-validation-use-baseline-claim
- ssr-quality-evaluation-baseline-claim
- ssr-model-generation-effects-baseline-claim
- ssr-prompt-engineering-effects-baseline-claim
- ssr-real-response-comparison-baseline-claim
- ssr-synthetic-response-scoring-agreement-baseline-claim
- ssr-acceptable-scoring-uses-baseline-claim
- ssr-assessment-stakes-boundaries-baseline-claim
- ssr-sparse-data-supplementation-baseline-claim

Graph-backed findings most directly used for the model-choice lens:

- benedetto-skill-level-simulation-evaluation-finding-2026
- agent4edu-model-generation-effects-finding-2026
- srivatsa-model-prompt-irt-effects-finding-2026
- srivatsa-grade-enforcement-prompt-effects-finding-2026
- liu-llm-respondents-model-ensemble-finding-2026
- lu-generative-students-prompt-architecture-finding-2026
- wolfe-prompt-engineering-effects-finding-2026
- nguyen-cao-science-thinking-realism-model-effects-finding-2026
- scarlatos-post-training-effects-finding-2026
- do-misconception-faithfulness-off-the-shelf-limit-finding-2026
- yuan-epistemic-fidelity-model-choice-boundary-finding-2026
- martynova-teacher-authenticity-failure-finding-2025

Recent model-choice publication event:

- publish-ssr-model-choice-student-simulation-validity-update-2026-06-03-2026-06-03t20-20-40-207z

No remaining contextual web-checked source is used as support in this memo. Do et al. (2026), Yuan et al. (2026), and Martynova et al. (2025) have been promoted into source, artifact, finding, and review records.
