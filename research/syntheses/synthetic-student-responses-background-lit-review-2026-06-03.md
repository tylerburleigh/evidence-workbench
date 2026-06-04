# Synthetic Student Responses: Literature Review

Date: 2026-06-03
Domain: synthetic-student-responses
Scope: Manuscript-facing literature review prose based on already-published source, finding, and claim records in the synthetic student responses evidence graph.

Citation note: inline citations use readable author-year labels. The traceability section maps each citation label to the corresponding source record ID.

## Literature Review

Synthetic student responses are increasingly studied as materials for educational-AI development, learner simulation, item development, feedback-system testing, and automated-scoring research. The current literature spans constructed responses, essays, short answers, multiple-choice item responses, tutoring-dialogue turns, scientific ideas, simulated learner utterances, programming solutions, student models, and misconception-specific mathematics tasks (Ipci et al., 2025; Gao et al., 2025; Yoo et al., 2025; Lu & Wang, 2024; Scarlatos et al., 2026; Nguyen & Cao, 2026; Cao et al., 2026; Wu et al., 2025; Do et al., 2026; Martynova et al., 2025). Across these settings, the most defensible interpretation is narrow: synthetic responses can support development, augmentation, QA, stress testing, calibration, and generation-quality evaluation, but they do not by themselves replace real student responses or independently human-scored data for scorer validation.

### Generation Roles

Studies generate synthetic responses through several method families. Some use knowledge profiles, learner profiles, memory, reflection, or action modules to create learner-like responses (Ipci et al., 2025; Gao et al., 2025). Others condition generation on response quality, rubric score, known error type, or formative-feedback scenario (Watts et al., 2025; Yoo et al., 2025). Essay-focused work includes corruption-based rubric manipulations and prompt strategies that simulate essays from real source essays (Yoo et al., 2025; Wolfe & Barber, 2026). More recent simulated-learner studies compare few-shot prompting, multi-agent generation, DPO, GRPO, history-aware profiles, and cognitive-prototype conditioning, but those comparisons remain tied to specific response formats and evaluation targets (Scarlatos et al., 2026; Duan et al., 2026; Cao et al., 2026; Wu et al., 2025).

Sparse-data supplementation is a distinct and recurring role. Synthetic, simulated, transformed, feature-space, or image-augmented responses have been used when real response data are sparse, imbalanced, costly, or missing in important score regions. This pattern is not confined to essay scoring. Earlier automatic short-answer scoring work used back-translation, correct-answer reference augmentation, and recombination to expand limited SciEntsBank training data (Lun et al., 2020). Constructed-response studies use generated or paraphrased responses to strengthen underrepresented training regions: Fang et al. (2025) generate minority-class science responses and compare them with additional authentic minority-class responses, while Morris et al. (2025) augment underrepresented high-scoring NAEP mathematics responses before item-level scorer fine-tuning. Related non-essay examples include GPT-3.5 augmentation of small student text datasets, teaching-assistant-generated answers plus SMOTE for cross-prompt ASAG, SMOTE and image augmentation for student scientific-model scoring, and abstract-level programming ASAG augmentation evidence (Cochran et al., 2023; Krisnawati et al., 2025; Li et al., 2025; Bonthu et al., 2023).

Essay-scoring studies follow the same sparse-data logic while raising their own validity questions. Zhang et al. (2026) use GPT-generated essays for scorer training and subgroup analysis while evaluating on held-out real essays; Yoo et al. (2025) use synthetic corruption to balance rubric-score distributions while reserving real essays for validation and testing; and Wolfe and Barber (2026) use expert scoring and realism ratings to calibrate simulated essay generation before future augmentation use. Martin and Graulich (2024) add a chemistry-reasoning example, but it remains lower-detail evidence until full-text extraction is available. Taken together, the sparse-data literature supports training, balancing, benchmarking, stress testing, and generation calibration. It does not support the stronger claim that synthetic responses validate a scorer on their own.

### Realism and Model Choice

The literature treats response realism as multidimensional rather than as a single property. Studies evaluate synthetic-response quality through diversity, embedding or PCA proximity to authentic responses, expert scores, score-distribution similarity, human realism ratings, profile alignment, real-response correlations, IRT ability-scale alignment, item-difficulty agreement, dialogue fidelity, grade-level language, knowledge scope, teacher perceptions, cognitive-level variation, and mistake-pattern plausibility (Ipci et al., 2025; Wolfe & Barber, 2026; Gao et al., 2025; Lu & Wang, 2024; Srivatsa et al., 2025; Scarlatos et al., 2026; Nguyen & Cao, 2026; Cao et al., 2026; Wu et al., 2025). A synthetic response set can therefore look plausible under one metric while failing another. For example, a response may be believable to a reader but still misaligned with psychometric ability, misconception faithfulness, learner-state fidelity, or downstream scoring utility.

Real-response and expert comparators sharpen this boundary. Learner-agent responses have been compared with real learning histories, simulated essays with real source essays, GPT-4 simulated profiles with real item responses, LLM proxy students with aggregate NAEP response patterns, LLM respondents with undergraduate College Algebra response distributions, and simulated tutoring turns with real dialogue turns (Gao et al., 2025; Wolfe & Barber, 2026; Lu & Wang, 2024; Srivatsa et al., 2025; Liu et al., 2025; Scarlatos et al., 2026; Duan et al., 2026). Other studies compare generated science ideas with lesson ideas grounded in pilot implementation and teacher consultation, use expert coding of simulated mathematical-learner authenticity, or compare synthetic-response item-difficulty estimates against human-scored real-response IRT estimates (Nguyen & Cao, 2026; Cao et al., 2026; Scarlatos et al., 2025). These designs are valuable because they name the comparator, but they do not establish that synthetic and real responses are interchangeable across tasks, populations, rubrics, or uses.

Evidence about language-model choice and prompting is similarly task-bound. Gao et al. (2025) report an exploratory GPT-4 condition outperforming GPT-3.5-turbo in a smaller Agent4Edu setting, but that comparison is embedded in a profile, memory, reflection, and action workflow. Srivatsa et al. (2025) test 11 LLMs and grade-enforced prompts on NAEP items and find model- and prompt-specific variation without a reliable proxy-student solution. Liu et al. (2025) compare six LLM respondent generators and resampling or ensemble strategies for College Algebra item evaluation, finding that item-calibration correlations can coexist with narrower-than-human proficiency distributions. Nguyen and Cao (2026) provide direct six-model evidence for open-ended science ideas, but the results are tied to lesson-context prompting and instructional-planning use. Prompt studies show that essay prompt strategies, grade enforcement, role or profile framing, examples, and typo- or quality-conditioned prompts change generated response behavior, but the evidence supports model and workflow sensitivity rather than a general ranking of model families or prompt recipes (Wolfe & Barber, 2026; Srivatsa et al., 2025; Lu & Wang, 2024; Watts et al., 2025).

Recent student-simulation validity work makes the same point more sharply. Yuan et al. (2026) argue that valid LLM student simulation should specify the learner's epistemic state, because broadly capable models cannot simply be assumed to emulate partial knowledge. Do et al. (2026) show that prompted instruction-tuned LLM simulators can fail misconception faithfulness by correcting answers under feedback rather than maintaining targeted misconception-specific belief states. Martynova et al. (2025) show that teachers tutoring GPT-3.5-turbo simulated learners identified authenticity gaps involving language complexity, limited emotion, unnatural attentiveness, repetition, inconsistency, and abrupt strategy shifts. The practical implication is not that a particular current model is best. It is that model choice should be reported with the response target, learner-state assumptions, prompt or workflow, comparator, and quality metric.

### Scoring and Validity Boundaries

For automated scoring, the strongest evidence supports synthetic responses as developmental, diagnostic, or training-augmentation materials rather than replacement validation data. Frohn et al. (2025) describe synthetic constructed responses as useful for pre-pilot scorer checks, challenge sets, item revision, and scoring-criteria refinement, while preserving a role for real student responses in pilot validation. Yoo et al. (2025) and Zhang et al. (2026) reserve real essays for validation or testing when synthetic essays are used for training augmentation. Wolfe and Barber (2026) use expert scoring and realism checks to calibrate generated essays before downstream augmentation, which supports generation-quality validation rather than deployed-scorer validation. Scarlatos et al. (2025) provide a scoring-adjacent item-development example in which synthetic responses are aligned with IRT ability, scored with an LLM-based scoring model, and evaluated against human-scored real-response difficulty estimates; the evidentiary strength comes from the real-response anchors and comparison design, not from synthetic responses alone.

Label provenance is a gating issue in these workflows. Synthetic labels may be inherited from a generation target, assigned by a prompt, produced by corruption rules, transferred from a source response, or supplied by another model. Bexte and Zesch (2025) show that prompt-requested labels on generated short answers require audit or relabeling before supervised content-scoring use. Nebhi et al. (2025) incorporate LLM annotation in an automated item generation and scoring pipeline, but benchmark model annotations against expert human ratings. The common lesson is that response origin and label origin need to be separated: synthetic responses with unaudited labels are weak evidence for scoring validity.

Assessment stakes further constrain acceptable use. The Standards for Educational and Psychological Testing frame validity around intended score interpretation, use, and consequences, and responsible-AI assessment guidance emphasizes validity, fairness, transparency, human oversight, and monitoring when AI-supported scoring becomes operational (AERA, APA, & NCME, 2014; ETS, 2024). In lower-stakes formative contexts, synthetic responses may be useful for prototype testing, feedback-system development, and scorer-training augmentation because the immediate consequence is feedback or instructional support (Watts et al., 2025; Rezayi et al., 2025; U.S. Department of Education TEAL Center, n.d.). Classroom and in-term examples, such as Djagba et al. (2026), support rare-category augmentation under held-out real-response evaluation, but they do not remove the need for additional checks when scores affect grades.

In higher-stakes, summative, admissions, or deployment-readiness contexts, the supported role is narrower. The New Mexico MSSA technical report documents LLM-generated synthetic Writing responses used to supplement sparse high-score training examples after scoring-staff review and state approval, which supports controlled training augmentation but not synthetic-only validation (Cognia, 2025). New Meridian process guidance and the Spring 2024 Maine Science Assessment technical report document simulated student responses as machine-scoring QA or item-authoring review materials for checking scoring rules, scanning rules, and machine-scored output; this supports operational rule-QA/test-suite use, not validation of an LLM or statistical scoring model (New Meridian, 2020; Maine Department of Education, 2025). Walsh et al. (2026) use synthetic demographic analogs to probe open-response situational judgment scoring, which is best interpreted as diagnostic fairness stress testing rather than subgroup fairness validation with real examinee data. Wang et al. (2019) provide adjacent high-stakes evidence for constructed off-topic detection cases, but that evidence concerns validity protection rather than automated scoring of regular on-topic responses.

### Limitations and Implications

The current source base is best read as a targeted evidence map rather than a systematic review. Studies differ in response format, learner population, task domain, generation method, model and prompt reporting, evaluation metric, label source, and real-response comparator, which limits cross-study generalization (Ipci et al., 2025; Gao et al., 2025; Yoo et al., 2025; Srivatsa et al., 2025; Scarlatos et al., 2026; Do et al., 2026; Martynova et al., 2025). Direct evidence now exists for one operational state summative LLM training-augmentation workflow, operational simulated-response QA in rule-based machine scoring, and multiple sparse-data supplementation examples, including older and non-LLM short-answer and constructed-response work. Evidence remains thin for synthetic-only operational validation, grade-bearing classroom use, accountability testing beyond narrow support roles, certification, licensure, placement, promotion, subgroup fairness validation, current-model rankings for student simulation, and vendor or testing-program policy for synthetic validation data (Cognia, 2025; New Meridian, 2020; Maine Department of Education, 2025; Fang et al., 2025; Morris et al., 2025; Lun et al., 2020; Krisnawati et al., 2025; Li et al., 2025; Bonthu et al., 2023; Frohn et al., 2025; Walsh et al., 2026; ETS, 2024; AERA, APA, & NCME, 2014; Yuan et al., 2026).

For the present study, the literature supports positioning synthetic responses as development, QA, stress-test, item-development, or augmentation materials rather than as stand-alone validation data. A defensible workflow should document how responses were generated or simulated, which model or workflow was used, what learner knowledge state, misconception, response quality level, or rubric region the generation targeted, why sparse or imbalanced data required augmentation, how labels or expected machine-scored outputs were produced or audited, what real-response comparator was used, whether validation data are independent of synthetic training rows, how scoring agreement was evaluated, which realism metrics were checked, and what assessment purpose and consequence level the evidence is intended to support (Frohn et al., 2025; Yoo et al., 2025; Bexte & Zesch, 2025; Nebhi et al., 2025; Cognia, 2025; New Meridian, 2020; Maine Department of Education, 2025; Fang et al., 2025; Morris et al., 2025; Cochran et al., 2023; Lun et al., 2020; Krisnawati et al., 2025; Li et al., 2025; Zhang et al., 2026; Scarlatos et al., 2025; Nguyen & Cao, 2026; Cao et al., 2026; Wu et al., 2025; Walsh et al., 2026; Do et al., 2026; Yuan et al., 2026; Martynova et al., 2025).

## Traceability

Citation labels and source records:

- AERA, APA, & NCME (2014): standards-educational-psychological-testing-2014-source
- Bexte & Zesch (2025): bexte-zesch-synthetic-content-scoring-2025-source
- Cognia (2025): new-mexico-mssa-technical-report-2025-source
- Djagba et al. (2026): djagba-ngss-classroom-augmentation-2026-source
- Do et al. (2026): do-misconception-faithfulness-2026-source
- Duan et al. (2026): duan-history-aware-profiles-student-simulation-2026-source
- ETS (2024): ets-responsible-ai-assessment-principles-2024-source
- Fang et al. (2025): fang-gpt4-imbalanced-automatic-scoring-2025
- Frohn et al. (2025): frohn-llm-cr-live-scoring-2025-source
- Gao et al. (2025): agent4edu-learner-response-generation-2025-source
- Ipci et al. (2025): ipci-knowledge-profiles-response-generation-2025-source
- Bonthu et al. (2023): bonthu-transfer-augmentation-asag-2023
- Krisnawati et al. (2025): krisnawati-cross-prompt-asag-smote-2025
- Li et al. (2025): li-scientific-models-smote-2025
- Lun et al. (2020): lun-mda-asas-short-answer-augmentation-2020
- Liu et al. (2025): liu-llm-respondents-item-evaluation-2025-source
- Lu & Wang (2024): lu-generative-students-item-evaluation-2024-source
- Maine Department of Education (2025): maine-science-assessment-2024-technical-report-source
- Martin & Graulich (2024): martin-graulich-science-assessment-2024
- Martynova et al. (2025): martynova-human-learners-teacher-insights-2025-source
- Nebhi et al. (2025): nebhi-adaptive-writing-aig-scoring-2025-source
- Morris et al. (2025): morris-naep-math-constructed-response-2025
- New Meridian (2020): new-meridian-standard-processes-2020-source
- Nguyen & Cao (2026): nguyen-cao-science-thinking-simulation-2026-source
- Rezayi et al. (2025): rezayi-communication-skills-synthetic-training-2025-source
- Scarlatos et al. (2025): scarlatos-smart-irt-simulated-students-2025-source
- Scarlatos et al. (2026): scarlatos-simulated-students-dialogue-2026-source
- Srivatsa et al. (2025): srivatsa-llm-student-ability-simulation-2025-source
- U.S. Department of Education TEAL Center (n.d.): usdoe-teal-formative-assessment-source
- Wang et al. (2019): wang-off-topic-spoken-responses-2019-source
- Walsh et al. (2026): walsh-sjt-automated-scoring-2026-source
- Watts et al. (2025): watts-scientific-argumentation-chatbot-2025-source
- Wolfe & Barber (2026): wolfe-calibrating-realistic-essays-2026-source
- Wolfe & Barber (2026, sparse-data bundle): wolfe-barber-realistic-essay-augmentation-2026
- Wu et al. (2025): wu-embracing-imperfection-student-agents-2025-source
- Yoo et al. (2025): yoo-dress-rubric-aes-2025-source
- Yoo et al. (2025, sparse-data bundle): yoo-dress-rubric-essay-scoring-2025
- Yuan et al. (2026): yuan-valid-student-simulation-framework-2026-source
- Zhang et al. (2026): zhang-gpt-essay-augmentation-2026-source
- Zhang et al. (2026, sparse-data bundle): zhang-gpt-generated-essay-augmentation-2026
- Cochran et al. (2023): cochran-gpt35-student-text-augmentation-2023
- Cao et al. (2026): cao-nguyen-math-simulated-learners-2026-source

Supporting synthesis records:

- ssr-scoring-validation-use-baseline-claim
- ssr-generation-methods-baseline-claim
- ssr-quality-evaluation-baseline-claim
- ssr-model-generation-effects-baseline-claim
- ssr-prompt-engineering-effects-baseline-claim
- ssr-real-response-comparison-baseline-claim
- ssr-synthetic-response-scoring-agreement-baseline-claim
- ssr-acceptable-scoring-uses-baseline-claim
- ssr-assessment-stakes-boundaries-baseline-claim
- ssr-sparse-data-supplementation-baseline-claim

Publication events for update bundles folded into this review:

- publish-ssr-assessment-stakes-boundaries-consequential-update-2026-06-03-2026-06-03t11-54-31-750z
- publish-ssr-acceptable-scoring-uses-operational-augmentation-update-2026-06-03-2026-06-03t12-07-08-257z
- publish-ssr-operational-practice-policy-update-2026-06-03-2026-06-03t13-26-26-193z
- publish-sparse-data-supplementation-baseline-2026-06-03-2026-06-03t15-21-48-538z
- publish-ssr-non-llm-constructed-response-augmentation-update-2026-06-03-2026-06-03t16-43-08-294z
- publish-ssr-validity-conditions-controlled-comparisons-update-2026-06-03-2026-06-03t19-28-50-265z
- publish-ssr-validity-conditions-claim-hardening-update-2026-06-03-2026-06-03t19-42-15-556z
- publish-ssr-model-choice-student-simulation-validity-update-2026-06-03-2026-06-03t20-20-40-207z
