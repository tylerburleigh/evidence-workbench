# Synthetic Student Responses for Sparse Data Supplementation

Date: 2026-06-03
Domain: synthetic-student-responses
Scope: Qualitative trace synthesis for the published bundles `sparse-data-supplementation-baseline-2026-06-03` and `ssr-non-llm-constructed-response-augmentation-update-2026-06-03`.
Status: Unindexed sidecar synthesis; canonical conclusions are folded into the app-indexed literature review and domain synthesis report.

## Bottom Line

The reviewed baseline and follow-up update support a bounded qualitative answer: synthetic, simulated, transformed, feature-space, or image-augmented response data have been used to supplement sparse, imbalanced, or incomplete student-response datasets, including outside essay scoring and before recent LLM systems. The most common role is scorer-training augmentation or score/class balancing. Less often, synthetic responses are used to benchmark scorer behavior, probe subgroup fairness, refine rubrics, or validate the generation process before later scorer-training use.

This evidence should not be read as showing that synthetic responses directly validate a deployed scorer. In this bundle, scorer validation is usually indirect: generated responses help train, balance, benchmark, or stress a scoring workflow, while held-out real student responses, human scoring, or expert review remain important for validity claims.

Martin and Graulich can be included as a lower-detail chemistry/science-assessment example, but only to broaden the qualitative map. It should not carry quantitative conclusions, exact prompt/model claims, or detailed scorer-performance claims until full-text numeric and method extraction is completed. A 2026-06-03 full-text retrieval attempt remained blocked at abstract/metadata access from this workspace.

Bonthu et al. can be included as an abstract-level programming-ASAG example. It supports the existence of non-LLM text augmentation for limited short-answer data, but it should not carry detailed method or numeric synthesis until the full article is retrieved.

## Evidence Inventory

The synthesis draws on two published candidate bundles: `sparse-data-supplementation-baseline-2026-06-03` and `ssr-non-llm-constructed-response-augmentation-update-2026-06-03`.

- 11 published source records.
- 11 published study artifacts.
- 11 published findings.
- 1 published synthesis claim: `ssr-sparse-data-supplementation-baseline-claim`.
- 14 completed evidence-review lanes across the two bundles, all accepted and non-blocking.
- 2 non-blocking follow-up areas: obtain Martin and Graulich full text, and obtain Bonthu et al. full text before detailed quantitative or method-specific synthesis.

Evidence-review gate:

- `source_fidelity`: accepted.
- `construct_mapping`: accepted.
- `method_classification`: accepted.
- `scorer_validation_relevance`: accepted.
- `applicability_boundary`: accepted.
- `synthesis_overreach`: accepted.
- `search_protocol`: accepted.

## Question Status

Review question: How have synthetic student responses been used to supplement sparse, imbalanced, or incomplete student-response datasets, and what role did that synthetic data play in the research process?

Status: `answered_directionally`.

The evidence is strong enough for a qualitative evidence map across task types and research roles. It is not strong enough for a systematic-review prevalence claim or a quantitative cross-study effect estimate, because the search was targeted and the included studies vary by response format, scoring rubric, generation method, label source, task domain, and evaluation design.

## Source-by-Source Role Map

| Source | Response/task type | Sparse-data problem | Synthetic-data role | Strength in this synthesis |
| --- | --- | --- | --- | --- |
| Fang, Lee, and Zhai, `fang-gpt4-imbalanced-automatic-scoring-2025` | Middle-school science short constructed responses | Minority scoring classes were sparse | GPT-4 generated minority-class responses for scorer training augmentation and comparison with authentic minority-class responses | Strong non-essay example |
| Morris et al., `morris-naep-math-constructed-response-2025` | NAEP math constructed responses | Higher-scoring responses were underrepresented for some items | Coedit-XL paraphrases of high-scoring responses balanced training data before item-specific scorer fine-tuning | Strong constructed-response example |
| Cochran et al., `cochran-gpt35-student-text-augmentation-2023` | Small student text response datasets | Small labeled datasets and label imbalance | GPT-3.5 paraphrases augmented training data for multilingual BERT classifiers | Strong small-data text-classification example |
| Lun et al., `lun-mda-asas-short-answer-augmentation-2020` | Science automatic short-answer scoring | ASAS training data were limited and costly to collect | Back-translation, correct-answer reference augmentation, and swap variants supplemented SciEntsBank training data | Strong older/non-LLM short-answer example |
| Bonthu et al., `bonthu-transfer-augmentation-asag-2023` | Programming-domain ASAG | Limited domain-specific ASAG data | Random deletion, synonym replacement, random swap, backtranslation, and NLPAug supplemented sentence-transformer training | Useful direct ASAG example; abstract-level until full text is extracted |
| Krisnawati et al., `krisnawati-cross-prompt-asag-smote-2025` | Indonesian cross-prompt short-answer grading | Five-grade class distributions were imbalanced | Teaching assistants manually generated underrepresented responses and SMOTE generated feature-space samples | Strong manual plus feature-space ASAG example |
| Li, Haudek, and Krajcik, `li-scientific-models-smote-2025` | Student scientific-model scoring | Rubric categories had severe positive-class imbalance | SMOTE and image augmentation balanced training data for CNN scoring of scientific-model images | Strong adjacent non-text constructed-response example |
| Zhang et al., `zhang-gpt-generated-essay-augmentation-2026` | Essay scoring | Sparse score levels and subgroup sample-size concerns | GPT-4/GPT-4o essays augmented scorer training and supported performance and subgroup fairness analysis on held-out student essays | Strong essay-scoring example |
| Yoo et al., `yoo-dress-rubric-essay-scoring-2025` | EFL rubric-based essay scoring | Scarce low-score samples and limited rubric-based AES data | CASE corruption generated balanced synthetic training samples across score ranges | Strong essay-scoring/class-balancing example |
| Wolfe and Barber, `wolfe-barber-realistic-essay-augmentation-2026` | Grade 9 essay simulation | Sparse observations at score points motivate augmentation | Simulated essays were expert-scored and realism-rated to calibrate generation strategies before future scorer-training augmentation | Strong generation-quality validation example, not direct scorer validation |
| Martin and Graulich, `martin-graulich-science-assessment-2024` | Undergraduate chemistry reasoning | Diverse causal-reasoning data are resource-constrained | Chatbot paraphrases and generated responses expanded training-data size and heterogeneity | Useful breadth example; lower-detail until full text is extracted |

## Cross-Cutting Conclusions

1. Sparse-data supplementation is a real use case across multiple response formats.

The bundles include essay scoring, EFL rubric-based essay scoring, math constructed response, science short constructed response, chemistry reasoning, programming ASAG, cross-prompt ASAG, scientific-model scoring, and small student text classification. The non-essay examples are important because they show the pattern is not limited to automated essay scoring: Fang et al. use generated minority-class science responses, Morris et al. use generated/paraphrased high-scoring NAEP math responses, Cochran et al. augment small student text datasets, Lun et al. use pre-GPT back-translation and recombination for short-answer scoring, Krisnawati et al. combine manual response simulation with SMOTE, and Li et al. use SMOTE/image augmentation for scientific-model scoring.

Trace: `fang-gpt4-minority-class-scoring-finding-2025`; `morris-coedit-high-score-math-finding-2025`; `cochran-gpt35-small-data-finding-2023`; `lun-mda-asas-non-llm-short-answer-augmentation-finding-2020`; `krisnawati-smote-cross-prompt-asag-finding-2025`; `li-smote-scientific-models-imbalance-finding-2025`; `bonthu-non-llm-asag-augmentation-finding-2023`; `martin-graulich-chatbot-chemistry-finding-2024`.

2. Training augmentation and score/class balancing are the dominant roles.

Most studies use synthetic, transformed, simulated, or feature-space response data to increase training data, balance score distributions, or supplement minority classes before fitting or evaluating scoring/classification models. This role is clearest in Fang, Morris, Cochran, Lun, Krisnawati, Li, Zhang, and Yoo. The synthetic data is usually part of model development rather than an independent validation set.

Trace: `fang-gpt4-minority-science-response-augmentation-2025`; `morris-coedit-naep-math-high-score-augmentation-2025`; `cochran-gpt35-small-student-text-augmentation-2023`; `zhang-gpt4-gpt4o-essay-sample-augmentation-2026`; `yoo-case-efl-essay-augmentation-2025`.

3. Some studies use synthetic data to evaluate generation quality rather than to validate a scorer.

Wolfe and Barber are the cleanest example. They generate simulated essays and ask expert raters to score and judge realism. That supports calibration of generation strategies for future augmentation, not validation of a deployed automated scorer.

Trace: `wolfe-barber-realism-validation-finding-2026`; `wolfe-barber-essay-realism-calibration-2026`.

4. Benchmarking and fairness analysis appear, but they depend on real-response anchors.

Zhang et al. use generated essays in training and then examine scorer performance and subgroup fairness on held-out student essays. Fang et al. compare GPT-4 augmentation with additional authentic minority-class responses. These designs are stronger because synthetic data is evaluated against real-response anchors, but they still do not support synthetic-only validation.

Trace: `zhang-gpt-essay-augmentation-finding-2026`; `fang-gpt4-minority-class-scoring-finding-2025`.

5. Label provenance remains a boundary condition.

Some synthetic responses inherit labels from the generation target, the source example, a corruption process, or a prompt condition. That can be useful for training augmentation, but it is not the same as independent human scoring of every generated response. The synthesis should keep response origin, label source, and rubric label space separate.

Trace: `ssr-sparse-data-supplementation-baseline-claim`; evidence-review lanes `construct_mapping` and `synthesis_overreach`.

## Role Taxonomy for This Bundle

The reviewed evidence supports the following role categories:

| Role | Meaning in this bundle | Examples |
| --- | --- | --- |
| Training augmentation | Synthetic responses or transformed/feature-space variants are added to training data before scorer/classifier fitting | Fang; Morris; Cochran; Lun; Bonthu; Krisnawati; Li; Zhang; Yoo; Martin/Graulich |
| Score/class balancing | Synthetic responses or feature-space samples are generated for sparse score bands, minority classes, or underrepresented levels | Fang; Morris; Krisnawati; Li; Yoo; Zhang |
| Benchmark comparison | Synthetic augmentation is compared against real-response baselines or additional authentic responses | Fang; Zhang; Morris |
| Subgroup fairness analysis | Augmented scorer behavior is inspected for subgroup effects on held-out real essays | Zhang |
| Generation-quality validation | Synthetic outputs are human-scored, realism-rated, or otherwise checked before downstream augmentation use | Wolfe/Barber |
| Rubric refinement or heterogeneity expansion | Synthetic/paraphrased responses broaden training examples or categorization detail | Martin/Graulich, with lower extraction depth |
| Manual response simulation | Humans generate plausible additional answers for underrepresented score categories | Krisnawati |
| Feature-space or image augmentation | SMOTE or image transformations supplement imbalanced non-prose constructed-response data | Krisnawati; Li |

## How to Use Martin and Graulich

Martin and Graulich should be included in the synthesis, but with a limited role.

Supported use:

- It broadens the map beyond essay scoring and math/science short responses into undergraduate chemistry reasoning.
- It supports the high-level claim that chatbot-generated or paraphrased responses can be used to expand training-data size and heterogeneity when diverse student reasoning data are hard to collect.

Unsupported until full-text extraction:

- Exact sample-size claims.
- Exact model or prompt claims.
- Table-level machine-human agreement claims.
- Quantitative comparison against the other sources.
- Strong claims about scorer validation.

Recommended phrasing:

Martin and Graulich provide an additional chemistry/science-assessment example, but the current extraction supports only the high-level role of chatbot-based augmentation; full-text extraction is still needed before using it for numeric or method-specific conclusions.

Follow-up status:

- Full-text retrieval was attempted on 2026-06-03 through ScienceDirect browser/PDF routes, Elsevier text-mining links, DOI/DOAJ metadata, Unpaywall, OpenAlex, Semantic Scholar, and CORE.
- The attempt found open-access metadata but no retrievable article body or PDF from this workspace; ScienceDirect routes returned CAPTCHA/IP-block pages.
- The next viable route is a user-provided PDF, institutional access, or another primary full-text copy.

## Strength of Evidence

Stronger claims:

- Synthetic responses are used to supplement sparse or imbalanced student-response datasets.
- This use occurs outside essay scoring, especially in science short responses, NAEP math constructed responses, programming ASAG, cross-prompt ASAG, scientific-model scoring, and small student text response datasets.
- The practice is not limited to recent LLM work; older/non-LLM examples include back-translation, lexical augmentation, manual response simulation, SMOTE, and image augmentation.
- The dominant research role is training augmentation and label/score balancing.
- Some studies evaluate utility through downstream scorer/classifier performance on real held-out responses or comparisons with authentic additional responses.
- Synthetic-quality validation is a distinct role from scorer validation.

Weaker or bounded claims:

- The field-level prevalence of this practice is not known from this targeted pass.
- Quantitative effect sizes should not be synthesized across the current bundle.
- Martin/Graulich should not be used for numeric synthesis yet; the 2026-06-03 full-text follow-up did not retrieve article body or PDF content.
- Bonthu should not be used for detailed method or numeric synthesis yet; the current record is abstract-level.
- The evidence does not establish that synthetic responses can replace real student responses for final scorer validation.
- The evidence does not establish operational deployment readiness, cut-score validity, or subgroup fairness validity from synthetic responses alone.

## Draft Synthesis Paragraph

A targeted review found direct examples where synthetic, transformed, simulated, feature-space, or image-augmented response data are used to supplement sparse, imbalanced, or incomplete response datasets. The clearest pattern is training augmentation or score/class balancing: GPT-4-generated minority-class science responses in Fang et al., Coedit-XL high-score NAEP math response augmentation in Morris et al., GPT-3.5 augmentation of small student text response datasets in Cochran et al., pre-GPT back-translation and recombination for short-answer scoring in Lun et al., manual response simulation and SMOTE in Krisnawati et al., SMOTE/image augmentation for scientific models in Li et al., GPT-4/GPT-4o essay augmentation in Zhang et al., and CASE synthetic EFL essay generation in Yoo et al. The evidence also includes generation-quality validation, especially Wolfe and Barber's expert scoring and realism checks for simulated essays before future automated-scoring data augmentation. Martin and Graulich add a lower-detail chemistry-reasoning example, and Bonthu et al. add an abstract-level programming-ASAG example, but both need full-text extraction before numeric or method-specific synthesis. Overall, synthetic data in this literature is best understood as developmental support for training, balancing, benchmarking, fairness probing, rubric refinement, or generation calibration, not as stand-alone validation of deployed automated scorers.

## Open Questions

1. How far back does non-LLM short-answer and constructed-response augmentation extend beyond the examples now captured?
2. How often are high-score or minority-class synthetic responses independently human-scored before use?
3. Which response formats show consistent improvement from synthetic augmentation when held-out real student responses are used for evaluation?
4. Can synthetic augmentation improve subgroup fairness, or does it mainly reveal scorer sensitivity under diagnostic stress tests?
5. Which studies compare synthetic augmentation against the cost-equivalent collection of additional authentic student responses?
6. What reporting checklist should be required for sparse-data supplementation studies: response origin, generation method, label source, target class, comparator data, held-out real evaluation, and consequence level?

## Next Actions

1. Use this draft synthesis as the current answer to the sparse-data supplementation question.
2. Keep Martin/Graulich and Bonthu in the qualitative map but exclude them from numeric or method-specific conclusions until full-text extraction is complete via a user-provided PDF, institutional access, or another primary full-text route.
3. Citation-chain Lun, Fang, Zhang, Morris, and Krisnawati if this becomes a systematic or scoping pass.
4. Keep the canonical conclusions folded into the current literature review and domain-wide synthesis report unless a separate app-visible report is explicitly requested.

## Disposition

Target reports:

- `ssr-background-lit-review-2026-06-03`
- `ssr-synthesis-2026-06-03`

Integration trigger:

- Bundles `sparse-data-supplementation-baseline-2026-06-03` and `ssr-non-llm-constructed-response-augmentation-update-2026-06-03` are approved and published.

Post-integration handling:

- Keep this sidecar unindexed as traceability for the sparse-data supplementation research pass, unless the user explicitly requests deletion or promotion to a draft report artifact.

## Traceability

Candidate bundle:

- `sparse-data-supplementation-baseline-2026-06-03`
- `ssr-non-llm-constructed-response-augmentation-update-2026-06-03`

Staged synthesis claim:

- `ssr-sparse-data-supplementation-baseline-claim`

Finding IDs:

- `fang-gpt4-minority-class-scoring-finding-2025`
- `morris-coedit-high-score-math-finding-2025`
- `martin-graulich-chatbot-chemistry-finding-2024`
- `cochran-gpt35-small-data-finding-2023`
- `zhang-gpt-essay-augmentation-finding-2026`
- `yoo-case-score-balance-finding-2025`
- `wolfe-barber-realism-validation-finding-2026`
- `lun-mda-asas-non-llm-short-answer-augmentation-finding-2020`
- `bonthu-non-llm-asag-augmentation-finding-2023`
- `krisnawati-smote-cross-prompt-asag-finding-2025`
- `li-smote-scientific-models-imbalance-finding-2025`

Source IDs:

- `fang-gpt4-imbalanced-automatic-scoring-2025`
- `morris-naep-math-constructed-response-2025`
- `martin-graulich-science-assessment-2024`
- `cochran-gpt35-student-text-augmentation-2023`
- `zhang-gpt-generated-essay-augmentation-2026`
- `yoo-dress-rubric-essay-scoring-2025`
- `wolfe-barber-realistic-essay-augmentation-2026`
- `lun-mda-asas-short-answer-augmentation-2020`
- `bonthu-transfer-augmentation-asag-2023`
- `krisnawati-cross-prompt-asag-smote-2025`
- `li-scientific-models-smote-2025`

Evidence review IDs:

- `evidence-review-ssr-sparse-data-supplementation-source-fidelity-r1`
- `evidence-review-ssr-sparse-data-supplementation-construct-mapping-r1`
- `evidence-review-ssr-sparse-data-supplementation-method-classification-r1`
- `evidence-review-ssr-sparse-data-supplementation-scorer-validation-relevance-r1`
- `evidence-review-ssr-sparse-data-supplementation-applicability-boundary-r1`
- `evidence-review-ssr-sparse-data-supplementation-synthesis-overreach-r1`
- `evidence-review-ssr-sparse-data-supplementation-search-protocol-r1`
- `evidence-review-ssr-non-llm-cr-augmentation-source-fidelity-r1`
- `evidence-review-ssr-non-llm-cr-augmentation-construct-mapping-r1`
- `evidence-review-ssr-non-llm-cr-augmentation-method-classification-r1`
- `evidence-review-ssr-non-llm-cr-augmentation-scorer-validation-relevance-r1`
- `evidence-review-ssr-non-llm-cr-augmentation-applicability-boundary-r1`
- `evidence-review-ssr-non-llm-cr-augmentation-synthesis-overreach-r1`
- `evidence-review-ssr-non-llm-cr-augmentation-search-protocol-r1`

Publication events:

- `publish-sparse-data-supplementation-baseline-2026-06-03-2026-06-03t15-21-48-538z`
- `publish-ssr-non-llm-constructed-response-augmentation-update-2026-06-03-2026-06-03t16-43-08-294z`
