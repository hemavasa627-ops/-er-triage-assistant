# DMGT: Discrete Mathematics & Graph Theory Foundations

## 1. Propositional Logic Formulation

In discrete mathematics, propositional logic models propositions that can evaluate to either `TRUE` or `FALSE`.
In the ER Triage Assistant, clinical rules are structured as logical implications:

$$\Phi \implies \Psi$$

Where:
- $\Phi$ is an antecedent compound predicate representing physiological measurements and observed patient tokens.
- $\Psi$ is the consequent provisional triage category $\tau \in \{ \text{Level 1 (Red)}, \text{Level 2 (Orange)}, \text{Level 3 (Yellow)}, \text{Level 4 (Green)} \}$.

### Level 1 (Resuscitation / Immediate) Predicate
Let:
- $P_1$: $\text{SpO}_2 < 90\%$ (Critical Hypoxemia)
- $P_2$: $\text{CrushingChestPain} \lor \text{Unconscious} \lor \text{CardiacArrest}$ (Acute Coronary / Collapse Alarm)
- $P_3$: $\text{SBP} < 80 \lor \text{HR} > 150 \lor \text{HR} < 40$ (Hemodynamic Collapse)

Then:
$$\Phi_{\text{Emergency}} = P_1 \lor P_2 \lor P_3$$
$$\Phi_{\text{Emergency}} \implies \text{Priority} = \text{LEVEL\_1\_RESUSCITATION}$$

---

## 2. Decidability and Missing Values

A fundamental challenge in medical proposition evaluation is **incomplete knowledge** (missing variables).
In classic 2-valued Boolean logic:
$$\text{eval}(P_1) \in \{ \text{True}, \text{False} \}$$

When a vital sign $x$ is missing ($\text{is\_null}(x)$):
- The proposition $x < \theta$ is **NOT** coerced to False or True.
- The evaluation engine marks the variable as **UNKNOWN / MISSING**.
- The missing proposition cannot trigger a rule, but a meta-predicate logs $x$ into `missing_information`.
- Triage staff are warned that the decision is derived from partial observations.
